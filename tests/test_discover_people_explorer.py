from pathlib import Path

html = Path("discover.html").read_text(encoding="utf-8")

checks = {
    "dedicated people entry": 'id="openPersonExplorer"',
    "people explorer intro": 'id="personExploreIntro"',
    "people result sort": 'id="personSort"',
    "person immediate search": 'function runPersonExplore',
    "director label": '監督から探す',
    "cast label": 'キャストから探す',
    "three column results": '#grid.grid{grid-template-columns:repeat(3,minmax(0,1fr))!important',
}

missing = [name for name, marker in checks.items() if marker not in html]
if missing:
    raise SystemExit("missing people explorer features: " + ", ".join(missing))

# The feature must reuse the existing free Cinemap backend and must not add a new paid/external API endpoint.
if 'people-explorer-api' in html or 'person-search-api' in html:
    raise SystemExit("unexpected new external API integration marker")

print("discover people explorer checks passed")
