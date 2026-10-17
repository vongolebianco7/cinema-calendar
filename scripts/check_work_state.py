#!/usr/bin/env python3
"""Validate the durable CINELVA Work checkpoint without external services."""
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
STATE_PATH = ROOT / "docs/operations/work-state.json"
ALLOWED_STATUS = {
    "planned", "in_progress", "pr_created", "ci_passed", "merged",
    "deployment_pending", "production_verified", "blocked",
}


def validate(state):
    errors = []
    if state.get("schema_version") != 1:
        errors.append("schema_version must be 1")
    for key in ("updated_at", "base_branch", "base_sha", "work_items", "next_action", "deployment"):
        if not state.get(key):
            errors.append(f"{key} is required")
    if state.get("status") not in ALLOWED_STATUS:
        errors.append("status is not recognized")
    items = state.get("work_items")
    if not isinstance(items, list) or not items:
        errors.append("work_items must be a non-empty list")
    else:
        seen = set()
        for index, item in enumerate(items):
            for key in ("id", "title", "status", "acceptance"):
                if not item.get(key):
                    errors.append(f"work_items[{index}].{key} is required")
            if item.get("status") not in ALLOWED_STATUS:
                errors.append(f"work_items[{index}].status is not recognized")
            if item.get("id") in seen:
                errors.append(f"duplicate work item id: {item.get('id')}")
            seen.add(item.get("id"))
    if not isinstance(state.get("verification"), list):
        errors.append("verification must be a list")
    if not isinstance(state.get("blockers"), list):
        errors.append("blockers must be a list")
    deployment = state.get("deployment")
    if not isinstance(deployment, dict) or deployment.get("status") not in ALLOWED_STATUS:
        errors.append("deployment.status must be a recognized state")
    return errors


def main():
    try:
        state = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"Invalid Work state: {exc}", file=sys.stderr)
        return 1
    errors = validate(state)
    if errors:
        print("Invalid Work state:\n- " + "\n- ".join(errors), file=sys.stderr)
        return 1
    print("Work state schema passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
