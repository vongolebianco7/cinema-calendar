#!/usr/bin/env python3
"""Preserve event snapshots and merge manually reviewed official facts only."""
from pathlib import Path
import re
try:
    from scripts.manual_event_refresh import refresh
except ModuleNotFoundError:
    from manual_event_refresh import refresh
ROOT = Path(__file__).resolve().parents[1]
FEED = ROOT / "data/events.json"
SOURCES = ROOT / "data/film-event-sources.json"
def main():
    refresh(FEED, SOURCES, "generated_at", lambda row: (re.sub(r"\W+", "", str(row.get("title", "")).casefold()), row.get("date", "")))
if __name__ == "__main__":
    main()
