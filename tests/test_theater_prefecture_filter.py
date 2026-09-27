from pathlib import Path
html = Path("theaters.html").read_text(encoding="utf-8")
src = Path("scripts/apply_theater_comparison_table_20260927.py").read_text(encoding="utf-8")
checks_html = {
    "prefecture label": "都道府県で絞り込む",
    "prefecture select": 'id="prefectureFilter"',
    "all-prefectures option": "すべての都道府県",
    "tokyo option": '<option value="東京都">東京都</option>',
    "kanagawa option": '<option value="神奈川県">神奈川県</option>',
    "mobile select style": "prefectureFilterRow",
}
checks_src = {
    "url restore": "get('prefecture')||''",
    "prefecture AND filter": "if(prefectureFilter)directory=directory.filter(t=>String(t.prefecture||'')===prefectureFilter);",
    "prefecture query write": "p.set('prefecture',prefectureFilter)",
    "prefecture query clear": "p.delete('prefecture')",
    "prefecture change listener": "prefectureSelect.addEventListener('change'",
    "empty-state respects prefecture": "if(!q&&!equipmentFilter&&!prefectureFilter)",
}
missing=[name for name, marker in {**checks_html, **checks_src}.items() if marker not in (html if name in checks_html else src)]
if missing:
    raise SystemExit("missing: "+", ".join(missing))
if html.count('<option value=') < 47:
    raise SystemExit('prefecture list is incomplete')
print('theater prefecture filter checks passed')
