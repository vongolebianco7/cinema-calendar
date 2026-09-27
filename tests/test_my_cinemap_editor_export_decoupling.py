from pathlib import Path

art = Path('js/my-cinemap-art.js').read_text(encoding='utf-8')
direction = Path('js/my-cinemap-art-direction.js').read_text(encoding='utf-8')

style = direction.split("const style=document.createElement('style');",1)[1].split('document.head.appendChild(style);',1)[0]
assert '#list.editorRankingFixedTwoColumn{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))' in style
assert '#list.editorRankingFixedTwoColumn .compactMovieItem:nth-child(-n+5){grid-column:1!important}' in style
assert '#list.editorRankingFixedTwoColumn .compactMovieItem:nth-child(n+6){grid-column:2!important}' in style

# Root-cause regression: format/layout were bound to the original render function before the
# tools module wrapped render(). Rebind them after enhancement so an export-layout change cannot
# rebuild the editor without its compact two-column classes.
assert 'function bindExportControlsToEnhancedRender()' in direction
assert "['format','layout'].forEach(id=>" in direction
assert 'control.onchange=()=>{render();markEditorRanking()}' in direction
assert 'bindExportControlsToEnhancedRender();' in direction

# Exported image layout remains independently selectable.
assert "const columns=layout==='double'?2:1;" in art
