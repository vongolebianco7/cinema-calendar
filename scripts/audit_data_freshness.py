#!/usr/bin/env python3
"""Offline freshness audit. Does not claim external data has been refreshed."""
import argparse
import datetime as dt
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATASETS = {
    "streaming": ("data/streaming.json", 48),
    "theater_schedules": ("data/theater_schedules.json", 24),
}

def parse_date(value):
    if not value:
        return None
    try:
        parsed = dt.datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return parsed.replace(tzinfo=dt.timezone.utc) if parsed.tzinfo is None else parsed
    except (TypeError, ValueError):
        return None

def audit(now=None):
    now = now or dt.datetime.now(dt.timezone.utc)
    results = {}
    for name, (relative_path, max_age_hours) in DATASETS.items():
        path = ROOT / relative_path
        result = {"path": relative_path, "max_age_hours": max_age_hours, "status": "missing"}
        if path.exists():
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                generated = parse_date(data.get("generated_at")) if isinstance(data, dict) else None
                result["generated_at"] = data.get("generated_at") if isinstance(data, dict) else None
                if generated is None:
                    result["status"] = "unknown"
                else:
                    age = (now - generated).total_seconds() / 3600
                    result["age_hours"] = round(age, 1)
                    result["status"] = "fresh" if -1 <= age <= max_age_hours else "stale"
            except (OSError, ValueError, UnicodeError) as exc:
                result["status"] = "invalid"
                result["error"] = str(exc)[:200]
        results[name] = result
    return {"checked_at": now.isoformat(), "datasets": results}

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="")
    args = parser.parse_args()
    report = audit()
    content = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    print(content)
    if args.output:
        output = Path(args.output)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(content, encoding="utf-8")
    raise SystemExit(1 if any(x["status"] != "fresh" for x in report["datasets"].values()) else 0)
