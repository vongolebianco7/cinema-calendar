import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
errors = []

def text(path):
    return (ROOT / path).read_text(encoding="utf-8")

# Calendar grouping / current-week behavior.
calendar = text("index.html")
for required in ["groupedMovieCards", "currentWeekStart", "scrollCalendarToCurrentWeek", "通常公開", "午前十時の映画祭", "リバイバル上映"]:
    if required not in calendar:
        errors.append(f"Calendar weekly grouping missing: {required}")
if "max-height:min(68vh,760px)" in calendar or "box.scrollTop" in calendar:
    errors.append("Calendar must use normal page scrolling without nested auto-scroll")
if "monthPageStart" not in calendar or "monthPageEnd" not in calendar or "monthPageWeekCount" not in calendar:
    errors.append("Calendar month pages must span complete Monday-Sunday weeks touching the selected month")

# Morning Ten Film Festival calendar integration.
special = json.loads(text("data/special_screenings.json"))
rows = special.get("screenings", [])
if not rows:
    errors.append("special_screenings.json has no screenings")
if not any(x.get("special_screening") == "asa10" for x in rows):
    errors.append("Morning Ten Film Festival marker missing")
if "午前十時の映画祭" not in text("index.html"):
    errors.append("Calendar does not expose Morning Ten Film Festival")
for required in ["通常公開", "リバイバル上映", "午前十時の映画祭"]:
    if required not in text("index.html"):
        errors.append(f"Missing theatrical legend: {required}")

# Premium format -> theater screen path.
formats = json.loads(text("data/theater_formats.json")).get("screens", [])
for required in ["IMAX", "Dolby Cinema", "Dolby Atmos", "4DX", "MX4D", "SCREENX"]:
    if not any(x.get("format") == required for x in formats):
        errors.append(f"No verified format entries for {required}")
    if f"format={required.replace(' ', '%20')}" not in text("experience.html"):
        errors.append(f"Experience page does not link to {required}")

# Concierge is now a discovery mode, not a global nav destination.
discover = text("discover.html")
for required in ["条件から探す", "AIで探す", 'id="conciergeMode"', "/api/agent"]:
    if required not in discover:
        errors.append(f"Discover concierge integration missing: {required}")
for required in [
    'id="providerChecks"', 'providers.join("|")', "flex-wrap:wrap",
    "scroll-snap-type:x proximity", 'class="presetCard"',
    'id="conditionResults"', '#grid .card',
    'id="theatricalPopularGrid"', 'id="streamingPopularGrid"',
    'loadPopularShelves', 'loadPopularShelves',
    'data/theatrical.json', 'data/streaming.json'
]:
    if required not in discover:
        errors.append(f"Discover recommendation/search integration missing: {required}")
if 'loadPreset();load(true);' in discover:
    errors.append("Discover must not auto-load recommendation results into condition search")
if "repeat(3,minmax(0,1fr))" not in discover:
    errors.append("Condition search results must use a three-column grid")

# Calendar UX gates.
for required in ['["すべて","通常","リバイバル","午前十時"]', "theatricalCategory", "repeat(3,minmax(0,1fr))"]:
    if required not in calendar:
        errors.append(f"Calendar UX integration missing: {required}")
if "firstSeg" not in calendar or "（継続）" not in calendar:
    errors.append("Calendar UX integration missing continuation marker")

# My Cinemap final layout/template gates.
my = text("my-cinemap.html")
for required in ["themeChoices", "Minimal", "Film Note", "Theater Night", "Gallery Editorial", 'data-year="2026"', "artCanvas", "js/my-cinemap-art.js", "syncThemeChoices", '<option value="single" selected>縦1列</option>', '<option value="double">左右2列</option>']:
    if required not in my:
        errors.append(f"My Cinemap enhancement missing: {required}")
if "心に残った10本。" in my:
    errors.append("My Cinemap still contains the removed canned poem")

# My Cinemap assist + final artwork gates.
tools_path = ROOT / "js/my-cinemap-tools.js"
if not tools_path.exists():
    errors.append("My Cinemap assist module missing: js/my-cinemap-tools.js")
else:
    tools = tools_path.read_text(encoding="utf-8")
    for required in ["candidateShelf", "候補に追加", "data-replace", "movieComment", "duplicateList", "cinemap-my-candidates", "cinemap-my-saved-lists"]:
        if required not in tools:
            errors.append(f"My Cinemap assist feature missing: {required}")
    for required in ["compactMovieItem", "compactMovieMeta", "movieEditPanel", "movieDirector", "監督", ".themeChoice.premiumTheme.active", "ひとこと（任意）"]:
        if required not in tools:
            errors.append(f"My Cinemap compact/director/template feature missing: {required}")
art = text("js/my-cinemap-art.js")
for required in ["drawMinimal", "drawFilmNote", "drawTheater", "drawGalleryEditorial", "drawMedal", "function drawBrand", "EXPLORE CINEMA", "Bodoni 72", "m.director", "layout==='double'?2:1"]:
    if required not in art:
        errors.append(f"My Cinemap final artwork/director missing: {required}")
for forbidden in ["cinemapLogo", "assets/cinemap-logo.png?v=2"]:
    if forbidden in art:
        errors.append(f"My Cinemap final artwork still uses legacy logo asset: {forbidden}")
if "illustrationMode" in my:
    errors.append("My Cinemap still exposes the removed illustration setting")
for js_path in ["js/my-cinemap-art.js", "js/my-cinemap-tools.js"]:
    p = ROOT / js_path
    if p.exists():
        r = subprocess.run(["node", "--check", str(p)], capture_output=True, text=True)
        if r.returncode:
            errors.append(f"JavaScript syntax failed for {js_path}: {r.stderr.strip()}")

# IMAX GT directory must include verified screens and an experience-page path.
if not any(x.get("format") == "IMAX GT" and x.get("screen") for x in formats):
    errors.append("No verified IMAX GT screen entries")
if "format=IMAX%20GT" not in text("experience.html"):
    errors.append("Experience page does not link to IMAX GT screen directory")
for required in ["グランドシネマサンシャイン 池袋", "シアター12", "109シネマズ大阪エキスポシティ", "シアター11"]:
    if required not in text("experience.html"):
        errors.append(f"Experience IMAX GT detail missing: {required}")

for page in ["index.html","search.html","rankings.html","theaters.html","experience.html","my-cinemap.html","critic.html"]:
    if '<a href="agent.html">映画コンシェルジュ</a>' in text(page):
        errors.append(f"Standalone concierge nav remains in {page}")

if errors:
    print("Discovery/UI integration gate failed:")
    for e in errors:
        print("-", e)
    sys.exit(1)
print("Discovery/UI integration gate passed.")
