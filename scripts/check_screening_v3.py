import pathlib, sys

html = pathlib.Path('search.html').read_text(encoding='utf-8')
errors = []

required = [
    'この作品なら',
    'formatHero',
    'formatCompactGrid',
    'data-format-detail',
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

# v3 semantics can use the clearer v4 labels.
if not (('作品との相性' in html and '専用最適化' in html and '判定根拠' in html) or ('この作品で効くポイント' in html and '方式固有の裏付け' in html and 'なぜこの評価？' in html)):
    errors.append('missing screening recommendation explanation structure')

if 'data-format-key="atmos"' in html or '{name:"Dolby Atmos"' in html:
    errors.append('Dolby Atmos must not be a peer screening-format card')

if '上映方式おすすめの理由</strong>' in html and 'data-format-detail' not in html:
    errors.append('format reasons must be progressive-disclosure details')

if errors:
    print('Screening recommendation v3 check failed:')
    for e in errors:
        print('-', e)
    sys.exit(1)
print('Screening recommendation v3 check passed.')
