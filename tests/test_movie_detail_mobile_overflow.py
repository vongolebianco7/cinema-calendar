from pathlib import Path

MARKER = 'movie-detail-mobile-overflow-v1'
REQUIRED = [
    'max-width:100vw',
    'overflow-x:hidden',
    'overflow-x:auto',
    'overscroll-behavior-x:contain',
    '-webkit-overflow-scrolling:touch',
]

for name in ('index.html', 'search.html'):
    text = Path(name).read_text(encoding='utf-8')
    assert MARKER in text, f'{name}: missing mobile detail overflow guard'
    block = text.split('/* '+MARKER+' */', 1)[1].split('</style>', 1)[0]
    for token in REQUIRED:
        assert token in block, f'{name}: missing {token}'
print('movie detail mobile overflow regression: OK')
