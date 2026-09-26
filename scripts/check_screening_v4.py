import pathlib, sys

model = pathlib.Path('js/screening-model-v7.js').read_text(encoding='utf-8')
html = pathlib.Path('search.html').read_text(encoding='utf-8')
errors=[]
for token in ['imax_expanded_ratio','imax_camera','score=5','拡張画角','IMAXカメラ撮影']:
    if token not in model: errors.append('missing IMAX evidence rule: '+token)
if 'js/screening-model-v7.js' not in html:
    errors.append('search detail must use the shared v7 model')
if 'formatHeroTitle' in html:
    errors.append('final-verdict hero must not return')
if errors:
    print('screening IMAX regression failed')
    [print('-',e) for e in errors]
    sys.exit(1)
print('screening IMAX regression passed')
