import pathlib, sys

html = pathlib.Path('search.html').read_text(encoding='utf-8')
errors = []

required = [
    'この作品なら',
    'formatHero',
    'formatCompactGrid',
    'data-format-detail',
    '作品との相性',
    '専用最適化',
    '判定根拠',
    'compatibilityScore',
    'optimizationScore',
    'darkVisualScore',
    'colorRichScore',
    'musicAudioScore',
    'motionPhysicalityScore',
    'spatialImmersionScore',
]
for token in required:
    if token not in html:
        errors.append(f'missing v3 token: {token}')

# Dolby Atmos is a supporting technology, not a peer card.
if 'data-format-key="atmos"' in html or '{name:"Dolby Atmos"' in html:
    errors.append('Dolby Atmos must not be a peer screening-format card')

# Long evidence should be hidden behind progressive disclosure by default.
if '上映方式おすすめの理由</strong>' in html and 'data-format-detail' not in html:
    errors.append('format reasons must be progressive-disclosure details')

if errors:
    print('Screening recommendation v3 check failed:')
    for e in errors:
        print('-', e)
    sys.exit(1)
print('Screening recommendation v3 check passed.')
