from pathlib import Path

art = Path('js/my-cinemap-art.js').read_text(encoding='utf-8')
cinema = Path('js/my-cinemap-cinema-templates.js').read_text(encoding='utf-8')

required_art = [
    'const rankNumberWeight=600',
    'const metaTextWeight=600',
    'const noteTextWeight=600',
    'const brandScale=1.28',
]
required_cinema = [
    "muted:'#4b4036'",
    "muted:'#eee2cf'",
    'ctx.globalAlpha=.96',
    'metaTextWeight',
    'noteTextWeight',
    'rankNumberWeight',
]

missing = [token for token in required_art if token not in art]
missing += [token for token in required_cinema if token not in cinema]
if missing:
    raise SystemExit(f'My Cinemap contrast/branding requirements missing: {missing}')

print('My Cinemap rank/director/note contrast and Cinemap branding passed')
