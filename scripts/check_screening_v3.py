import pathlib, sys

html = pathlib.Path('search.html').read_text(encoding='utf-8')
model = pathlib.Path('js/screening-model-v7.js').read_text(encoding='utf-8')
errors = []

for token in ['js/screening-model-v7.js','formatCompactGrid','data-format-detail','作品との相性','作品固有情報']:
    if token not in html:
        errors.append(f'missing shared screening UI token: {token}')
for token in ['standard','imax','dolby_cinema','motion','screenx']:
    if token not in model:
        errors.append(f'missing shared format: {token}')
if 'data-format-key="atmos"' in html or '{name:"Dolby Atmos"' in html:
    errors.append('Dolby Atmos must not be a peer screening-format card')
if 'formatHeroTitle' in html:
    errors.append('top-level final verdict hero must stay removed')

if errors:
    print('Screening recommendation compatibility check failed:')
    for e in errors: print('-', e)
    sys.exit(1)
print('Screening recommendation compatibility check passed.')
