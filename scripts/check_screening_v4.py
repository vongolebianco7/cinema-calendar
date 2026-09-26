import pathlib, sys

html = pathlib.Path('search.html').read_text(encoding='utf-8')
errors=[]
required=[
    'IMAX撮影と拡張画角を確認できる作品は、CinemapではIMAXとの相性を高く評価します。',
    'formatVerdictLabelV5',
    'なぜこの評価？',
    'この作品で効くポイント',
    '方式固有の裏付け',
]
for token in required:
    if token not in html: errors.append('missing '+token)
if 'if(key==="imax"&&e.filmed_for_imax===true&&e.imax_expanded_ratio&&e.imax_expanded_ratio!=="unknown")score=5' not in html:
    errors.append('verified IMAX capture + expanded ratio must score 5')
if 'function verdictV3(score)' in html:
    errors.append('old ambiguous compact verdict function remains')
if errors:
    print('screening v4 failed')
    [print('-',e) for e in errors]
    sys.exit(1)
print('screening v4 passed')
