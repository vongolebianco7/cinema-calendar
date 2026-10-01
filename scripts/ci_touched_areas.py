#!/usr/bin/env python3
"""Classify changed repository paths into scorecard product areas."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import PurePosixPath


PRODUCT_EXTENSIONS = {".html", ".js", ".mjs", ".css", ".json", ".py"}


def classify_paths(paths: list[str]) -> set[str]:
    areas: set[str] = set()
    for raw in paths:
        path = raw.strip().replace("\\", "/")
        if not path:
            continue
        low = path.lower()
        p = PurePosixPath(low)

        if low.startswith("docs/") or low.endswith(".md"):
            if low == "compliance.md" or low.endswith("docs/free-only-policy.md"):
                areas.add("compliance")
            continue
        if low.startswith("tests/") or low.startswith(".github/") or low.startswith("quality/"):
            continue
        if low.startswith("scripts/"):
            if "critic" in low or "source" in low:
                areas.update({"critic", "data-quality"})
            elif "ocean" in low:
                areas.add("ocean")
            elif "quality" in low or "ci_touched_areas" in low:
                continue
            else:
                areas.add("all")
            continue

        if low == "index.html":
            areas.add("calendar")
            continue
        if low == "discover.html" or "discover" in p.name:
            areas.add("discover")
            continue
        if low == "search.html":
            areas.add("movie-detail")
            continue
        if "my-cinemap" in low:
            areas.add("my-cinemap")
            continue
        if "ocean" in low or "aquarium" in low:
            areas.add("ocean")
            continue
        if low == "critic.html" or "/critic" in low or p.name.startswith("critic"):
            areas.add("critic")
            if low.startswith("data/"):
                areas.add("data-quality")
            continue
        if low.startswith("data/"):
            areas.add("data-quality")
            continue
        if "global-nav" in low or "shared" in low or "brand" in low:
            areas.add("all")
            continue
        if low in {"rankings.html", "theaters.html", "experience.html"}:
            areas.add("all")
            continue
        if p.suffix in PRODUCT_EXTENSIONS:
            areas.add("all")

    if "all" in areas:
        return {"all"}
    return areas


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("paths", nargs="*")
    parser.add_argument("--stdin", action="store_true")
    args = parser.parse_args()
    paths = list(args.paths)
    if args.stdin:
        paths.extend(line.strip() for line in sys.stdin if line.strip())
    print(json.dumps(sorted(classify_paths(paths))))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
