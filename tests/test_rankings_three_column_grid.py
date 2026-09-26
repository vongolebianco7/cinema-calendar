from pathlib import Path

text = Path("rankings.html").read_text(encoding="utf-8")

required = [
    "/* rankings-three-column-grid-v1 */",
    ".rankGrid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important",
    ".awardGrid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important",
]
missing = [token for token in required if token not in text]
if missing:
    raise SystemExit(f"rankings three-column grid missing: {missing}")

forbidden = [
    "/* mobile-movie-rails-v1 */",
    ".rankGrid{display:flex!important",
    ".rankCard{flex:0 0 104px",
]
present = [token for token in forbidden if token in text]
if present:
    raise SystemExit(f"legacy rankings rail still present: {present}")

print("ranking three-column regression checks passed")
