import json, urllib.request, urllib.parse, datetime, re, time

ENDPOINT = "https://query.wikidata.org/sparql"
BATCH_SIZE = 500
MAX_RETRIES = 3

QUERY_TEMPLATE = """
SELECT ?theater ?theaterLabel ?coord ?website ?adminLabel ?address WHERE {
  ?theater wdt:P31 wd:Q41253;
           wdt:P17 wd:Q17.
  OPTIONAL { ?theater wdt:P625 ?coord. }
  OPTIONAL { ?theater wdt:P856 ?website. }
  OPTIONAL { ?theater wdt:P131 ?admin. }
  OPTIONAL { ?theater wdt:P6375 ?address. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ja,en". }
}
ORDER BY ?theater
LIMIT %d
OFFSET %d
"""

def fetch_batch(offset):
    query = QUERY_TEMPLATE % (BATCH_SIZE, offset)
    params = urllib.parse.urlencode({"query": query, "format": "json"})
    req = urllib.request.Request(
        ENDPOINT + "?" + params,
        headers={
            "Accept": "application/sparql-results+json",
            "User-Agent": "CINEMA-NOW/1.0 (CC0 theater directory; https://github.com/vongolebianco7/cinema-calendar)"
        },
    )
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.load(r)
        except Exception as exc:
            last_error = exc
            print(f"Wikidata batch retry {attempt}/{MAX_RETRIES} offset={offset}: {exc}")
            time.sleep(attempt * 5)
    raise last_error

def parse_point(value):
    if not value:
        return None, None
    m = re.match(r"Point\((-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)\)", value)
    if not m:
        return None, None
    return float(m.group(2)), float(m.group(1))

seen = set()
rows = []
offset = 0

while True:
    data = fetch_batch(offset)
    bindings = data.get("results", {}).get("bindings", [])
    if not bindings:
        break

    for b in bindings:
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

    print(f"Wikidata theater rows fetched: {len(rows)}")
    if len(bindings) < BATCH_SIZE:
        break
    offset += BATCH_SIZE
    time.sleep(1)

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
