import pathlib, sys

html = pathlib.Path('search.html').read_text(encoding='utf-8')
errors=[]

# User-facing wording must avoid the vague/marketing-heavy umbrella term.
if 'プレミアム方式' in html:
    errors.append('remove user-facing プレミアム方式 wording')

# Standard screening is the baseline cinema presentation and must never be rated below 3/5.
if 'key==="standard"' not in html:
    errors.append('standard format branch missing')
if 'Math.max(3' not in html:
    errors.append('standard screening must have an explicit 3-star floor')

# Avoid absolute recommendations.
for token in ['一択','絶対','最優先で選ぶ']:
    if token in html:
        errors.append('avoid absolute recommendation wording: '+token)

# Preferred neutral recommendation language.
for token in ['特におすすめ','特殊上映','Cinemapの相性評価']:
    if token not in html:
        errors.append('missing neutral wording: '+token)

# Quiet/conversation-led drama and Japanese romance without spectacle signals
# must not receive high 4DX/MX4D or ScreenX recommendations.
for token in ['applyScreeningCapsV5','quietNarrative','isJapaneseRomance','x.key==="motion"||x.key==="screenx"','Math.min(x.score,2)']:
    if token not in html:
        errors.append('missing quiet-film motion/ScreenX cap: '+token)

# IMAX without verified expanded aspect ratio should be strongly downgraded.
for token in ['x.key==="imax"','expandedRatioVerified','Math.min(x.score,2)']:
    if token not in html:
        errors.append('missing IMAX no-expanded-ratio cap: '+token)

if errors:
    print('screening wording v5 failed')
    [print('-',e) for e in errors]
    sys.exit(1)
print('screening wording v5 passed')
