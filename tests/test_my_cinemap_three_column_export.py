from pathlib import Path
import subprocess

art = Path("js/my-cinemap-art.js").read_text(encoding="utf-8")
html = Path("my-cinemap.html").read_text(encoding="utf-8")
tools = Path("js/my-cinemap-tools.js").read_text(encoding="utf-8")
enhancements_path = Path("js/my-cinemap-art-direction.js")
enhancements = enhancements_path.read_text(encoding="utf-8")
renderer_path = Path("js/my-cinemap-cinema-templates.js")
renderer = renderer_path.read_text(encoding="utf-8") if renderer_path.exists() else ""

for path in [enhancements_path, renderer_path]:
    syntax = subprocess.run(["node", "--check", str(path)], capture_output=True, text=True)
    if syntax.returncode:
        raise SystemExit(f"My Cinemap JavaScript syntax failed in {path}:\n{syntax.stderr}")

required_art = [
    "layout=artValue('layout')||'single'",
    "const columns=layout==='double'?2:1;",
    "const rows=columns===2?5:10",
    "const col=columns===1?0:Math.floor(i/5),row=columns===1?i:i%5;",
    "minimal:","noir:","burgundy:","bluegray:",
    "drawMinimal","drawNoir","drawBurgundy","drawBlueGray","drawMedal","MY TOP OF 2026",
]
missing_art = [token for token in required_art if token not in art]
if missing_art:
    raise SystemExit(f"My Cinemap editorial artwork missing: {missing_art}")

minimal_polish = [
    "const minimalPortraitTitleSize=46","const minimalPortraitListTop=232","const minimalMedalScale=.86",
    "const minimalMetaAlpha=.74","const minimalMovieWeight=600","const minimalFooterGap=38",
    "const minimalSingleMovieSize=42","const singleMovieSize=38","const doublePortraitMovieSize=32",
    "const doubleCompactMovieSize=27","const singleMetaSize=21","const doubleMetaSize=20",
    "const doubleListBottomTarget=","rowH=columns===2?Math.max(96,(doubleListBottomTarget-listTop)/rows):metrics.rowH",
    "ctx.textBaseline='middle'","#f3efe7","#b9aa8d","theme==='minimal'?minimalPortraitTitleSize:portraitTitleSize",
    "theme==='minimal'?minimalMedalScale:1","theme==='minimal'?minimalSingleMovieSize:singleMovieSize",
]
missing_minimal = [token for token in minimal_polish if token not in art]
if missing_minimal:
    raise SystemExit(f"Minimal editorial polish missing: {missing_minimal}")

art_direction = [
    "const artFonts=","const fontKey=artValue('fontStyle')||'modern'","function drawThemeIllustration",
    "function drawProjectionGlow","function drawArchiveGrid","function drawBurgundyArch",
    "titleBottom","const titleToListGap=","font.title","font.movie",
]
missing_direction = [token for token in art_direction if token not in art]
if missing_direction:
    raise SystemExit(f"My Cinemap art direction missing: {missing_direction}")

large_theme_preview = [
    ".designPicker .themeChoices{display:flex",".themeChoice.premiumTheme{flex:0 0 min(82vw,330px)",
    ".templatePreview{position:relative;display:block;width:100%;height:164px",".previewMinimal{background:#f3efe7",
    ".previewNoir{background:#1b1c1d",".previewBurgundy{background:#57252d",
    ".previewBlueGray{background:#d9dfe3",".templatePreview .previewRank","scroll-snap-type:x mandatory","populateThemePreviews()",
]
missing_preview = [token for token in large_theme_preview if token not in tools]
if missing_preview:
    raise SystemExit(f"Large theme preview UI missing: {missing_preview}")

enhancement_requirements = [
    "<select id=\"fontStyle\">","Modern Serif","Clean Sans","Cinema Classic",
    "const FONT_KEY='cinemap-my-font-style'","async function hydrateMissingDirectors",
    "picks.filter(movie=>!movie.director)","hydrateMissingDirectors()","saved.font=fontStyle.value","previewDecor",
    "mountCinemaTemplates","cinema-projector","cinema-theater","cinema-artdeco","cinema-archive",
]
missing_enhancements = [token for token in enhancement_requirements if token not in enhancements]
if missing_enhancements:
    raise SystemExit(f"My Cinemap enhancement module missing: {missing_enhancements}")

for forbidden in ["mountCinemaBackgroundPicker","cinemaBackgroundField","CINEMA_BG_KEY","映画背景（オプション）"]:
    if forbidden in enhancements:
        raise SystemExit(f"legacy cinema background option remains: {forbidden}")

for required in ["originalDrawArtwork","cinemaTemplates","drawImageCover","theme.startsWith('cinema-')"]:
    if required not in renderer:
        raise SystemExit(f"uploaded cinema template renderer missing: {required}")

required_html = [
    '<option value="single" selected>縦1列</option>','<option value="double">左右2列</option>',
    'data-theme="minimal"','data-theme="noir"','data-theme="burgundy"','data-theme="bluegray"',
    '>Minimal<','>Noir Editorial<','>Burgundy Journal<','>Blue Grey Archive<',
    '<header class="gTop"><div class="wrap gNav"><a class="gBrand" href="index.html" aria-label="Cinemap"><img class="gBrandImage"',
]
missing_html = [token for token in required_html if token not in html]
if missing_html:
    raise SystemExit(f"My Cinemap layout/theme controls missing: {missing_html}")

for forbidden in ["illustrationMode", "Film Note", "Theater Night", "Gallery Editorial"]:
    if forbidden in html:
        raise SystemExit(f"removed My Cinemap option returned: {forbidden}")

# Cache-bust values change whenever My Cinemap rendering is updated. Verify the
# split modules are versioned, without pinning the test to one obsolete version.
if "my-cinemap-tools.js?v=" not in art:
    raise SystemExit("My Cinemap preview tool cache-bust query is missing")
if "my-cinemap-art-direction.js?v=" not in art:
    raise SystemExit("My Cinemap art-direction module is not loaded with a cache-bust query")
if '<script src="js/my-cinemap-art.js?v=' not in html:
    raise SystemExit("My Cinemap artwork renderer is not loaded with a cache-bust query")

print("My Cinemap editorial themes, uploaded cinema templates, font choices, directors, and responsive layouts passed")
