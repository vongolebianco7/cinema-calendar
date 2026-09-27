from pathlib import Path

direction = Path('js/my-cinemap-art-direction.js').read_text(encoding='utf-8')

assert 'editorRankingFixedTwoColumn' in direction
assert '#list.editorRankingFixedTwoColumn{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))' in direction
assert '#list.editorRankingFixedTwoColumn .compactMovieItem:nth-child(-n+5){grid-column:1!important}' in direction
assert '#list.editorRankingFixedTwoColumn .compactMovieItem:nth-child(n+6){grid-column:2!important}' in direction
assert '#list.editorRankingFixedTwoColumn .compactMovieItem>:nth-child(2){display:none!important}' in direction
assert 'document.getElementById(\'layout\')' not in direction.split('const style=document.createElement(\'style\');',1)[1].split('document.head.appendChild(style);',1)[0]
