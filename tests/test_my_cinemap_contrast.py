from pathlib import Path

cinema = Path('js/my-cinemap-cinema-templates.js').read_text(encoding='utf-8')

required = [
    "const rankNumberWeight=650",
    "const metaTextWeight=600",
    "const noteTextWeight=600",
    "const brandScale=1.4",
    "muted:'#4b4036'",
    "muted:'#eee2cf'",
    "function drawCinemaMedal",
    "function drawCinemaBrand",
    "ctx.globalAlpha=.96",
    "metaTextWeight",
    "noteTextWeight",
    "rankNumberWeight",
]

missing = [token for token in required if token not in cinema]
if missing:
    raise SystemExit(f'My Cinemap cinema contrast/branding requirements missing: {missing}')

print('My Cinemap cinema rank/director/note contrast and Cinemap branding passed')
