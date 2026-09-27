from pathlib import Path
html = Path("discover.html").read_text(encoding="utf-8")
checks = {
  "person profile": 'id="personProfile"',
  "representative works": 'id="personRepresentativeGrid"',
  "top rated works": 'id="personTopRatedGrid"',
  "role switch": 'data-person-role="director"',
  "cast role switch": 'data-person-role="cast"',
  "decade filter": 'data-person-decade="2010"',
  "profile renderer": 'function renderPersonProfile',
  "three column hard lock": '/* discover-three-column-results-v2 */',
}
missing = [k for k,v in checks.items() if v not in html]
if missing:
  raise SystemExit("missing: " + ", ".join(missing))
if '/* mobile-movie-rails-v1 */' in html:
  raise SystemExit("legacy mobile one-row result rail still present")
if '#grid.grid{display:flex!important' in html:
  raise SystemExit("search result grid still forced to horizontal flex")
print("person profile + three-column search checks passed")
