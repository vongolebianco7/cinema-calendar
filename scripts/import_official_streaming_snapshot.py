#!/usr/bin/env python3
"""Merge dated, reviewed provider announcements into the user-facing catalog.

The merge only appends new provider/title/date entries and fills missing
metadata on exact existing keys. It never removes or replaces catalog rows.
"""
import datetime
import json
from pathlib import Path

try:
    from .atomic_json import write_json_atomic
except ImportError:  # Script execution from the scheduled workflow.
    from atomic_json import write_json_atomic
try:
    from .streaming_event_normalization import normalize_premieres
except ImportError:  # Script execution from the scheduled workflow.
    from streaming_event_normalization import normalize_premieres

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / "data/streaming-official-current.json"
CATALOG = ROOT / "data/streaming.json"
REGISTRY = ROOT / "data/streaming_sources.json"
FILL_FIELDS = ("poster", "id", "tmdb", "tmdb_id", "overview", "score", "votes", "release_year", "year")


def import_snapshot(snapshot_path=SNAPSHOT, catalog_path=CATALOG, registry_path=REGISTRY):
    official = json.loads(snapshot_path.read_text(encoding="utf-8"))
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    providers = {x["name"] for x in registry.get("services", []) if isinstance(x, dict) and x.get("name")}
    approved_hosts = {
        x["name"]: x.get("reviewed_premiere_hosts", [])
        for x in registry.get("services", [])
        if isinstance(x, dict) and isinstance(x.get("name"), str) and x.get("name")
    }
    entries = official.get("movies") if isinstance(official, dict) else None
    rows = catalog.get("movies") if isinstance(catalog, dict) else None
    if not providers or not isinstance(entries, list) or not entries or not isinstance(rows, list):
        raise ValueError("Official snapshot, provider registry, or streaming catalog is invalid")

    # This input is a manually reviewed supplement. Reuse the strict provenance,
    # date, identity and duplicate checks from the reviewed-announcement path.
    normalized_entries = []
    for source in entries:
        if not isinstance(source, dict) or source.get("event") != "streaming":
            raise ValueError("Invalid official movie entry")
        normalized_entries.append({**source, "verified": True, "content_type": "movie"})
    entries = normalize_premieres(normalized_entries, approved_hosts)

    def key(row):
        return (row.get("service"), " ".join(str(row.get("title", "")).casefold().split()), row.get("date"))

    existing = {key(row): row for row in rows if isinstance(row, dict)}
    added = updated = 0
    for source in entries:
        if not isinstance(source, dict) or source.get("event") != "streaming":
            raise ValueError("Invalid official movie entry")
        title, service, date, url = (source.get(field) for field in ("title", "service", "date", "source_url"))
        if not all(isinstance(value, str) and value.strip() for value in (title, service, date, url)):
            raise ValueError("Official entry lacks title, service, date, or source URL")
        if service not in providers or not url.startswith("https://"):
            raise ValueError("Official entry has an unregistered provider or unsafe source URL")
        datetime.date.fromisoformat(date)
        item_key = key(source)
        if item_key in existing:
            target = existing[item_key]
            for field in FILL_FIELDS:
                if source.get(field) not in (None, "", 0) and target.get(field) in (None, "", 0):
                    target[field] = source[field]
                    updated += 1
            continue
        item = {
            "title": title, "date": date, "event": "streaming", "service": service,
            "score": source.get("score", 0), "votes": source.get("votes", 0),
            "overview": source.get("overview", ""), "poster": source.get("poster"),
            "source": source.get("source", "Official provider announcement"),
            "source_url": url, "checked_at": datetime.date.today().isoformat(),
        }
        for field in ("id", "tmdb", "tmdb_id", "release_year", "year", "original_title"):
            if source.get(field) not in (None, ""):
                item[field] = source[field]
        if item.get("tmdb_id") and not item.get("id"):
            item["id"] = item["tmdb_id"]
        if item.get("id") and not item.get("tmdb"):
            item["tmdb"] = "https://www.themoviedb.org/movie/" + str(item["id"])
        rows.append(item)
        existing[item_key] = item
        added += 1
    if added or updated:
        catalog["generated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        write_json_atomic(catalog_path, catalog)
    return added, updated


if __name__ == "__main__":
    print("Imported official streaming announcements: added=%d metadata_fields=%d" % import_snapshot())
