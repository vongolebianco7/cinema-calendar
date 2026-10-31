#!/usr/bin/env python3
"""Safe daily streaming refresh: curated, provenance-backed releases only."""
import argparse
import datetime as dt
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data/streaming-2026-11-official-supplement.json"
OUTPUT = ROOT / "data/streaming-official-current.json"
ALLOWED = {"Prime Video", "Netflix", "Disney+", "U-NEXT", "Apple TV+", "Hulu", "ABEMA", "Lemino", "WOWOWオンデマンド"}
def refresh(source=SOURCE, output=OUTPUT, today=None):
    today = today or dt.date.today()
    if not source.exists():
        raise ValueError("Official source missing; existing output preserved")
    data = json.loads(source.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or not isinstance(data.get("movies"), list):
        raise ValueError("Invalid official source; existing output preserved")
    clean, seen = [], set()
    for movie in data["movies"]:
        if not isinstance(movie, dict):
            raise ValueError("Invalid movie entry")
        title, service, date, url = (movie.get(k) for k in ("title", "service", "date", "source_url"))
        if not all(isinstance(x, str) and x.strip() for x in (title, service, date, url)):
            raise ValueError("Missing title, service, date or provenance")
        if service not in ALLOWED or not url.startswith("https://"):
            raise ValueError("Unrecognized service or non-HTTPS provenance")
        parsed = dt.date.fromisoformat(date)
        if parsed.year < 2026 or movie.get("event") != "streaming":
            raise ValueError("Invalid release date or event")
        key = (date, service, " ".join(title.casefold().split()))
        if key not in seen:
            clean.append(movie)
            seen.add(key)
    if not clean:
        raise ValueError("Empty update refused; existing output preserved")
    result = {"generated_at": today.isoformat(), "period": data.get("period"), "movies": clean, "count": len(clean), "note": "Verified-source subset, not a complete subscription catalog"}
    content = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if output.exists() and output.read_text(encoding="utf-8") == content:
        return False
    output.write_text(content, encoding="utf-8")
    return True
if __name__ == "__main__":
    try:
        changed = refresh()
        print("Streaming supplement " + ("updated" if changed else "unchanged"))
    except (ValueError, OSError, json.JSONDecodeError) as exc:
        print(f"Streaming update rejected: {exc}", file=sys.stderr)
        sys.exit(1)
