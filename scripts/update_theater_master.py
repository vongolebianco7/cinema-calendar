import json, urllib.request, urllib.parse, datetime, re

ENDPOINT = "https://query.wikidata.org/sparql"
QUERY = """
SELECT ?theater ?theaterLabel ?coord ?website ?adminLabel ?address WHERE {
  ?theater wdt:P31/wdt:P279* wd:Q41253;
           wdt:P17 wd:Q17.
  OPTIONAL { ?theater wdt:P625 ?coord. }
  OPTIONAL { ?theater wdt:P856 ?website. }
  OPTIONAL { ?theater wdt:P131 ?admin. }
  OPTIONAL { ?theater wdt:P6375 ?address. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ja,en". }
}
ORDER BY ?theaterLabel
"""

params = urllib.parse.urlencode({"query": QUERY, "format": "json"})
req = urllib.request.Request(
    ENDPOINT + "?" + params,
    headers={
        "Accept": "application/sparql-results+json",
        "User-Agent": "CINEMA-DAYS/1.0 (theater master; contact via GitHub repository)"
    },
)
with urllib.request.urlopen(req, timeout=60) as r:
    data = json.load(r)

def parse_point(value):
    if not value:
        return None, None
    m = re.match(r"Point\((-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)\)", value)
    if not m:
        return None, None
    return float(m.group(2)), float(m.group(1))

seen = set()
rows = []
for b in data.get("results", {}).get("bindings", []):
    entity = b.get("theater", {}).get("value", "")
    if not entity:
        continue
    qid = entity.rsplit("/", 1)[-1]
    if qid in seen:
        continue
    seen.add(qid)
    lat, lon = parse_point(b.get("coord", {}).get("value"))
    rows.append({
        "source": "Wikidata",
        "source_id": qid,
        "name": b.get("theaterLabel", {}).get("value") or qid,
        "prefecture": b.get("adminLabel", {}).get("value"),
        "municipality": None,
        "address": b.get("address", {}).get("value"),
        "latitude": lat,
        "longitude": lon,
        "website": b.get("website", {}).get("value"),
        "source_url": entity,
    })

out = {
    "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "source": "Wikidata",
    "license": "CC0 1.0",
    "source_url": "https://www.wikidata.org/",
    "theaters": rows,
}
with open("data/theaters_master.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)

print("nationwide theater master rows:", len(rows))
