from pathlib import Path

direction = Path('js/my-cinemap-art-direction.js').read_text(encoding='utf-8')

# Editor layout must not depend on helper-added classes that can be lost when render() rebuilds the list.
assert '#list{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))' in direction
assert '#list .item:nth-child(-n+5){grid-column:1!important}' in direction
assert '#list .item:nth-child(n+6){grid-column:2!important}' in direction
assert '.compactMovieItem:nth-child(-n+5)' not in direction

# Export controls must redraw only the canvas, not rebuild the editor list.
assert "control.onchange=()=>drawArtwork(picks)" in direction
assert "control.onchange=()=>{render();markEditorRanking()}" not in direction
