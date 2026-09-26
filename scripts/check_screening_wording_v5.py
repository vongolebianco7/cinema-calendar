import pathlib, sys

html = pathlib.Path('search.html').read_text(encoding='utf-8')
errors=[]

if 'プレミアム方式' in html:
    errors.append('remove user-facing プレミアム方式 wording')

if 'key==="standard"' not in html:
    errors.append('standard format branch missing')
if 'Math.max(3' not in html:
    errors.append('standard screening must have an explicit 3-star floor')

for token in ['一択','絶対','最優先で選ぶ']:
    if token in html:
        errors.append('avoid absolute recommendation wording: '+token)

for token in ['特におすすめ','特殊上映','Cinemapの相性評価']:
    if token not in html:
        errors.append('missing neutral wording: '+token)

for token in ['applyScreeningCapsV5','quietNarrative','isJapaneseRomance','x.key==="motion"||x.key==="screenx"','Math.min(x.score,2)']:
    if token not in html:
        errors.append('missing quiet-film motion/ScreenX cap: '+token)

for token in ['x.key==="imax"','expandedRatioVerified','Math.min(x.score,3)']:
    if token not in html:
        errors.append('missing IMAX no-expanded-ratio cap: '+token)

if errors:
    print('screening wording v5 failed')
    [print('-',e) for e in errors]
    sys.exit(1)
print('screening wording v5 passed')
