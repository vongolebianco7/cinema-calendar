#!/usr/bin/env python3
"""Safe daily streaming refresh: curated, provenance-backed releases only."""
import datetime as dt
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE_GLOB = "streaming-*-official-supplement.json"
OUTPUT = ROOT / "data/streaming-official-current.json"
SERVICES = ROOT / "data/streaming_sources.json"
def registered_services(path=SERVICES):
    data = json.loads(path.read_text(encoding="utf-8"))
    services = data.get("services") if isinstance(data, dict) else None
    if not isinstance(services, list):
        raise ValueError("Invalid streaming service registry")
    names = {entry.get("name") for entry in services if isinstance(entry, dict) and isinstance(entry.get("name"), str) and entry["name"].strip()}
    if not names:
        raise ValueError("Streaming service registry is empty")
    return names
ALLOWED = registered_services()
def refresh(source=None, output=OUTPUT, today=None):
    # Default runs consume every reviewed month file so a new month needs only
    # a verified data addition; the scheduled workflow itself remains stable.
    sources = (
        sorted((ROOT / "data").glob(SOURCE_GLOB))
        if source is None
        else list(source) if isinstance(source, (list, tuple)) else [source]
    )
    if not sources:
        raise ValueError("No official supplement sources found; existing output preserved")
    clean, seen, periods = [], set(), set()
    for source_path in sources:
        data = json.loads(source_path.read_text(encoding="utf-8"))
        if not isinstance(data, dict) or not isinstance(data.get("movies"), list):
            raise ValueError(f"Invalid official source {source_path.name}; existing output preserved")
        period = data.get("period")
        if not isinstance(period, str) or len(period) != 7 or period[4] != "-":
            raise ValueError(f"Invalid official period in {source_path.name}; existing output preserved")
        try:
            dt.date.fromisoformat(period + "-01")
        except ValueError as exc:
            raise ValueError(f"Invalid official period in {source_path.name}; existing output preserved") from exc
        periods.add(period)
        for movie in data["movies"]:
            if not isinstance(movie, dict):
                raise ValueError("Invalid movie entry")
            title, service, date, url = (movie.get(k) for k in ("title", "service", "date", "source_url"))
            if not all(isinstance(x, str) and x.strip() for x in (title, service, date, url)):
                raise ValueError("Missing title, service, date or provenance")
            if service not in ALLOWED or not url.startswith("https://"):
                raise ValueError("Unrecognized service or non-HTTPS provenance")
            parsed = dt.date.fromisoformat(date)
            if date[:7] != period:
                raise ValueError("Streaming release date outside official supplement period")
            if parsed.year < 2026 or movie.get("event") != "streaming":
                raise ValueError("Invalid release date or event")
            key = (date, service, " ".join(title.casefold().split()))
            if key not in seen:
                # A curated supplement is not authoritative for movie identity
                # or artwork. Do not let blank optional fields erase canonical
                # metadata when downstream catalogs merge this record.
                movie = dict(movie)
                for field in ("poster", "poster_path", "image", "image_url", "tmdb_id", "release_year", "year"):
                    value = movie.get(field)
                    if value is None or value == "":
                        movie.pop(field, None)
                clean.append(movie)
                seen.add(key)
    if not clean:
        raise ValueError("Empty update refused; existing output preserved")
    ordered_periods = sorted(periods)
    result = {
        "period": ordered_periods[0] if len(ordered_periods) == 1 else None,
        "periods": ordered_periods,
        "movies": clean,
        "count": len(clean),
        "note": "Verified-source subset, not a complete subscription catalog",
    }
    content = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if output.exists() and output.read_text(encoding="utf-8") == content:
        return False
    import os
    import tempfile
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=output.parent, delete=False) as tmp:
        tmp.write(content)
        temp_path = tmp.name
    os.replace(temp_path, output)
    return True
if __name__ == "__main__":
    try:
        changed = refresh()
        print("Streaming supplement " + ("updated" if changed else "unchanged"))
    except (ValueError, OSError, json.JSONDecodeError) as exc:
        print(f"Streaming update rejected: {exc}", file=sys.stderr)
        sys.exit(1)
