from pathlib import Path

ui = Path('js/my-cinemap-art-direction.js').read_text(encoding='utf-8')

required = [
    'const medalNumberSize=34',
    'const medalNumberWeight=600',
    'const medalStrokeWidth=1.75',
    'const singleMetaSize=23',
    'const doubleMetaSize=21',
    'const metaWeight=600',
    'const noteSize=23',
    'const noteWeight=600',
    'const readableMetaAlpha=.9',
    'function strengthenArtworkTypography',
    'function removePosterExplanationCopy',
]
missing = [token for token in required if token not in ui]
if missing:
    raise SystemExit(f'My Cinemap legibility/copy behavior missing: {missing}')

print('My Cinemap rank, medal, director, note legibility and user-facing copy passed')
