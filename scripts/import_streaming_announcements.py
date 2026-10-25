"""Import reviewed, dated official film announcements for any registered provider.

Usage: python scripts/import_streaming_announcements.py
Input file: data/streaming_announcements.json
This deliberately does not crawl or scrape third-party sites.
"""
import datetime
import json
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path("data")
read = lambda name: json.loads((ROOT / name).read_text(encoding="utf-8"))
registry = read("streaming_sources.json")
known = {entry["name"] for entry in registry["services"]}
current = read("streaming.json")
intake = read("streaming_announcements.json")
existing = {(m["service"], m["title"], m["date"]) for m in current["movies"]}
pending = []
identity_updates = 0
for entry in intake.get("movies", []):
    title, service, date = (entry.get(k) for k in ("title", "service", "date"))
    url = entry.get("source_url", "")
    if service not in known or not title or not isinstance(title, str):
        raise ValueError(f"Invalid provider/title: {service!r} {title!r}")
    try:
        datetime.date.fromisoformat(date)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Invalid date: {date!r}") from exc
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.hostname:
        raise ValueError(f"An HTTPS source URL is required: {title!r}")
    if entry.get("content_type", "movie") != "movie":
        raise ValueError(f"Not a verified movie: {title!r}")
    if entry.get("verified") is not True:
        raise ValueError(f"Official release not reviewed: {title!r}")
    key = (service, title, date)
    movie = {
        "title": title, "date": date, "event": "streaming",
        "service": service, "score": 0, "votes": 0,
        "overview": "", "poster": None,
        "source": entry.get("source", "Official provider announcement"),
        "source_url": url, "type": entry.get("type", "見放題"),
        "checked_at": datetime.date.today().isoformat()
    }
    # A premiere date is not evidence of the film's production/release year.
    # Retain separately reviewed identity facts so the approved TMDB resolver
    # can use strict title + year matching without inventing a database ID.
    if isinstance(entry.get("original_title"), str):
        movie["original_title"] = entry["original_title"]
    year = entry.get("release_year")
    if isinstance(year, int) and not isinstance(year, bool) and 1888 <= year <= 2100:
        movie["release_year"] = year
        movie["year"] = year
    title_url = entry.get("title_url", "")
    if title_url:
        parsed_title = urlparse(title_url)
        if parsed_title.scheme != "https" or not parsed_title.hostname:
            raise ValueError(f"An HTTPS title URL is required: {title!r}")
        movie["title_url"] = title_url
    if key in existing:
        previous=next(m for m in current['movies'] if (m['service'],m['title'],m['date'])==key)
        for field in ['original_title','release_year','year','title_url']:
            if movie.get(field) and previous.get(field)!=movie[field]:
                previous[field]=movie[field]
                identity_updates+=1
        continue
    pending.append(movie)
    existing.add(key)
if pending or identity_updates:
    current["movies"].extend(pending)
    current["movies"].sort(key=lambda m: (m["date"], m["service"], m["title"]))
    current["generated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    (ROOT / "streaming.json").write_text(json.dumps(current, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Imported {len(pending)} verified film announcements")
