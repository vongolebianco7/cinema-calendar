#!/usr/bin/env python3
"""Read-only, deterministic source-health audit. Does not refresh source timestamps."""
import argparse
import datetime as dt
import json
import os
from pathlib import Path

UTC = dt.timezone.utc


def parse_timestamp(value):
    if not isinstance(value, str):
        return None
    try:
        parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed.astimezone(UTC) if parsed.tzinfo else None


def build_report(snapshot, now):
    if not isinstance(snapshot, dict) or not isinstance(snapshot.get("sources"), list):
        raise ValueError("source-status must contain a sources array")
    if now.tzinfo is None:
        raise ValueError("now must be timezone-aware")
    now = now.astimezone(UTC)
    result = {"schema_version": 1, "evaluated_at": now.isoformat(),
              "snapshot_generated_at": snapshot.get("generated_at"),
              "sources": [], "summary": {"total": 0, "fresh": 0, "stale": 0,
                                          "unknown": 0, "manual": 0, "disabled": 0}}
    seen = set()
    for source in snapshot["sources"]:
        if not isinstance(source, dict) or not isinstance(source.get("id"), str):
            raise ValueError("each source must have a string id")
        key = source["id"]
        if key in seen:
            raise ValueError("duplicate source id: " + key)
        seen.add(key)
        mode = source.get("status")
        observed = parse_timestamp(source.get("source_observed_at"))
        max_hours = source.get("max_age_hours")
        valid_window = isinstance(max_hours, (int, float)) and not isinstance(max_hours, bool) and max_hours > 0
        age_hours = round((now - observed).total_seconds() / 3600, 2) if observed else None
        if isinstance(mode, str) and mode.startswith("disabled"):
            state = "disabled"
        elif observed is None or not valid_window or age_hours < 0:
            state = "unknown"
        elif age_hours > max_hours:
            state = "stale"
        else:
            state = "fresh"
        if mode == "manual":
            result["summary"]["manual"] += 1
        observations = source.get("observations")
        coverage = None
        if isinstance(observations, dict):
            total = observations.get("total")
            fresh = observations.get("fresh")
            stale = observations.get("stale")
            if all(isinstance(n, int) and not isinstance(n, bool) and n >= 0
                   for n in (total, fresh, stale)) and fresh + stale <= total:
                coverage = {"total": total, "fresh": fresh, "stale": stale,
                            "fresh_pct": round(100 * fresh / total, 1) if total else 0.0}
        item = {"id": key, "acquisition_mode": mode, "health": state,
                "observed_at": source.get("source_observed_at"),
                "age_hours": age_hours, "max_age_hours": max_hours,
                "record_count": source.get("record_count"),
                "observations": source.get("observations"),
                "title_level_freshness": coverage,
                "workflow": source.get("workflow"),
                "note": "Health reflects source observation age, not complete catalog coverage."}
        result["sources"].append(item)
        result["summary"]["total"] += 1
        result["summary"][state] += 1
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=Path("data/source-status.json"))
    parser.add_argument("--output", type=Path, default=Path("artifacts/source-health.json"))
    args = parser.parse_args()
    snapshot = json.loads(args.input.read_text(encoding="utf-8"))
    report = build_report(snapshot, dt.datetime.now(UTC))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report["summary"], sort_keys=True))
    unhealthy = [item for item in report["sources"] if item["health"] in {"stale", "unknown"}]
    for item in unhealthy:
        print(f"::warning title=Stale or unverified source::{item['id']} is {item['health']}; "
              f"last observation: {item['observed_at'] or 'missing'}")
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        lines = ["## CINELVA source freshness", "",
                 "Source observation age only; **not** evidence of complete catalog coverage.", "",
                 "| Source | Intake | Health | Observed at | Fresh records |",
                 "| --- | --- | --- | --- | --- |"]
        for item in report["sources"]:
            coverage = item["title_level_freshness"]
            ratio = f"{coverage['fresh']}/{coverage['total']} ({coverage['fresh_pct']}%)" if coverage else "n/a"
            lines.append(f"| {item['id']} | {item['acquisition_mode']} | "
                         f"{item['health']} | {item['observed_at'] or 'unknown'} | {ratio} |")
        with open(summary_path, "a", encoding="utf-8") as output:
            output.write("\n".join(lines) + "\n")



if __name__ == "__main__":
    main()
