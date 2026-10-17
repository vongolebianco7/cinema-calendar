#!/usr/bin/env python3
"""Report actual title-level streaming freshness; never infer it from generated_at."""
import datetime as dt
import json
import os
from pathlib import Path

UTC=dt.timezone.utc
WINDOW=dt.timedelta(days=7)
SOURCE=Path("data/availability.json")
REPORT=Path("artifacts/availability-freshness.json")

def parse_aware(value):
    if not isinstance(value,str):
        return None
    try:
        parsed=dt.datetime.fromisoformat(value.replace("Z","+00:00"))
    except ValueError:
        return None
    return parsed.astimezone(UTC) if parsed.tzinfo else None

def summarize(snapshot, now):
    movies=snapshot.get("movies",{})
    if not isinstance(movies,dict):
        raise ValueError("availability movies must be an object")
    result={"total":len(movies),"fresh_7d":0,"stale_7d":0,
            "missing_or_invalid_checked_at":0,"checked_within_48h":0,
            "observations_with_providers_fresh_7d":0,
            "snapshot_generated_at":snapshot.get("generated_at"),
            "evaluated_at":now.isoformat()}
    for item in movies.values():
        if not isinstance(item,dict):
            result["missing_or_invalid_checked_at"]+=1
            continue
        checked=parse_aware(item.get("checked_at"))
        if checked is None:
            result["missing_or_invalid_checked_at"]+=1
            continue
        age=now-checked
        if age<dt.timedelta(0) or age>WINDOW:
            result["stale_7d"]+=1
            continue
        result["fresh_7d"]+=1
        if age<=dt.timedelta(hours=48):
            result["checked_within_48h"]+=1
        if any(item.get(k) for k in ("flatrate","rent","buy","services")):
            result["observations_with_providers_fresh_7d"]+=1
    result["stale_7d"]+=result["missing_or_invalid_checked_at"]
    result["fresh_pct"]=round(100*result["fresh_7d"]/result["total"],1) if result["total"] else 0
    return result

def main():
    now=dt.datetime.now(UTC)
    snapshot=json.loads(SOURCE.read_text(encoding="utf-8"))
    result=summarize(snapshot,now)
    REPORT.parent.mkdir(parents=True,exist_ok=True)
    REPORT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    line=(f"Provider observations: {result['fresh_7d']}/{result['total']} "
          f"fresh within 7 days ({result['fresh_pct']}%); "
          f"{result['stale_7d']} stale or unchecked. "
          "Snapshot update timestamp alone is not proof of per-title freshness.")
    print(line)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"],"a",encoding="utf-8") as file:
            file.write("### CINELVA streaming observation freshness\n\n"+line+"\n")
    if result["fresh_pct"]<70:
        print("::warning title=Streaming provider observations stale::Less than 70% of the stored title observations are within the last seven days")
    return 0  # Diagnostic: legal access, API errors, and true scarcity must remain visible.

if __name__=="__main__":
    raise SystemExit(main())
