from pathlib import Path
expected = {
    "discover.html": ["discover-three-column-results-v2", "#grid.grid{display:grid!important", "grid-template-columns:repeat(3,minmax(0,1fr))!important", "overflow:visible!important"],
    "search.html": ["search-three-column-grid-v1", ".grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important", ".grid>.card{min-width:0;width:100%", "overflow:visible!important"],
}
failed=[]
for name,tokens in expected.items():
    text=Path(name).read_text(encoding="utf-8")
    missing=[t for t in tokens if t not in text]
    if missing: failed.append(f"{name}: missing {missing}")
    if name=="discover.html" and ("mobile-movie-rails-v1" in text or "#grid.grid{display:flex!important" in text):
        failed.append("discover.html: legacy one-row horizontal result rail still present")
if failed: raise SystemExit("\n".join(failed))
print("three-column search result regression checks passed")
