#!/usr/bin/env python3
"""Map authoritative existing Ocean checks to scorecard metric records."""
from __future__ import annotations

import argparse
import json
from pathlib import Path


OCEAN_METRIC_SOURCES = {
    "OC-01": ["tests/ocean-renderer-contract.test.cjs"],
    "OC-02": ["tests/ocean-milestone-stars.test.cjs", "tests/ocean-creature-unlocks.test.cjs"],
    "OC-03": ["tests/ocean-creature-diversity.test.cjs", "tests/ocean-ordinary-species-expansion.test.cjs"],
    "OC-04": ["tests/ocean-habitat-depth.test.cjs"],
    "OC-05": ["tests/ocean-rating-ecology.test.cjs", "tests/ocean-record-driven-maturity.test.cjs"],
    "OC-06": ["scripts/ocean_persistence_smoke.mjs"],
    "OC-07": ["tests/ocean-photo-natural-motion.test.cjs", "tests/ocean-real-fish-motion.test.cjs"],
    "OC-08": ["tests/ocean-real-scale-catalog.test.cjs"],
    "OC-09": ["tests/ocean-500-natural-density.test.cjs"],
    "OC-10": ["tests/ocean-500-performance-contract.test.cjs"],
    "OC-11": ["scripts/ocean_visual_smoke.mjs"],
}

OCEAN_POINTS = {
    "OC-01": 1.0,
    "OC-02": 1.0,
    "OC-03": 0.5,
    "OC-04": 0.5,
    "OC-05": 0.5,
    "OC-06": 0.5,
    "OC-07": 0.5,
    "OC-08": 0.5,
    "OC-09": 0.5,
    "OC-10": 0.5,
    "OC-11": 1.0,
}

OCEAN_FLOW_SOURCES = [
    "tests/ocean-renderer-contract.test.cjs",
    "tests/ocean-milestone-stars.test.cjs",
    "tests/ocean-creature-unlocks.test.cjs",
    "scripts/ocean_persistence_smoke.mjs",
    "tests/ocean-500-natural-density.test.cjs",
    "tests/ocean-500-performance-contract.test.cjs",
    "scripts/ocean_visual_smoke.mjs",
]


def _passed(source_statuses: dict[str, bool], sources: list[str]) -> bool:
    return all(source in source_statuses and source_statuses[source] is True for source in sources)


def map_ocean_metrics(source_statuses: dict[str, bool]) -> list[dict]:
    rows = []
    for metric_id, sources in OCEAN_METRIC_SOURCES.items():
        missing = [source for source in sources if source not in source_statuses]
        failed = [source for source in sources if source_statuses.get(source) is False]
        passed = not missing and not failed
        details = []
        if missing:
            details.append("missing: " + ", ".join(missing))
        if failed:
            details.append("failed: " + ", ".join(failed))
        rows.append({
            "id": metric_id,
            "status": "pass" if passed else "fail",
            "earned": OCEAN_POINTS[metric_id] if passed else 0,
            "details": "; ".join(details) if details else "all authoritative Ocean sources passed",
            "source_test": sources,
        })

    count_ok = _passed(source_statuses, OCEAN_METRIC_SOURCES["OC-01"])
    milestone_ok = _passed(source_statuses, OCEAN_METRIC_SOURCES["OC-02"])
    persistence_ok = _passed(source_statuses, OCEAN_METRIC_SOURCES["OC-06"])
    dense_ok = _passed(source_statuses, OCEAN_METRIC_SOURCES["OC-09"] + OCEAN_METRIC_SOURCES["OC-10"])
    visual_ok = _passed(source_statuses, OCEAN_METRIC_SOURCES["OC-11"])
    flow_earned = (1 if count_ok else 0) + (2 if milestone_ok else 0) + (1 if persistence_ok else 0) + (1 if dense_ok else 0) + (2 if visual_ok else 0)
    flow_pass = flow_earned == 7
    rows.append({
        "id": "FLOW-OCEAN",
        "status": "pass" if flow_pass else "fail",
        "earned": float(flow_earned),
        "details": json.dumps({
            "count": count_ok,
            "milestones": milestone_ok,
            "persistence": persistence_ok,
            "dense_500": dense_ok,
            "iphone_visual": visual_ok,
        }, sort_keys=True),
        "source_test": OCEAN_FLOW_SOURCES,
    })
    return rows


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("status_json", help="JSON object mapping repository test path to boolean pass state")
    parser.add_argument("--output", default="artifacts/completeness/metrics/ocean.json")
    args = parser.parse_args()
    statuses = json.loads(Path(args.status_json).read_text(encoding="utf-8"))
    if not isinstance(statuses, dict):
        raise ValueError("Ocean status payload must be an object")
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({"metrics": map_ocean_metrics(statuses)}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
