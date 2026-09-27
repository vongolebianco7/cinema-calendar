from pathlib import Path

html = Path('my-cinemap.html').read_text(encoding='utf-8')
art = Path('js/my-cinemap-art.js').read_text(encoding='utf-8')
direction = Path('js/my-cinemap-art-direction.js').read_text(encoding='utf-8')

assert 'id="list" class="list editorRankingFixedTwoColumn"' in html
assert 'my-cinemap-art.js?v=20260927-editor-decoupled-v2' in html
assert 'my-cinemap-art-direction.js?v=20260927-editor-decoupled-v2' in art
assert 'cinema-backgrounds-v2' not in art

style = direction.split("const style=document.createElement('style');",1)[1].split('document.head.appendChild(style);',1)[0]
assert '#list.editorRankingFixedTwoColumn{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))' in style
assert "document.getElementById('layout')" not in style

assert "const columns=layout==='double'?2:1;" in art
