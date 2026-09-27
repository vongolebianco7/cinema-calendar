from pathlib import Path

ui = Path('js/my-cinemap-art-direction.js').read_text(encoding='utf-8')

required = [
    '#list .compactMovieItem>:nth-child(2){display:none!important}',
    '#list .compactMovieItem>:nth-child(3){grid-column:2!important',
    'min-width:0!important',
    'writing-mode:horizontal-tb!important',
    '#list .compactMovieItem:nth-child(-n+5){grid-column:1!important}',
    '#list .compactMovieItem:nth-child(n+6){grid-column:2!important}',
]

missing = [token for token in required if token not in ui]
assert not missing, f'My Cinemap mobile two-column DOM targeting is incomplete: {missing}'
