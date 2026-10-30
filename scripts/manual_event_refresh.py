"""Merge reviewed local event facts; no network acquisition is authorized here."""
import datetime as dt
import json
import os
from pathlib import Path
import tempfile
from urllib.parse import urlsplit


def refresh(feed, sources, timestamp_key, identity):
    feed, sources = Path(feed), Path(sources)
    data = json.loads(feed.read_text()) if feed.exists() else {"events": []}
    config = json.loads(sources.read_text()) if sources.exists() else {}
    rows, curated = data.get("events", []), config.get("curated_events", [])
    if not isinstance(rows, list) or not isinstance(curated, list):
        raise ValueError("Event inputs must be lists; existing feed preserved")
    for row in curated:
        if not isinstance(row, dict) or not identity(row):
            raise ValueError("Invalid curated event identity")
        name = row.get("title") or row.get("name")
        if not isinstance(name, str) or not name.strip():
            raise ValueError("Curated event requires a factual title")
        dt.date.fromisoformat(row["checked_at"])
        dt.date.fromisoformat(row["date"])
        source = row.get("source_url") or row.get("url", "")
        if urlsplit(source).scheme != "https" or not urlsplit(source).netloc:
            raise ValueError("Curated event requires official HTTPS provenance")
    merged = {identity(row): row for row in rows}
    for row in curated:
        key = identity(row)
        merged[key] = {**merged.get(key, {}), **row}
    data["events"] = sorted(merged.values(), key=lambda row: (str(row.get("date", "")), str(identity(row))))
    if curated:
        data[timestamp_key] = max(data.get(timestamp_key, ""), max(row["checked_at"] for row in curated))
    data.update(collection_mode="manual_only", automation_status="disabled_pending_licensed_feed",
                last_attempt_at=dt.date.today().isoformat(), curated_count=len(curated),
                discovery_count=0, verified_count=0)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=feed.parent, delete=False) as output:
            temporary = output.name
            json.dump(data, output, ensure_ascii=False, indent=2)
            output.write("\n")
        os.replace(temporary, feed)
    finally:
        if temporary and os.path.exists(temporary):
            os.unlink(temporary)
    print(f"Manual-only event feed: {len(data['events'])} retained records; no network collection")
