from pathlib import Path
import subprocess

art = Path("js/my-cinemap-art.js").read_text(encoding="utf-8")
html = Path("my-cinemap.html").read_text(encoding="utf-8")
tools = Path("js/my-cinemap-tools.js").read_text(encoding="utf-8")
enhancements_path = Path("js/my-cinemap-art-direction.js")
enhancements = enhancements_path.read_text(encoding="utf-8")

syntax = subprocess.run(["node", "--check", str(enhancements_path)], capture_output=True, text=True)
if syntax.returncode:
    raise SystemExit(f"My Cinemap enhancement JavaScript syntax failed:\n{syntax.stderr}")

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
    "const minimalSingleMovieSize=42",
    "const singleMovieSize=38",
    "const doublePortraitMovieSize=32",
    "const doubleCompactMovieSize=27",
    "const singleMetaSize=21",
    "const doubleMetaSize=20",
    "const doubleListBottomTarget=",
    "rowH=columns===2?Math.max(96,(doubleListBottomTarget-listTop)/rows):metrics.rowH",
    "ctx.textBaseline='middle'",
    "#f3efe7",
    "#b9aa8d",
    "theme==='minimal'?minimalPortraitTitleSize:portraitTitleSize",
    "theme==='minimal'?minimalMedalScale:1",
    "theme==='minimal'?minimalSingleMovieSize:singleMovieSize",
]
missing_minimal = [token for token in minimal_polish if token not in art]
if missing_minimal:
    raise SystemExit(f"Minimal editorial polish missing: {missing_minimal}")

art_direction = [
    "const artFonts=",
    "const fontKey=artValue('fontStyle')||'editorial'",
    "function drawThemeIllustration",
    "function drawProjectionGlow",
    "function drawBotanicalLines",
    "function drawArchiveGrid",
    "function drawBurgundyArch",
    "titleBottom",
    "const titleToListGap=",
    "font.title",
    "font.movie",
]
missing_direction = [token for token in art_direction if token not in art]
if missing_direction:
    raise SystemExit(f"My Cinemap art direction missing: {missing_direction}")

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

enhancement_requirements = [
    "<select id=\"fontStyle\">",
    "Editorial Serif",
    "Modern Serif",
    "Clean Sans",
    "Cinema Classic",
    "const FONT_KEY='cinemap-my-font-style'",
    "async function hydrateMissingDirectors",
    "picks.filter(movie=>!movie.director)",
    "hydrateMissingDirectors()",
    "saved.font=fontStyle.value",
    "previewDecor",
]
missing_enhancements = [token for token in enhancement_requirements if token not in enhancements]
if missing_enhancements:
    raise SystemExit(f"My Cinemap enhancement module missing: {missing_enhancements}")

cinema_backgrounds = [
    '<select id="cinemaBackground">',
    '<option value="none" selected>なし</option>',
    '<option value="projector">Projector</option>',
    '<option value="theater">Theater Curtain</option>',
    '<option value="artdeco">Art Deco Cinema</option>',
    '<option value="archive">Film Archive</option>',
    '<option value="screening">Screening Room</option>',
    "const CINEMA_BG_KEY='cinemap-my-cinema-background'",
    "drawCinemaBackground",
    "cinemaBackground",
]
missing_backgrounds = [token for token in cinema_backgrounds if token not in (art + html + enhancements)]
if missing_backgrounds:
    raise SystemExit(f"My Cinemap optional cinema backgrounds missing: {missing_backgrounds}")

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
    '<header class="gTop"><div class="wrap gNav"><a class="gBrand" href="index.html" aria-label="Cinemap"><img class="gBrandImage"',
]
missing_html = [token for token in required_html if token not in html]
if missing_html:
    raise SystemExit(f"My Cinemap layout/theme controls missing: {missing_html}")

for forbidden in ["illustrationMode", "Film Note", "Theater Night", "Gallery Editorial"]:
    if forbidden in html:
        raise SystemExit(f"removed My Cinemap option returned: {forbidden}")

if "my-cinemap-tools.js?v=20260927-my-cinemap-preview-v9" not in art:
    raise SystemExit("My Cinemap preview tool cache-bust version was not bumped")
if "my-cinemap-art-direction.js?v=20260927-art-direction-v2" not in art:
    raise SystemExit("My Cinemap art-direction background module cache-bust was not bumped")

print("My Cinemap five editorial themes, optional generated cinema backgrounds, font choices, aligned title/list rhythm, default director hydration, and responsive layouts passed")
