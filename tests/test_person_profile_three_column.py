from pathlib import Path
html = Path("discover.html").read_text(encoding="utf-8")
checks = {
  "person profile": 'id="personProfile"',
  "role switch": 'data-person-role="director"',
  "cast role switch": 'data-person-role="cast"',
  "decade filter": 'data-person-decade="2010"',
  "profile renderer": 'function renderPersonProfile',
  "three column hard lock": '/* discover-three-column-results-v2 */',
}
missing = [k for k,v in checks.items() if v not in html]
if missing:
  raise SystemExit("missing: " + ", ".join(missing))
for marker in ['代表作','最高評価作','id="personRepresentativeGrid"','id="personTopRatedGrid"']:
  if marker in html:
    raise SystemExit("subjective person profile marker remains: " + marker)
if '/* mobile-movie-rails-v1 */' in html:
  raise SystemExit("legacy mobile one-row result rail still present")
if '#grid.grid{display:flex!important' in html:
  raise SystemExit("search result grid still forced to horizontal flex")
print("person profile + three-column search checks passed")
