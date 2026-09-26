from pathlib import Path
import sys

html = Path('index.html').read_text(encoding='utf-8')
model = Path('js/screening-model-v7.js').read_text(encoding='utf-8')
errors=[]

for token in ['js/screening-model-v7.js','ScreeningModelV7.scoreMovie','通常上映','IMAX','Dolby Cinema','4DX / MX4D','ScreenX']:
    if token not in html and token not in model:
        errors.append('missing shared screening behavior: '+token)
for token in ['{name:"Dolby Atmos"','score:visual?5:action?4:3','rows.sort((a,b)=>b.score-a.score']:
    if token in html:
        errors.append('legacy independent index screening logic remains: '+token)
for token in ['IMAX一択','一択','最優先で選ぶ','プレミアム方式']:
    if token in html:
        errors.append('unsafe/obsolete wording remains: '+token)
if 'formatHeroTitle' in html:
    errors.append('top-page final verdict hero must stay removed')
if errors:
    print('index screening sync v6/v7 failed')
    [print('-',e) for e in errors]
    sys.exit(1)
print('index screening sync v6/v7 passed')
