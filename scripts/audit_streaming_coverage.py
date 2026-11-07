#!/usr/bin/env python3
"""Offline source-coverage report. Does not fetch or claim new provider rights."""
import json
import argparse
import os
import tempfile
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
def load(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))

def audit():
    sources = load("data/streaming_sources.json")["services"]
    feeds = load("data/streaming-official-feeds.json")["feeds"]
    snapshot = load("data/streaming.json")
    registry = {s["id"]: s for s in load("data/source_registry.json")["sources"]}
    premiere_purposes = {"release_announcements", "streaming_premiere_feed"}
    catalog = snapshot.get("movies", [])
    rows = []
    for service in sources:
        name = service["name"]
        matches = [f for f in feeds if f.get("service") == name]
        approved = [f for f in matches if
                    registry.get(f.get("source_id"), {}).get("mode") == "approved" and
                    premiere_purposes.intersection(
                        registry.get(f.get("source_id"), {}).get("purpose", []))]
        records = [m for m in catalog if m.get("service") == name]
        cited = []
        for record in records:
            source_url = record.get("source_url")
            url = urlparse(source_url if isinstance(source_url, str) else "")
            day = record.get("date")
            try:
                valid_day = isinstance(day, str) and date.fromisoformat(day).isoformat() == day
            except ValueError:
                valid_day = False
            if (isinstance(record.get("title"), str) and record["title"].strip() and
                    valid_day and url.scheme == "https" and url.hostname):
                cited.append(record)
        automated = bool(service.get("auto_premiere_discovery")) and bool(approved)
        status = ("automated_verified" if automated else
                  "manual_curated_with_citations" if cited else "no_cited_premiere_records")
        limitation = (None if automated else
                      "Curated records with HTTPS citations; not continuous discovery or an exhaustive service catalogue"
                      if cited else "No cited premiere records in the current snapshot; this does not mean no releases")
        rows.append({
            "service": name,
            "official_url": service["official_url"],
            "premiere_discovery": status,
            "registered_approved_feeds": len(approved),
            "auto_premiere_discovery_flag": bool(service.get("auto_premiere_discovery")),
            "catalog_records": len(records),
            "records_with_https_citations": len(cited),
            "catalog_generated_at": snapshot.get("generated_at"),
            "availability_source": service.get("availability_source"),
            "limitation": limitation
        })
    return {"schema_version": 1, "snapshot_generated_at": snapshot.get("generated_at"),
            "services_count": len(rows),
            "automated_premiere_services": sum(r["premiere_discovery"] == "automated_verified" for r in rows),
            "services_with_cited_curated_records": sum(r["records_with_https_citations"] > 0 for r in rows),
            "cited_curated_record_count": sum(r["records_with_https_citations"] for r in rows),
            "services": rows}

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="")
    args = parser.parse_args()
    content = json.dumps(audit(), ensure_ascii=False, indent=2) + "\n"
    print(content, end="")
    if args.output:
        output = Path(args.output)
        output.parent.mkdir(parents=True, exist_ok=True)
        staged = None
        try:
            with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=output.parent,
                                             prefix=f".{output.name}-", suffix=".tmp",
                                             delete=False) as handle:
                staged = Path(handle.name)
                handle.write(content)
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(staged, output)
        finally:
            if staged is not None:
                staged.unlink(missing_ok=True)
