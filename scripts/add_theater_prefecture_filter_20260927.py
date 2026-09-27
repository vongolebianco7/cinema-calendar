from pathlib import Path
import sys

SOURCE = Path('scripts/apply_theater_comparison_table_20260927.py')
HTML = Path('theaters.html')
TEST = Path('tests/test_theater_prefecture_filter.py')

PREFS = ['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県']

TEST_BODY = r'''from pathlib import Path
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
'''

STYLE = '''\n<style id="cinemap-theater-prefecture-v1">\n.prefectureFilterRow{display:flex;align-items:center;gap:10px;margin-top:12px}.prefectureFilterRow label{flex:0 0 auto;color:#aaa;font-size:11px;font-weight:800}.prefectureFilterRow select{min-width:190px;max-width:100%;background:#121212;color:#eee;border:1px solid #383838;border-radius:6px;padding:9px 34px 9px 11px;font:inherit;font-size:12px}.prefectureFilterRow select:focus{outline:1px solid #777;outline-offset:1px}@media(max-width:520px){.prefectureFilterRow{display:block}.prefectureFilterRow label{display:block;margin-bottom:7px}.prefectureFilterRow select{width:100%;min-width:0;font-size:16px}}\n</style>\n'''

def select_markup():
    options=''.join(f'<option value="{p}">{p}</option>' for p in PREFS)
    return '\n <div class="prefectureFilterRow"><label for="prefectureFilter">都道府県で絞り込む</label><select id="prefectureFilter" aria-label="都道府県で映画館を絞り込む"><option value="">すべての都道府県</option>'+options+'</select></div>\n'

def prepare_tests():
    TEST.parent.mkdir(exist_ok=True)
    TEST.write_text(TEST_BODY, encoding='utf-8')

def patch_source():
    text=SOURCE.read_text(encoding='utf-8')
    anchor="   let directory=equipmentFilter?window.equipmentTheaters([...uniq.values()],equipmentFilter):[...uniq.values()];\n   directoryCache=directory;"
    repl="   let directory=equipmentFilter?window.equipmentTheaters([...uniq.values()],equipmentFilter):[...uniq.values()];\n   if(prefectureFilter)directory=directory.filter(t=>String(t.prefecture||'')===prefectureFilter);\n   directoryCache=directory;"
    if repl not in text:
        if anchor not in text: raise SystemExit('directory filter anchor not found')
        text=text.replace(anchor,repl,1)
    text=text.replace("   if(!q&&!equipmentFilter){", "   if(!q&&!equipmentFilter&&!prefectureFilter){", 1)
    text=text.replace("   $(\"#meta\").textContent=directory.length+'件表示'+(equipmentFilter?' · '+equipmentFilter:'');", "   $(\"#meta\").textContent=directory.length+'件表示'+(equipmentFilter?' · '+equipmentFilter:'')+(prefectureFilter?' · '+prefectureFilter:'');", 1)
    var_anchor=" let equipmentFilter=selectedFormat||'';\n window.renderDirectory=renderTheaterTable;"
    var_repl=" let equipmentFilter=selectedFormat||'';\n let prefectureFilter=new URLSearchParams(location.search).get('prefecture')||'';\n window.renderDirectory=renderTheaterTable;"
    if var_repl not in text:
        if var_anchor not in text: raise SystemExit('filter variable anchor not found')
        text=text.replace(var_anchor,var_repl,1)
    listener_anchor=" const input=$(\"#q\"); if(input){const fresh=input.cloneNode(true);input.replaceWith(fresh);fresh.addEventListener('input',renderTheaterTable);}"
    listener_repl=" const prefectureSelect=document.getElementById('prefectureFilter');\n if(prefectureSelect){\n   prefectureSelect.value=prefectureFilter;\n   prefectureSelect.addEventListener('change',()=>{\n     prefectureFilter=prefectureSelect.value||'';\n     const p=new URLSearchParams(location.search);if(prefectureFilter)p.set('prefecture',prefectureFilter);else p.delete('prefecture');history.replaceState(null,'',location.pathname+(p.toString()?'?'+p:''));\n     renderTheaterTable();\n   });\n }\n const input=$(\"#q\"); if(input){const fresh=input.cloneNode(true);input.replaceWith(fresh);fresh.addEventListener('input',renderTheaterTable);}"
    if listener_repl not in text:
        if listener_anchor not in text: raise SystemExit('listener anchor not found')
        text=text.replace(listener_anchor,listener_repl,1)
    SOURCE.write_text(text,encoding='utf-8')

def patch_html():
    text=HTML.read_text(encoding='utf-8')
    if 'id="cinemap-theater-prefecture-v1"' not in text:
        text=text.replace('</head>',STYLE+'\n</head>',1)
    if 'id="prefectureFilter"' not in text:
        anchor=' </div>\n</div>\n\n <div class="meta" id="meta"></div>'
        if anchor not in text: raise SystemExit('theater tools markup anchor not found')
        text=text.replace(anchor,' </div>'+select_markup()+'</div>\n\n <div class="meta" id="meta"></div>',1)
    HTML.write_text(text,encoding='utf-8')

def apply():
    patch_source()
    patch_html()

if __name__=='__main__':
    if len(sys.argv)!=2 or sys.argv[1] not in {'prepare-tests','apply'}:
        raise SystemExit('usage: prepare-tests|apply')
    prepare_tests() if sys.argv[1]=='prepare-tests' else apply()
