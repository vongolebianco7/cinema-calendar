import pathlib, sys

html = pathlib.Path('search.html').read_text(encoding='utf-8')
model = pathlib.Path('js/screening-model-v7.js').read_text(encoding='utf-8')
errors=[]

# Active v7 UI must remain descriptive rather than directive.
active = html[html.find('function screeningRecommendationV3Html'):html.find('function renderDetail')]
for token in ['おすすめ','一択','絶対','最優先','プレミアム方式','評価します']:
    if token in active:
        errors.append('directive/obsolete wording remains in active renderer: '+token)
for token in ['作品との相性','作品固有情報','公式版未確認','通常上映は3〜4']:
    if token not in active:
        errors.append('missing neutral explanation: '+token)
for token in ['standardRow','score=maxSpecial>=4?3:4','score=2','subscores:{picture,audio}']:
    if token not in model:
        errors.append('missing v7 scoring invariant: '+token)
if errors:
    print('screening wording v5/v7 failed')
    [print('-',e) for e in errors]
    sys.exit(1)
print('screening wording v5/v7 passed')
