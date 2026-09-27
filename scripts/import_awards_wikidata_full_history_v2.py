from __future__ import annotations

import argparse
import json
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AWARDS_PATH = ROOT / "data" / "awards.json"
ENDPOINT = "https://query.wikidata.org/sparql"
USER_AGENT = "CinemapAwardsImporter/1.2 (https://github.com/vongolebianco7/cinema-calendar)"

FAMILIES = {
    "アカデミー賞": (1929, "?award wdt:P31 wd:Q19020 ."),
    "BAFTA": (1948, "{ ?award wdt:P31 wd:Q732997 } UNION { ?award wdt:P361 wd:Q732997 }"),
    "ゴールデングローブ賞": (1944, "{ ?award wdt:P31 wd:Q1011547 } UNION { ?award wdt:P361 wd:Q1011547 }"),
    "カンヌ国際映画祭": (1946, '''{ ?award wdt:P1027 wd:Q42369 } UNION { ?award rdfs:label ?awardEnglish . FILTER(LANG(?awardEnglish)="en") FILTER(REGEX(?awardEnglish,"Cannes|Palme d'Or|Short Film Palme d'Or","i")) }'''),
    "ヴェネチア国際映画祭": (1932, '''{ ?award wdt:P1027 wd:Q49024 } UNION { ?award rdfs:label ?awardEnglish . FILTER(LANG(?awardEnglish)="en") FILTER(REGEX(?awardEnglish,"Venice Film Festival|Golden Lion|Silver Lion|Volpi Cup","i")) }'''),
    "ベルリン国際映画祭": (1951, '''{ ?award wdt:P1027 wd:Q130871 } UNION { ?award rdfs:label ?awardEnglish . FILTER(LANG(?awardEnglish)="en") FILTER(REGEX(?awardEnglish,"Berlin International Film Festival|Golden Bear|Silver Bear","i")) }'''),
}

CATEGORY_RENAMES = {
    "Academy Award for Best Picture": "作品賞",
    "Academy Award for Best Director": "監督賞",
    "Academy Award for Best Actor": "主演男優賞",
    "Academy Award for Best Actress": "主演女優賞",
    "Academy Award for Best Supporting Actor": "助演男優賞",
    "Academy Award for Best Supporting Actress": "助演女優賞",
    "Palme d'Or": "パルム・ドール",
    "Golden Lion": "金獅子賞",
    "Golden Bear": "金熊賞",
}

PREFIXES = '''
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX p: <http://www.wikidata.org/prop/>
PREFIX ps: <http://www.wikidata.org/prop/statement/>
PREFIX pq: <http://www.wikidata.org/prop/qualifier/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX bd: <http://www.bigdata.com/rdf#>
PREFIX wikibase: <http://wikiba.se/ontology#>
'''


def family_query(selector: str, start_year: int, end_year: int) -> str:
    return PREFIXES + f'''
SELECT DISTINCT ?award ?awardLabel ?recipient ?recipientLabel ?work ?workLabel ?date WHERE {{
  {selector}
  ?recipient p:P166 ?awardStatement .
  ?awardStatement ps:P166 ?award .
  OPTIONAL {{ ?awardStatement pq:P1686 ?work . }}
  OPTIONAL {{ ?awardStatement pq:P585 ?statementDate . }}
  OPTIONAL {{
    ?awardStatement pq:P805 ?edition .
    OPTIONAL {{ ?edition wdt:P585 ?editionPoint . }}
    OPTIONAL {{ ?edition wdt:P580 ?editionStart . }}
    OPTIONAL {{ ?edition wdt:P577 ?editionPublication . }}
  }}
  OPTIONAL {{ ?recipient wdt:P577 ?recipientDate . }}
  BIND(COALESCE(?statementDate, ?editionPoint, ?editionStart, ?editionPublication, ?recipientDate) AS ?date)
  FILTER(BOUND(?date))
  FILTER(YEAR(?date) >= {start_year} && YEAR(?date) <= {end_year})
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "ja,en" . }}
}}
ORDER BY ?date ?awardLabel ?recipientLabel
'''


def fetch_sparql(query: str, retries: int = 3) -> dict:
    body = urllib.parse.urlencode({"query": query, "format": "json"}).encode("utf-8")
    req = urllib.request.Request(
        ENDPOINT,
        data=body,
        method="POST",
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/sparql-results+json",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
    )
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=75) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception:
            if attempt + 1 == retries:
                raise
            time.sleep(4 * (attempt + 1))
    raise RuntimeError("unreachable")


def normalize(organization: str, b: dict) -> dict | None:
    def val(name: str) -> str:
        return (b.get(name, {}).get("value") or "").strip()

    award_label, recipient, work, date = val("awardLabel"), val("recipientLabel"), val("workLabel"), val("date")
    if not award_label or not recipient or len(date) < 4:
        return None
    try:
        year = int(date[:4])
    except ValueError:
        return None
    award_uri, recipient_uri = val("award"), val("recipient")
    return {
        "year": year,
        "organization": organization,
        "category": CATEGORY_RENAMES.get(award_label, award_label),
        "title": f"{work} — {recipient}" if work and work != recipient else recipient,
        "source": award_uri or recipient_uri or "https://www.wikidata.org/",
        "data_source": "Wikidata (CC0)",
        "wikidata_award": award_uri,
        "wikidata_recipient": recipient_uri,
    }


def collect(global_start: int, end_year: int, chunk_years: int = 10) -> list[dict]:
    rows: list[dict] = []
    for organization, (family_floor, selector) in FAMILIES.items():
        start = max(global_start, family_floor)
        while start <= end_year:
            end = min(end_year, start + chunk_years - 1)
            print(f"querying {organization}: {start}-{end}", flush=True)
            payload = fetch_sparql(family_query(selector, start, end))
            bindings = payload.get("results", {}).get("bindings", [])
            usable = [r for r in (normalize(organization, b) for b in bindings) if r]
            rows.extend(usable)
            print(f"  {len(usable)} usable rows", flush=True)
            start = end + 1
            time.sleep(0.8)
    return rows


def merge(existing: list[dict], additions: list[dict]) -> tuple[list[dict], int]:
    result = list(existing)
    keys = {(int(r.get("year", 0)), r.get("organization", ""), r.get("category", ""), r.get("title", "")) for r in result}
    added = 0
    for r in additions:
        key = (r["year"], r["organization"], r["category"], r["title"])
        if key not in keys:
            keys.add(key)
            result.append(r)
            added += 1
    order = {"アカデミー賞": 0, "カンヌ国際映画祭": 1, "ヴェネチア国際映画祭": 2, "ベルリン国際映画祭": 3, "ゴールデングローブ賞": 4, "BAFTA": 5}
    result.sort(key=lambda r: (-int(r["year"]), order.get(r["organization"], 99), r["category"], r["title"]))
    return result, added


def validate(rows: list[dict]) -> None:
    assert rows
    for r in rows:
        assert isinstance(r.get("year"), int) and r.get("organization") and r.get("category") and r.get("title") and r.get("source")
    floors = {"アカデミー賞": 1930, "カンヌ国際映画祭": 1955, "ヴェネチア国際映画祭": 1950, "ベルリン国際映画祭": 1955, "ゴールデングローブ賞": 1950, "BAFTA": 1955}
    for org, floor in floors.items():
        assert any(r["organization"] == org and r["year"] <= floor for r in rows), f"historical floor missing: {org}"


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--start-year", type=int, default=1929)
    p.add_argument("--end-year", type=int, default=datetime.now(timezone.utc).year)
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()
    data = json.loads(AWARDS_PATH.read_text(encoding="utf-8"))
    merged, added = merge(data.get("awards", []), collect(args.start_year, args.end_year))
    validate(merged)
    counts = {}
    for r in merged:
        counts[r["organization"]] = counts.get(r["organization"], 0) + 1
    print("counts", json.dumps(counts, ensure_ascii=False, sort_keys=True), flush=True)
    print(f"new rows={added} total rows={len(merged)}", flush=True)
    if args.dry_run:
        return
    data["awards"] = merged
    data["generated_at"] = datetime.now(timezone.utc).date().isoformat()
    data["note"] = "主催者公式確認データにWikidata（CC0）の構造化データを統合。主要6賞を取得可能な範囲で創設期まで遡って収録。開催中止・未創設部門は補完しない。"
    AWARDS_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
