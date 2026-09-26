from pathlib import Path
import sys

html = Path('index.html').read_text(encoding='utf-8')
errors=[]

# Top-page movie modal must not keep the legacy independent recommendation model.
legacy = [
    '{name:"Dolby Atmos"',
    'score:visual?5:action?4:3',
    'rows.sort((a,b)=>b.score-a.score',
]
for token in legacy:
    if token in html:
        errors.append('legacy index screening logic remains: '+token)

# Keep the same five-format model as the canonical movie detail UI.
for token in [
    'INDEX_SCREENING_EVIDENCE',
    'indexScreeningEvidenceRow',
    'applyIndexScreeningCapsV6',
    '通常上映',
    'IMAX',
    'Dolby Cinema',
    '4DX / MX4D',
    'ScreenX',
    'Math.max(3',
    'Math.min(x.score,3)',
    'Math.min(x.score,2)',
    'Cinemapの相性評価',
]:
    if token not in html:
        errors.append('missing synced screening behavior: '+token)

# User-facing recommendations must avoid absolute language.
for token in ['IMAX一択','一択','最優先で選ぶ','プレミアム方式']:
    if token in html:
        errors.append('unsafe/obsolete wording remains: '+token)

if errors:
    print('index screening sync v6 failed')
    [print('-',e) for e in errors]
    sys.exit(1)
print('index screening sync v6 passed')
