#!/usr/bin/env python3
"""Aggregate deterministic Cinemap quality metrics into a 100-point score."""
from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path
from typing import Iterable


VALID_GROUPS = {"screen", "flow", "cross"}
VALID_STATUSES = {"pass", "fail", "partial", "not_applicable"}


def load_scorecard(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    metrics = data.get("metrics")
    if not isinstance(metrics, list):
        raise ValueError("scorecard metrics must be a list")
    ids = [m.get("id") for m in metrics]
    if any(not x for x in ids) or len(ids) != len(set(ids)):
        raise ValueError("scorecard metric IDs must be unique and non-empty")
    for metric in metrics:
        if metric.get("group") not in VALID_GROUPS:
            raise ValueError(f"invalid group for {metric.get('id')}")
        if not metric.get("area") or not metric.get("description"):
            raise ValueError(f"metric {metric.get('id')} requires area and description")
        points = metric.get("points")
        if not isinstance(points, (int, float)) or points < 0:
            raise ValueError(f"invalid points for {metric.get('id')}")
        if not isinstance(metric.get("blocker"), bool):
            raise ValueError(f"metric {metric.get('id')} blocker must be boolean")
    return data


def load_metric_results(paths: list[Path]) -> list[dict]:
    results: list[dict] = []
    for path in paths:
        payload = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(payload, list):
            results.extend(payload)
        elif isinstance(payload, dict) and isinstance(payload.get("metrics"), list):
            results.extend(payload["metrics"])
        elif isinstance(payload, dict) and payload.get("id"):
            results.append(payload)
        else:
            raise ValueError(f"unsupported metric result payload: {path}")
    return results


def _canonicalize_observations(metric: dict, observations: list[dict]) -> dict:
    if not observations:
        return {
            "id": metric["id"],
            "status": "missing",
            "earned": 0.0,
            "observations": [],
        }

    if len(observations) > 1:
        browsers = [o.get("browser") for o in observations]
        if any(not b for b in browsers) or len(browsers) != len(set(browsers)):
            raise ValueError(f"duplicate result ID without distinct browser evidence: {metric['id']}")

    for obs in observations:
        status = obs.get("status")
        if status not in VALID_STATUSES:
            raise ValueError(f"invalid status for {metric['id']}: {status}")
        earned = obs.get("earned", 0)
        if not isinstance(earned, (int, float)) or earned < 0 or earned > metric["points"]:
            raise ValueError(f"earned points out of range for {metric['id']}")

    order = {"fail": 0, "partial": 1, "not_applicable": 2, "pass": 3}
    worst = min(observations, key=lambda o: order[o["status"]])
    status = worst["status"]
    earned = min(float(o.get("earned", 0)) for o in observations)
    return {
        "id": metric["id"],
        "status": status,
        "earned": earned,
        "observations": observations,
    }


def calculate_score(scorecard: dict, results: list[dict]) -> dict:
    configured = scorecard.get("metrics", [])
    by_id = {m["id"]: m for m in configured}

    unknown = sorted({r.get("id") for r in results if r.get("id") not in by_id})
    if unknown:
        raise ValueError(f"unknown metric IDs: {', '.join(str(x) for x in unknown)}")

    observations: dict[str, list[dict]] = defaultdict(list)
    for result in results:
        metric_id = result.get("id")
        if not metric_id:
            raise ValueError("result metric ID is required")
        observations[metric_id].append(result)

    group_totals = {"screen": 0.0, "flow": 0.0, "cross": 0.0}
    area_totals: dict[str, float] = defaultdict(float)
    blockers: list[str] = []
    unverified_blockers: list[str] = []
    missing_metrics: list[str] = []
    metric_results: list[dict] = []

    for metric in configured:
        canonical = _canonicalize_observations(metric, observations.get(metric["id"], []))
        earned = canonical["earned"]
        group_totals[metric["group"]] += earned
        area_totals[metric["area"]] += earned
        if canonical["status"] == "missing":
            missing_metrics.append(metric["id"])
            if metric["blocker"]:
                unverified_blockers.append(metric["id"])
        elif metric["blocker"] and canonical["status"] == "fail":
            blockers.append(metric["id"])
        metric_results.append({
            **canonical,
            "group": metric["group"],
            "area": metric["area"],
            "description": metric["description"],
            "points": metric["points"],
            "blocker": metric["blocker"],
        })

    total = round(sum(group_totals.values()), 4)
    return {
        "scorecard_version": scorecard.get("scorecard_version"),
        "gate_phase": scorecard.get("gate_phase", "A"),
        "group_totals": {k: round(v, 4) for k, v in group_totals.items()},
        "area_totals": {k: round(v, 4) for k, v in sorted(area_totals.items())},
        "total": total,
        "release_eligible": not blockers and not unverified_blockers,
        "blockers": sorted(blockers),
        "unverified_blockers": sorted(unverified_blockers),
        "missing_metrics": sorted(missing_metrics),
        "metrics": metric_results,
    }


def compare_scores(current: dict, baseline: dict, touched_areas: set[str]) -> dict:
    if current.get("scorecard_version") != baseline.get("scorecard_version"):
        raise ValueError("scorecard version mismatch between current and baseline")

    current_blockers = set(current.get("blockers", []))
    baseline_blockers = set(baseline.get("blockers", []))
    new_blockers = sorted(current_blockers - baseline_blockers)
    current_unverified = set(current.get("unverified_blockers", []))
    baseline_unverified = set(baseline.get("unverified_blockers", []))
    new_unverified = sorted(current_unverified - baseline_unverified)
    delta = round(float(current.get("total", 0)) - float(baseline.get("total", 0)), 4)

    current_areas = current.get("area_totals", {})
    baseline_areas = baseline.get("area_totals", {})
    regressions = []
    areas = set(touched_areas)
    if "all" in areas:
        areas = set(current_areas) | set(baseline_areas)
    for area in sorted(areas):
        before = float(baseline_areas.get(area, 0))
        after = float(current_areas.get(area, 0))
        if after + 1e-9 < before:
            regressions.append({"area": area, "baseline": before, "current": after})

    passed = not new_blockers and not new_unverified and delta >= -1e-9 and not regressions
    return {
        "baseline_total": baseline.get("total", 0),
        "current_total": current.get("total", 0),
        "delta": delta,
        "new_blockers": new_blockers,
        "new_unverified_blockers": new_unverified,
        "touched_area_regressions": regressions,
        "phase_a_pass": passed,
    }


def _collect_metric_paths(items: Iterable[str]) -> list[Path]:
    paths: list[Path] = []
    for item in items:
        p = Path(item)
        if p.is_dir():
            paths.extend(sorted(p.rglob("*.json")))
        else:
            paths.append(p)
    return paths


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--scorecard", default="quality/scorecard.json")
    parser.add_argument("--metrics", nargs="*", default=[])
    parser.add_argument("--output", default="artifacts/completeness/score.json")
    parser.add_argument("--baseline")
    parser.add_argument("--touched-areas", default="")
    parser.add_argument("--enforce-phase-a", action="store_true")
    args = parser.parse_args()

    scorecard = load_scorecard(Path(args.scorecard))
    result_paths = _collect_metric_paths(args.metrics)
    results = load_metric_results(result_paths) if result_paths else []
    score = calculate_score(scorecard, results)

    if args.baseline:
        baseline = json.loads(Path(args.baseline).read_text(encoding="utf-8"))
        touched = {x for x in args.touched_areas.split(",") if x}
        score["comparison"] = compare_scores(score, baseline, touched)

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(score, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    if args.enforce_phase_a and score.get("comparison") and not score["comparison"]["phase_a_pass"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
