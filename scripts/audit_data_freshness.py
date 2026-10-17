#!/usr/bin/env python3
"""Offline freshness audit. Does not claim external data has been refreshed."""
import argparse
import datetime as dt
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "quality" / "external-data-registry.json"

def parse_date(value):
    if not value:
        return None
    try:
        parsed = dt.datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return parsed.replace(tzinfo=dt.timezone.utc) if parsed.tzinfo is None else parsed
    except (TypeError, ValueError):
        return None

def audit(now=None, registry=None, root=ROOT):
    now = now or dt.datetime.now(dt.timezone.utc)
    registry = registry or json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    results = {}
    enforced_failures = []
    for entry in registry.get("categories", []):
        name = entry["id"]
        relative_path = entry.get("dataset")
        max_age_hours = entry.get("max_age_hours")
        result = {"category": entry.get("category", name), "status": entry.get("status"), "path": relative_path, "max_age_hours": max_age_hours, "freshness_enforced": bool(entry.get("freshness_enforced")), "freshness": "not_applicable"}
        path = root / relative_path if relative_path else None
        if path and path.exists():
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                field = entry.get("generated_at_field") or "generated_at"
                generated = parse_date(data.get(field)) if isinstance(data, dict) else None
                result["generated_at"] = data.get(field) if isinstance(data, dict) else None
                if generated is None:
                    result["freshness"] = "unknown"
                else:
                    age = (now - generated).total_seconds() / 3600
                    result["age_hours"] = round(age, 1)
                    result["freshness"] = "fresh" if max_age_hours is not None and -1 <= age <= max_age_hours else "stale"
            except (OSError, ValueError, UnicodeError) as exc:
                result["freshness"] = "invalid"
                result["error"] = str(exc)[:200]
        elif relative_path:
            result["freshness"] = "missing"
        if result["freshness_enforced"] and result["freshness"] != "fresh":
            enforced_failures.append(name)
        results[name] = result
    return {"checked_at": now.isoformat(), "registry": "quality/external-data-registry.json", "datasets": results, "enforced_failures": enforced_failures}

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
    raise SystemExit(1 if report["enforced_failures"] else 0)
