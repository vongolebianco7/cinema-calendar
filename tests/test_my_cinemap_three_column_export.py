from pathlib import Path

art = Path("js/my-cinemap-art.js").read_text(encoding="utf-8")
html = Path("my-cinemap.html").read_text(encoding="utf-8")

required = [
    "const columns=3;",
    "const rows=Math.max(1,Math.ceil(items.length/columns))",
    "const col=Math.floor(i/rows),row=i%rows;",
    "Ranking output is always three vertical columns",
]
missing = [token for token in required if token not in art]
if missing:
    raise SystemExit(f"My Cinemap three-column export missing: {missing}")

forbidden = [
    "const columns=sparse?1:shape==='landscape'||(shape==='square'&&layout!=='ranking')?2:1;",
    "const rows=columns===2?5:10",
]
present = [token for token in forbidden if token in art]
if present:
    raise SystemExit(f"legacy one/two-column export logic remains: {present}")

if "my-cinemap-final-v8" not in html:
    raise SystemExit("My Cinemap artwork cache-bust version was not bumped")

print("My Cinemap three-column export regression checks passed")
