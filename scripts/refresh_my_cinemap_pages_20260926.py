from pathlib import Path
import re

VERSION = "20260926-theme-mount-v2"

html_path = Path("my-cinemap.html")
html = html_path.read_text(encoding="utf-8")
html, html_count = re.subn(
    r'<script src="js/my-cinemap-art\.js(?:\?v=[^"]+)?"></script>',
    f'<script src="js/my-cinemap-art.js?v={VERSION}"></script>',
    html,
    count=1,
)
if html_count != 1:
    raise SystemExit("Could not find exactly one My Cinemap artwork script tag")
html_path.write_text(html, encoding="utf-8")

art_path = Path("js/my-cinemap-art.js")
art = art_path.read_text(encoding="utf-8")
art, tools_count = re.subn(
    r"s\.src='js/my-cinemap-tools\.js(?:\?v=[^']+)?'",
    f"s.src='js/my-cinemap-tools.js?v={VERSION}'",
    art,
    count=1,
)
if tools_count != 1:
    raise SystemExit("Could not find exactly one My Cinemap tools loader")
art_path.write_text(art, encoding="utf-8")

print(f"Refreshed My Cinemap asset URLs to {VERSION}")