from pathlib import Path

art = Path("js/my-cinemap-art.js").read_text(encoding="utf-8")
html = Path("my-cinemap.html").read_text(encoding="utf-8")

required_art = [
    "layout=artValue('layout')||'single'",
    "const columns=layout==='double'?2:1;",
    "const rows=columns===2?5:10",
    "const col=columns===1?0:Math.floor(i/5),row=columns===1?i:i%5;",
    "minimal:",
    "noir:",
    "burgundy:",
    "sage:",
    "bluegray:",
    "drawMinimal",
    "drawNoir",
    "drawBurgundy",
    "drawSage",
    "drawBlueGray",
    "drawMedal",
    "MY TOP OF 2026",
]
missing_art = [token for token in required_art if token not in art]
if missing_art:
    raise SystemExit(f"My Cinemap five-theme artwork missing: {missing_art}")

forbidden_art = [
    "const columns=3;",
    "drawFilmNote",
    "drawTheater",
    "drawGalleryEditorial",
    "filmnote:",
    "theater:",
    "galleryeditorial:",
]
present_art = [token for token in forbidden_art if token in art]
if present_art:
    raise SystemExit(f"legacy My Cinemap visual themes remain: {present_art}")

required_html = [
    '<option value="single" selected>縦1列</option>',
    '<option value="double">左右2列</option>',
    'data-theme="minimal"',
    'data-theme="noir"',
    'data-theme="burgundy"',
    'data-theme="sage"',
    'data-theme="bluegray"',
    '>Minimal<',
    '>Noir Editorial<',
    '>Burgundy Journal<',
    '>Sage Museum<',
    '>Blue Grey Archive<',
    '<header class="gTop"><div class="wrap gNav"><a class="gBrand" href="index.html"><span class="gBrandTile"',
]
missing_html = [token for token in required_html if token not in html]
if missing_html:
    raise SystemExit(f"My Cinemap layout/theme controls missing: {missing_html}")

for forbidden in ["illustrationMode", "Film Note", "Theater Night", "Gallery Editorial"]:
    if forbidden in html:
        raise SystemExit(f"removed My Cinemap option returned: {forbidden}")

if "my-cinemap-editorial-v10" not in html:
    raise SystemExit("My Cinemap artwork cache-bust version was not bumped")

print("My Cinemap five editorial themes and one/two-column export checks passed")
