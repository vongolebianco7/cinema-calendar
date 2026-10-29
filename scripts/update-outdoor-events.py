#!/usr/bin/env python3
"""Merge reviewed outdoor-event facts without HTML or news discovery."""
from pathlib import Path
try:
    from scripts.manual_event_refresh import refresh
except ModuleNotFoundError:
    from manual_event_refresh import refresh
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data/outdoor-events.json"
SOURCES = ROOT / "data/outdoor-event-sources.json"
def main():
    refresh(OUTPUT, SOURCES, "updated_at", lambda row: row.get("id"))
if __name__ == "__main__":
    main()
