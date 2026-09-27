from pathlib import Path

art = Path('js/my-cinemap-art.js').read_text(encoding='utf-8')

# Selected ranking must be two columns from the first rendered frame, before async helper scripts load.
assert "id='my-cinemap-selection-layout'" in art
assert '#list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))' in art
assert '#list>.item:nth-child(-n+5){grid-column:1' in art
assert '#list>.item:nth-child(n+6){grid-column:2' in art

# Export controls must redraw only the canvas, never rebuild the selected-ranking DOM.
assert "document.getElementById(id).onchange=()=>drawArtwork(picks)" in art
assert "['format','layout'].forEach" in art
