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
USER_AGENT = "CinemapAwardsImporter/1.1 (https://github.com/vongolebianco7/cinema-calendar)"

# One query per family is intentionally used instead of one giant UNION query.
# It is faster, easier on WDQS, and a single family can fail/retry independently.
FAMILIES = {
    "アカデミー賞": {
        "start": 1929,
        "selector": "?award wdt:P31 wd:Q19020 .",
    },
    "BAFTA": {
        "start": 1948,
        "selector": "{ ?award wdt:P31 wd:Q732997 } UNION { ?award wdt:P361 wd:Q732997 }",
    },
    "ゴールデングローブ賞": {
        "start": 1944,
        "selector": "{ ?award wdt:P31 wd:Q1011547 } UNION { ?award wdt:P361 wd:Q1011547 }",
    },
    "カンヌ国際映画祭": {
        "start": 1946,
        "selector": '''
          { ?award wdt:P1027 wd:Q42369 }
          UNION {
            ?award rdfs:label ?awardEnglish .
            FILTER(LANG(?awardEnglish) = "en")
            FILTER(REGEX(?awardEnglish, "Cannes|Palme d'Or|Short Film Palme d'Or", "i"))
          }
        ''',
    },
    "ヴェネチア国際映画祭": {
        "start": 1932,
        "selector": '''
          { ?award wdt:P1027 wd:Q49024 }
          UNION {
            ?award rdfs:label ?awardEnglish .
            FILTER(LANG(?awardEnglish) = "en")
            FILTER(REGEX(?awardEnglish, "Venice Film Festival|Golden Lion|Silver Lion|Volpi Cup", "i"))
          }
        ''',
    },
    "ベルリン国際映画祭": {
        "start": 1951,
        "selector": '''
          { ?award wdt:P1027 wd:Q130871 }
          UNION {
            ?award rdfs:label ?awardEnglish .
            FILTER(LANG(?awardEnglish) = "en")
            FILTER(REGEX(?awardEnglish, "Berlin International Film Festival|Golden Bear|Silver Bear", "i"))
          }
        ''',
    },
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


def family_query(organization: str, selector: str, start_year: int, end_year: int) -> str:
    safe_org = organization.replace('"', '\\"')
    return f'''
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX p: <http://www.wikidata.org/prop/>
PREFIX ps: <http://www.wikidata.org/prop/statement/>
PREFIX pq: <http://www.wikidata.org/prop/qualifier/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX bd: <http://www.bigdata.com/rdf#>
PREFIX wikibase: <http://wikiba.se/ontology#>
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
  SERVICE wikibase:label {{
    bd:serviceParam wikibase:language "ja,en" .
    ?award rdfs:label ?awardLabel .
    ?recipient rdfs:label ?recipientLabel .
    ?work rdfs:label ?workLabel .
  }}
}}
ORDER BY ?date ?awardLabel ?recipientLabel
'''


def fetch_sparql(query: str, retries: int = 4) -> dict:
    params = urllib.parse.urlencode({"query": query, "format": "json"})
    req = urllib.request.Request(
        ENDPOINT + "?" + params,
        headers={"User-Agent": USER_AGENT, "Accept": "application/sparql-results+json"},
    )
    last_error = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as exc:
            last_error = exc
            if attempt + 1 == retries:
                raise
            time.sleep(4 * (attempt + 1))
    raise RuntimeError(last_error)


def year_from_date(value: str) -> int | None:
    try:
        return int(value[:4])
    except Exception:
        return None


def clean_label(value: str | None) -> str:
    return (value or "").strip()


def normalize_binding(organization: str, binding: dict) -> dict | None:
    award_label = clean_label(binding.get("awardLabel", {}).get("value"))
    recipient = clean_label(binding.get("recipientLabel", {}).get("value"))
    work = clean_label(binding.get("workLabel", {}).get("value"))
    date = clean_label(binding.get("date", {}).get("value"))
    award_uri = clean_label(binding.get("award", {}).get("value"))
    recipient_uri = clean_label(binding.get("recipient", {}).get("value"))
    year = year_from_date(date)
    if not award_label or not recipient or not year:
        return None

    category = CATEGORY_RENAMES.get(award_label, award_label)
    title = f"{work} — {recipient}" if work and work != recipient else recipient
    return {
        "year": year,
        "organization": organization,
        "category": category,
        "title": title,
        "source": award_uri or recipient_uri or "https://www.wikidata.org/",
        "data_source": "Wikidata (CC0)",
        "wikidata_award": award_uri,
        "wikidata_recipient": recipient_uri,
    }


def collect(start_year: int, end_year: int) -> list[dict]:
    rows: list[dict] = []
    for organization, spec in FAMILIES.items():
        family_start = max(start_year, int(spec["start"]))
        if family_start > end_year:
            continue
        print(f"querying {organization}: {family_start}-{end_year}...", flush=True)
        payload = fetch_sparql(family_query(organization, str(spec["selector"]), family_start, end_year))
        bindings = payload.get("results", {}).get("bindings", [])
        normalized = [normalize_binding(organization, b) for b in bindings]
        usable = [r for r in normalized if r]
        rows.extend(usable)
        print(f"  {organization}: {len(bindings)} bindings / {len(usable)} usable rows", flush=True)
        time.sleep(1.5)
    return rows


def merge_rows(existing: list[dict], additions: list[dict]) -> tuple[list[dict], int]:
    merged = list(existing)
    keys = {
        (int(r.get("year", 0)), r.get("organization", ""), r.get("category", ""), r.get("title", ""))
        for r in merged
    }
    added = 0
    for row in additions:
        key = (row["year"], row["organization"], row["category"], row["title"])
        if key in keys:
            continue
        keys.add(key)
        merged.append(row)
        added += 1

    org_order = {
        "アカデミー賞": 0,
        "カンヌ国際映画祭": 1,
        "ヴェネチア国際映画祭": 2,
        "ベルリン国際映画祭": 3,
        "ゴールデングローブ賞": 4,
        "BAFTA": 5,
    }
    merged.sort(key=lambda r: (-int(r["year"]), org_order.get(r["organization"], 99), r["category"], r["title"]))
    return merged, added


def validate(rows: list[dict]) -> None:
    assert rows, "awards data is empty"
    for row in rows:
        assert isinstance(row.get("year"), int)
        assert row.get("organization")
        assert row.get("category")
        assert row.get("title")
        assert row.get("source")
    floors = {
        "アカデミー賞": 1930,
        "カンヌ国際映画祭": 1955,
        "ヴェネチア国際映画祭": 1950,
        "ベルリン国際映画祭": 1955,
        "ゴールデングローブ賞": 1950,
        "BAFTA": 1955,
    }
    for organization, floor in floors.items():
        assert any(r["organization"] == organization and r["year"] <= floor for r in rows), f"historical floor missing: {organization}"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--start-year", type=int, default=1929)
    parser.add_argument("--end-year", type=int, default=datetime.now(timezone.utc).year)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    data = json.loads(AWARDS_PATH.read_text(encoding="utf-8"))
    current = data.get("awards", [])
    additions = collect(args.start_year, args.end_year)
    merged, added = merge_rows(current, additions)
    validate(merged)

    counts: dict[str, int] = {}
    for row in merged:
        counts[row["organization"]] = counts.get(row["organization"], 0) + 1
    print("counts:", json.dumps(counts, ensure_ascii=False, sort_keys=True))
    print(f"new rows: {added}; total rows: {len(merged)}")

    if args.dry_run:
        return

    data["awards"] = merged
    data["generated_at"] = datetime.now(timezone.utc).date().isoformat()
    data["note"] = (
        "受賞履歴は既存の主催者公式確認データに、Wikidata（CC0）の構造化データを統合。"
        "アカデミー賞、カンヌ、ヴェネチア、ベルリン、ゴールデングローブ、BAFTAを、"
        "取得可能な範囲で創設期まで遡って収録。開催中止・未創設部門は補完しない。"
    )
    AWARDS_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
