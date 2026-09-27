from pathlib import Path

art = Path("js/my-cinemap-art.js").read_text(encoding="utf-8")
html = Path("my-cinemap.html").read_text(encoding="utf-8")
tools = Path("js/my-cinemap-tools.js").read_text(encoding="utf-8")

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

minimal_polish = [
    "const minimalPortraitTitleSize=46",
    "const minimalPortraitListTop=232",
    "const minimalMedalScale=.86",
    "const minimalMetaAlpha=.74",
    "const minimalMovieWeight=600",
    "const minimalFooterGap=38",
    "const minimalSingleMovieSize=38",
    "#f3efe7",
    "#b9aa8d",
    "theme==='minimal'?minimalPortraitTitleSize:portraitTitleSize",
    "theme==='minimal'?minimalMedalScale:1",
    "theme==='minimal'&&columns===1?minimalSingleMovieSize",
]
missing_minimal = [token for token in minimal_polish if token not in art]
if missing_minimal:
    raise SystemExit(f"Minimal editorial polish missing: {missing_minimal}")

large_theme_preview = [
    ".designPicker .themeChoices{display:flex",
    ".themeChoice.premiumTheme{flex:0 0 min(82vw,330px)",
    ".templatePreview{position:relative;display:block;width:100%;height:164px",
    ".previewMinimal{background:#f3efe7",
    ".previewNoir{background:#1b1c1d",
    ".previewBurgundy{background:#57252d",
    ".previewSage{background:#d7d9cb",
    ".previewBlueGray{background:#d9dfe3",
    ".templatePreview .previewRank",
    "scroll-snap-type:x mandatory",
    "populateThemePreviews()",
]
missing_preview = [token for token in large_theme_preview if token not in tools]
if missing_preview:
    raise SystemExit(f"Large theme preview UI missing: {missing_preview}")

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

if "my-cinemap-tools.js?v=20260927-my-cinemap-preview-v8" not in art:
    raise SystemExit("My Cinemap preview tool cache-bust version was not bumped")

print("My Cinemap five editorial themes, large previews, Minimal polish, and one/two-column export checks passed")
