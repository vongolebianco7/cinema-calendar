from pathlib import Path
expected = {
    'discover.html': ['mobile-movie-rails-v1', '#grid.grid{display:flex', '#grid .card{flex:0 0 104px', 'overflow-x:auto'],
    'rankings.html': ['mobile-movie-rails-v1', '.rankGrid{display:flex', '.rankCard{flex:0 0 104px', 'overflow-x:auto'],
    'search.html': ['mobile-movie-rails-v1', '.grid{display:flex', '.grid>.card{flex:0 0 112px', 'overflow-x:auto'],
}
failed=[]
for name,tokens in expected.items():
    text=Path(name).read_text(encoding='utf-8')
    missing=[t for t in tokens if t not in text]
    if missing: failed.append(f'{name}: missing {missing}')
if failed: raise SystemExit('\n'.join(failed))
print('mobile movie rail regression checks passed')
