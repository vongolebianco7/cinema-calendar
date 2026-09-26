from pathlib import Path

art = Path("js/my-cinemap-art.js").read_text(encoding="utf-8")
html = Path("my-cinemap.html").read_text(encoding="utf-8")

required_art = [
    "const layout=artValue('layout')||'single';",
    "const columns=layout==='double'?2:1;",
    "const rows=columns===2?5:10",
    "const col=columns===1?0:Math.floor(i/5),row=columns===1?i:i%5;",
]
missing_art = [token for token in required_art if token not in art]
if missing_art:
    raise SystemExit(f"My Cinemap one/two-column export missing: {missing_art}")

forbidden_art = [
    "const columns=3;",
    "Ranking output is always three vertical columns",
    "shape==='landscape'||(shape==='square'&&layout!=='ranking')?2:1",
]
present_art = [token for token in forbidden_art if token in art]
if present_art:
    raise SystemExit(f"legacy My Cinemap export layout logic remains: {present_art}")

required_html = [
    '<option value="single" selected>縦1列</option>',
    '<option value="double">左右2列</option>',
]
missing_html = [token for token in required_html if token not in html]
if missing_html:
    raise SystemExit(f"My Cinemap layout controls missing: {missing_html}")

if "illustrationMode" in html:
    raise SystemExit("removed illustration setting returned")

if "my-cinemap-editorial-v9" not in html:
    raise SystemExit("My Cinemap artwork cache-bust version was not bumped")

print("My Cinemap editorial one/two-column export regression checks passed")
