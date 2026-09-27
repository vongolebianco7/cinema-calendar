from pathlib import Path
html = Path("discover.html").read_text(encoding="utf-8")
for marker in [
    '代表作',
    '最高評価作',
    'id="personRepresentativeGrid"',
    'id="personTopRatedGrid"',
    '人気・評価をもとに表示',
]:
    if marker in html:
        raise SystemExit(f"subjective person profile marker remains: {marker}")
for marker in [
    'id="personProfile"',
    'data-person-role="director"',
    'data-person-role="cast"',
    'data-person-decade="2010"',
    'id="personSort"',
    '/* discover-three-column-results-v2 */',
]:
    if marker not in html:
        raise SystemExit(f"objective person profile feature missing: {marker}")
print("objective-only person profile checks passed")
