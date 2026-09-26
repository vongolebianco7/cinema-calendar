from pathlib import Path
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

def text(name):
    return (ROOT / name).read_text(encoding="utf-8")

def load_json(name):
    return json.loads((ROOT / name).read_text(encoding="utf-8"))

calendar = text("index.html")
formats = load_json("data/theater_formats.json")

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
        errors.append(f"Legacy movie concierge drawer link remains in {page}")

if errors:
    print("Discovery/UI integration gate failed:")
    for err in errors:
        print("-", err)
    sys.exit(1)
print("Discovery/UI integration gate passed.")
