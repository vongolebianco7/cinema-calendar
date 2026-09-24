import json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "data" / "source_registry.json"

APPROVED_AUTOMATED_SOURCES = {
    "tmdb",
    "justwatch_via_tmdb",
    "wikidata",
}

with REGISTRY.open(encoding="utf-8") as f:
    registry = json.load(f)

sources = {x["id"]: x for x in registry.get("sources", [])}
errors = []

for source_id in APPROVED_AUTOMATED_SOURCES:
    source = sources.get(source_id)
    if not source:
        errors.append(f"Missing source registry entry: {source_id}")
    elif source.get("mode") != "approved":
        errors.append(f"Automated source is not approved: {source_id} ({source.get('mode')})")

for source in registry.get("sources", []):
    if source.get("mode") not in {"approved", "link_only", "disabled"}:
        errors.append(f"Invalid compliance mode for {source.get('id')}: {source.get('mode')}")

if errors:
    print("Compliance gate failed:")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("Compliance gate passed.")
print("Approved automated sources:", ", ".join(sorted(APPROVED_AUTOMATED_SOURCES)))
