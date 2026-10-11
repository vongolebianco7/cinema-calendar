"""Validate Japan streaming-premiere provenance and emit per-service coverage.

No network calls. Dates from dated first-party announcements only.
TMDB/JustWatch availability observations never create premiere events.
"""
import datetime
import json
import sys
from collections import Counter
from pathlib import Path

root = Path("data")
registry = json.loads((root / "streaming_sources.json").read_text(encoding="utf-8"))
premieres = json.loads((root / "streaming.json").read_text(encoding="utf-8"))
providers = [entry["name"] for entry in registry["services"]]
today = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).date()
counts = Counter()
upcoming = Counter()
issues = []
seen = set()
for index, movie in enumerate(premieres.get("movies", [])):
    service = movie.get("service")
    title = movie.get("title")
    date = movie.get("date")
    if not service or not title or not date or not movie.get("source_url"):
        issues.append(f"record {index}: missing required service/title/date/source_url")
        continue
    try:
        published = datetime.date.fromisoformat(date)
    except ValueError:
        issues.append(f"record {index}: invalid date {date}")
        continue
    identity = (service, title, date)
    if identity in seen:
        issues.append(f"record {index}: duplicate {identity}")
    seen.add(identity)
    counts[service] += 1
    if published >= today:
        upcoming[service] += 1
for service in providers:
    print(f"{service}: total={counts[service]}, upcoming={upcoming[service]}")
    if not upcoming[service]:
        print(f"::warning title=No upcoming {service} films::Official premiere-date coverage needs editorial verification.")
unknown = sorted(set(counts) - set(providers))
if unknown:
    issues.append(f"unregistered services: {unknown}")
for issue in issues:
    print("::error title=Invalid streaming premiere data::" + issue)
print("Editorial source timestamp:", premieres.get("generated_at"))
if issues:
    sys.exit(1)
