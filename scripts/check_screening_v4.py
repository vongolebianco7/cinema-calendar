import pathlib, sys

html = pathlib.Path('search.html').read_text(encoding='utf-8')
errors=[]
required=[
    'IMAX撮影と拡張画角を確認済みならIMAXを最優先',
    'formatVerdictLabelV4',
    'なぜこの評価？',
    'この作品で効くポイント',
    '方式固有の裏付け',
]
for token in required:
    if token not in html: errors.append('missing '+token)
# Oppenheimer-type verified IMAX capture + expanded ratio must hard-lock to 5 stars.
if 'if(key==="imax"&&e.filmed_for_imax===true&&e.imax_expanded_ratio&&e.imax_expanded_ratio!=="unknown")score=5' not in html:
    errors.append('verified IMAX capture + expanded ratio must score 5')
# Ambiguous bare labels from v3 should be replaced.
if 'かなり向く' in html or '候補' in html or '優先度低め' in html:
    errors.append('ambiguous compact verdict labels remain')
if errors:
    print('screening v4 failed')
    [print('-',e) for e in errors]
    sys.exit(1)
print('screening v4 passed')
