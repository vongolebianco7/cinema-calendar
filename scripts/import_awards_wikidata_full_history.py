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
USER_AGENT = "CinemapAwardsImporter/1.0 (https://github.com/vongolebianco7/cinema-calendar)"

# Wikidata entity IDs for the award families / festivals.
# We deliberately use structured relationships rather than scraping award sites.
FAMILY_BLOCK = r'''
  {
    ?award wdt:P31 wd:Q19020 .
    BIND("アカデミー賞" AS ?organization)
  }
  UNION {
    { ?award wdt:P31 wd:Q732997 } UNION { ?award wdt:P361 wd:Q732997 }
    BIND("BAFTA" AS ?organization)
  }
  UNION {
    { ?award wdt:P31 wd:Q1011547 } UNION { ?award wdt:P361 wd:Q1011547 }
    BIND("ゴールデングローブ賞" AS ?organization)
  }
  UNION {
    ?award wdt:P1027 wd:Q42369 .
    BIND("カンヌ国際映画祭" AS ?organization)
  }
  UNION {
    ?award wdt:P1027 wd:Q49024 .
    BIND("ヴェネチア国際映画祭" AS ?organization)
  }
  UNION {
    ?award wdt:P1027 wd:Q130871 .
    BIND("ベルリン国際映画祭" AS ?organization)
  }
'''

# Fallback English/Japanese labels used when Wikidata has no Japanese label.
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


def query_for_years(start_year: int, end_year: int) -> str:
    return f'''
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX p: <http://www.wikidata.org/prop/>
PREFIX ps: <http://www.wikidata.org/prop/statement/>
PREFIX pq: <http://www.wikidata.org/prop/qualifier/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX bd: <http://www.bigdata.com/rdf#>
PREFIX wikibase: <http://wikiba.se/ontology#>
SELECT DISTINCT ?organization ?award ?awardLabel ?recipient ?recipientLabel ?work ?workLabel ?date WHERE {{
  {FAMILY_BLOCK}
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
ORDER BY ?date ?organization ?awardLabel ?recipientLabel
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
            with urllib.request.urlopen(req, timeout=90) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as exc:  # network/service errors should be retried conservatively
            last_error = exc
            if attempt + 1 == retries:
                raise
            time.sleep(3 * (attempt + 1))
    raise RuntimeError(last_error)


def year_from_date(value: str) -> int | None:
    try:
        return int(value[:4])
    except Exception:
        return None


def clean_label(value: str | None) -> str:
    return (value or "").strip()


def normalize_binding(binding: dict) -> dict | None:
    organization = clean_label(binding.get("organization", {}).get("value"))
    award_label = clean_label(binding.get("awardLabel", {}).get("value"))
    recipient = clean_label(binding.get("recipientLabel", {}).get("value"))
    work = clean_label(binding.get("workLabel", {}).get("value"))
    date = clean_label(binding.get("date", {}).get("value"))
    award_uri = clean_label(binding.get("award", {}).get("value"))
    recipient_uri = clean_label(binding.get("recipient", {}).get("value"))
    year = year_from_date(date)
    if not organization or not award_label or not recipient or not year:
        return None

    category = CATEGORY_RENAMES.get(award_label, award_label)
    # If a person received the award for a work, show film first then recipient.
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


def collect(start_year: int, end_year: int, chunk_years: int = 8) -> list[dict]:
    rows: list[dict] = []
    start = start_year
    while start <= end_year:
        end = min(end_year, start + chunk_years - 1)
        print(f"querying {start}-{end}...", flush=True)
        payload = fetch_sparql(query_for_years(start, end))
        bindings = payload.get("results", {}).get("bindings", [])
        normalized = [normalize_binding(b) for b in bindings]
        rows.extend(r for r in normalized if r)
        print(f"  received {len(bindings)} bindings / {sum(r is not None for r in normalized)} usable rows", flush=True)
        start = end + 1
        time.sleep(1.0)
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
    # Historical floor checks: do not regress to only modern awards.
    assert any(r["organization"] == "アカデミー賞" and r["year"] <= 1930 for r in rows)
    assert any(r["organization"] == "カンヌ国際映画祭" and r["year"] <= 1955 for r in rows)
    assert any(r["organization"] == "ヴェネチア国際映画祭" and r["year"] <= 1950 for r in rows)
    assert any(r["organization"] == "ベルリン国際映画祭" and r["year"] <= 1955 for r in rows)
    assert any(r["organization"] == "ゴールデングローブ賞" and r["year"] <= 1950 for r in rows)
    assert any(r["organization"] == "BAFTA" and r["year"] <= 1955 for r in rows)


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
