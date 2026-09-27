from pathlib import Path

html = Path('my-cinemap.html').read_text(encoding='utf-8')

# Selected ranking must be two columns from first paint and not depend on export layout.
assert '#list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))' in html
assert '#list>.item:nth-child(-n+5){grid-column:1' in html
assert '#list>.item:nth-child(n+6){grid-column:2' in html

# Export controls must redraw only the canvas, never rebuild the selection list.
assert '["format","layout"].forEach(id=>document.getElementById(id).onchange=()=>drawArtwork(picks))' in html
assert '["format","layout"].forEach(id=>document.getElementById(id).onchange=render)' not in html
