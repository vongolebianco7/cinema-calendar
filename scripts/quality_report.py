#!/usr/bin/env python3
"""Render a human-readable Markdown report from Cinemap score JSON."""
from __future__ import annotations

import argparse
import json
from pathlib import Path


def _fmt(value) -> str:
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        return f"{value:.1f}" if value == round(value, 1) else f"{value:.2f}".rstrip("0").rstrip(".")
    return str(value)


def render_report(score: dict) -> str:
    groups = score.get("group_totals", {})
    areas = score.get("area_totals", {})
    blockers = score.get("blockers", [])
    unverified = score.get("unverified_blockers", [])
    missing = score.get("missing_metrics", [])
    comparison = score.get("comparison", {})

    lines = [
        "# Cinemap Product Completeness",
        "",
        f"**TOTAL: {_fmt(score.get('total', 0))} / 100**",
        "",
        f"- Screen: {_fmt(groups.get('screen', 0))} / 45",
        f"- User Flows: {_fmt(groups.get('flow', 0))} / 40",
        f"- Cross-Cutting: {_fmt(groups.get('cross', 0))} / 15",
        f"- release_eligible: {str(bool(score.get('release_eligible'))).lower()}",
    ]

    if comparison:
        delta = float(comparison.get("delta", 0))
        sign = "+" if delta >= 0 else ""
        lines.extend([
            "",
            "## Baseline",
            f"- main: {_fmt(comparison.get('baseline_total', 0))}",
            f"- delta: {sign}{_fmt(delta)}",
        ])

    lines.extend(["", "## Areas"])
    if areas:
        for area, value in sorted(areas.items()):
            lines.append(f"- {area}: {_fmt(value)}")
    else:
        lines.append("- none")

    lines.extend(["", "## Release Blockers"])
    if blockers:
        for blocker in blockers:
            lines.append(f"- ❌ {blocker}")
    else:
        lines.append("- none")

    lines.extend(["", "## Unverified Blockers"])
    if unverified:
        for blocker in unverified:
            lines.append(f"- ⚠️ {blocker}")
    else:
        lines.append("- none")

    lines.extend(["", "## Missing Metrics"])
    if missing:
        for metric in missing:
            lines.append(f"- {metric}")
    else:
        lines.append("- none")

    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", help="score JSON path")
    parser.add_argument("--output", default="artifacts/completeness/score.md")
    args = parser.parse_args()

    score = json.loads(Path(args.input).read_text(encoding="utf-8"))
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(render_report(score), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
