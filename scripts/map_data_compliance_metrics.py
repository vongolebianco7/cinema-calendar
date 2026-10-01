#!/usr/bin/env python3
"""Map deterministic data/compliance checks to completeness score metrics."""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


METERED_AI_PATTERNS = [
    r"api\.openai\.com",
    r"api\.anthropic\.com",
    r"generativelanguage\.googleapis\.com",
    r"OPENAI_API_KEY",
    r"ANTHROPIC_API_KEY",
]
SCRAPING_PATTERNS = [r"scraperapi\.com", r"brightdata", r"serpapi", r"playwright.*scrap", r"selenium.*scrap"]
TRACKER_PATTERNS = [r"googletagmanager\.com", r"google-analytics\.com", r"segment\.io", r"mixpanel\.com"]


def scan_text_for_policy_violations(text: str) -> set[str]:
    findings: set[str] = set()
    if any(re.search(pattern, text, flags=re.I) for pattern in METERED_AI_PATTERNS):
        findings.add("metered_ai")
    if any(re.search(pattern, text, flags=re.I) for pattern in SCRAPING_PATTERNS):
        findings.add("scraping")
    if any(re.search(pattern, text, flags=re.I) for pattern in TRACKER_PATTERNS):
        findings.add("tracker")
    return findings


def _row(metric_id: str, points: float, passed: bool, details: str) -> dict:
    return {
        "id": metric_id,
        "status": "pass" if passed else "fail",
        "earned": points if passed else 0,
        "details": details,
    }


def map_data_compliance_metrics(statuses: dict[str, bool]) -> list[dict]:
    rows: list[dict] = []

    if "critic_schema" in statuses:
        rows.append(_row("CRIT-01", 0.5, bool(statuses["critic_schema"]), "critic evidence schema"))
    if "critic_association" in statuses:
        rows.append(_row("CRIT-03", 0.5, bool(statuses["critic_association"]), "critic evidence/movie association"))
    if "critic_inference" in statuses:
        rows.append(_row("CRIT-05", 0.5, bool(statuses["critic_inference"]), "criticism is not inferred from metadata"))

    data_keys = ("sources", "critic_schema", "critic_association", "unknown_data")
    if all(key in statuses for key in data_keys):
        data_checks = {key: bool(statuses[key]) for key in data_keys}
        rows.append(_row("CROSS-DATA", 3.0, all(data_checks.values()), json.dumps(data_checks, sort_keys=True)))

    compliance_keys = ("free_only", "scraping", "trackers", "critic_inference")
    if all(key in statuses for key in compliance_keys):
        compliance_checks = {key: bool(statuses[key]) for key in compliance_keys}
        rows.append(_row("CROSS-COMPLIANCE", 3.0, all(compliance_checks.values()), json.dumps(compliance_checks, sort_keys=True)))

    return rows


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("status_json", help="JSON object with deterministic source/compliance check booleans")
    parser.add_argument("--output", default="artifacts/completeness/metrics/data-compliance.json")
    parser.add_argument("--scan", nargs="*", default=[], help="Changed runtime files to scan for newly introduced policy patterns")
    args = parser.parse_args()

    statuses = json.loads(Path(args.status_json).read_text(encoding="utf-8"))
    findings: set[str] = set()
    for item in args.scan:
        path = Path(item)
        if path.is_file():
            findings |= scan_text_for_policy_violations(path.read_text(encoding="utf-8", errors="ignore"))
    if "metered_ai" in findings:
        statuses["free_only"] = False
    if "scraping" in findings:
        statuses["scraping"] = False
    if "tracker" in findings:
        statuses["trackers"] = False

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({"metrics": map_data_compliance_metrics(statuses), "findings": sorted(findings)}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
