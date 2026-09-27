from pathlib import Path
import re
import sys

HTML = Path('theaters.html')
TEST = Path('tests/test_theater_comparison_table.py')

TEST_BODY = r'''from pathlib import Path
html = Path("theaters.html").read_text(encoding="utf-8")
checks = {
    "table marker": "cinemap-theater-table-v1",
    "scroll wrapper": "theaterTableWrap",
    "table": "theaterTable",
    "theater header": "映画館</th>",
    "area header": "エリア</th>",
    "imax header": "IMAX</th>",
    "dolby header": "Dolby</th>",
    "motion header": "4DX / MX4D</th>",
    "screenx header": "ScreenX</th>",
    "equipment header": "スクリーン設備</th>",
    "strict equipment match": "strictTheaterFormatRows",
    "generic chain guard": "isGenericChainOnly",
    "format-data theater source": "equipmentTheaters",
    "active table renderer": "window.renderDirectory=renderTheaterTable",
    "table scoped scroll": "overflow-x:auto",
    "page overflow guard": "html,body{overflow-x:hidden}",
}
missing = [name for name, marker in checks.items() if marker not in html]
if missing:
    raise SystemExit("missing: " + ", ".join(missing))
print("theater comparison table checks passed")
'''

STYLE = r'''
<style id="cinemap-theater-table-v1">
html,body{overflow-x:hidden}
.theaterTableWrap{width:100%;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;border-top:1px solid var(--line);border-bottom:1px solid var(--line);scrollbar-width:thin}
.theaterTable{width:100%;min-width:860px;border-collapse:collapse;table-layout:auto;font-size:11px}
.theaterTable th,.theaterTable td{padding:11px 10px;border-bottom:1px solid #252525;text-align:left;vertical-align:top;white-space:nowrap}
.theaterTable th{position:sticky;top:0;background:#101010;color:#8f8f8f;font-size:9px;letter-spacing:.05em;font-weight:750;z-index:2}
.theaterTable th:first-child,.theaterTable td:first-child{position:sticky;left:0;z-index:1;background:#090909;min-width:190px;max-width:230px;white-space:normal}
.theaterTable th:first-child{z-index:3;background:#101010}
.theaterTable .theaterName{font-size:12px;font-weight:800;color:#eee;line-height:1.45}
.theaterTable .areaCell{color:#aaa;white-space:normal;min-width:110px;max-width:180px;line-height:1.45}
.theaterTable .verifiedCell{color:#ddc89b;font-weight:700}.theaterTable .unknownCell{color:#666}
.theaterTable .equipmentCell{min-width:190px;max-width:300px;white-space:normal;color:#aaa;line-height:1.5}
.theaterTable .tableLinks{display:flex;gap:9px;flex-wrap:wrap;min-width:130px}.theaterTable .tableLinks a{color:#bbb;text-decoration:underline;text-underline-offset:2px}
.theaterTable .equipmentSource{display:inline-block;margin-top:4px;color:#cdbb91;text-decoration:underline;text-underline-offset:2px}
.tableHint{display:none;color:#777;font-size:9px;margin:-7px 0 10px}
@media(max-width:600px){.tableHint{display:block}.theaterTable{min-width:780px}.theaterTable th,.theaterTable td{padding:10px 8px}.theaterTable th:first-child,.theaterTable td:first-child{min-width:168px;max-width:190px}}
</style>
'''

JS = r'''
<script id="cinemap-theater-table-js-v1">
(function(){
 const normName=s=>String(s||'').replace(/[\s　・･\.\-（）()]/g,'').toLowerCase();
 const genericNames=new Set(['tohoシネマ','tohoシネマズ','tジョイ','t・ジョイ','ティジョイ','イオンシネマ','movix','ユナイテッドシネマ','ユナイテッド・シネマ','109シネマズ']);
 window.isGenericChainOnly=function(t){
   const n=String(t&&t.name||'').trim().toLowerCase();
   return genericNames.has(n) && !(t&&t.address) && !(t&&t.municipality);
 };
 window.strictTheaterFormatRows=function(t){
   const tn=normName(t&&t.name);
   if(!tn||window.isGenericChainOnly(t))return [];
   return (formatData.screens||[]).filter(x=>normName(x.theater)===tn);
 };
 function familyRows(rows,kind){
   return rows.filter(x=>{
     const f=String(x.format||'');
     if(kind==='imax')return /^IMAX/i.test(f);
     if(kind==='dolby')return /Dolby Cinema|Dolby Atmos/i.test(f)||/Dolby Atmos/i.test(String(x.screen||''));
     if(kind==='motion')return /^(4DX|MX4D)$/i.test(f);
     if(kind==='screenx')return /SCREENX/i.test(f)||/SCREENX/i.test(String(x.screen||''));
     return false;
   });
 }
 function cellFormats(rows,kind){
   const vals=[...new Set(familyRows(rows,kind).map(x=>String(x.format||'').trim()).filter(Boolean))];
   return vals.length?'<span class="verifiedCell">'+vals.map(esc).join(' / ')+'</span>':'<span class="unknownCell">未確認</span>';
 }
 function bestDirectoryMatch(name,all){
   const n=normName(name);
   return all.find(t=>!window.isGenericChainOnly(t)&&normName(t.name)===n)||null;
 }
 window.equipmentTheaters=function(all,filter){
   const rows=(formatData.screens||[]).filter(x=>!filter||formatFamilyMatch(x.format,filter)||formatFamilyMatch(x.screen,filter));
   const map=new Map();
   rows.forEach(x=>{
     const k=normName(x.theater);
     if(!k)return;
     const base=bestDirectoryMatch(x.theater,all)||{name:x.theater,prefecture:x.prefecture||'',municipality:'',address:'',website:'',_equipmentOnly:true};
     if(!map.has(k))map.set(k,base);
   });
   return [...map.values()];
 };
 function formatFamilyMatch(actual,wanted){
   actual=String(actual||'').trim(); wanted=String(wanted||'').trim();
   if(!wanted)return true;
   if(wanted==='IMAX')return /^IMAX/i.test(actual);
   if(wanted==='ScreenX')return /screenx/i.test(actual);
   if(wanted==='Dolby Atmos')return /dolby atmos/i.test(actual)||/atmos/i.test(actual);
   return actual.toLowerCase()===wanted.toLowerCase();
 }
 function rowHtml(t){
   const rows=window.strictTheaterFormatRows(t);
   const place=[t.prefecture,t.municipality,t.address].filter(Boolean).join(' ')||'所在地未確認';
   const screens=[...new Set(rows.map(x=>String(x.screen||'').trim()).filter(Boolean))];
   const source=rows.find(x=>x.source_url)?.source_url||'';
   const equipment=screens.length?screens.map(esc).join(' / '):'<span class="unknownCell">未確認</span>';
   const links=(t.website?'<a target="_blank" rel="noopener noreferrer" href="'+esc(t.website)+'">公式</a>':'')+'<a target="_blank" rel="noopener noreferrer" href="'+scheduleUrl(t)+'">上映</a><a target="_blank" rel="noopener noreferrer" href="'+mapsUrl(t)+'">地図</a>';
   return '<tr><td><div class="theaterName">'+esc(t.name||'店舗未確認')+'</div></td><td class="areaCell">'+esc(place)+'</td><td>'+cellFormats(rows,'imax')+'</td><td>'+cellFormats(rows,'dolby')+'</td><td>'+cellFormats(rows,'motion')+'</td><td>'+cellFormats(rows,'screenx')+'</td><td class="equipmentCell">'+equipment+(source?'<br><a class="equipmentSource" target="_blank" rel="noopener noreferrer" href="'+esc(source)+'">公式設備情報</a>':'')+'</td><td><div class="tableLinks">'+links+'</div></td></tr>';
 }
 function renderTheaterTable(){
   const all=[...theaters,...osmTheaters],uniq=new Map();
   all.forEach(t=>{if(window.isGenericChainOnly(t))return;const k=normName(t.name)+'|'+String(t.prefecture||'')+'|'+String(t.municipality||'');if(k&&!uniq.has(k))uniq.set(k,t)});
   let directory=equipmentFilter?window.equipmentTheaters([...uniq.values()],equipmentFilter):[...uniq.values()];
   directoryCache=directory;
   const q=$("#q").value.trim().toLowerCase();
   if(q)directory=directory.filter(t=>[t.name,t.prefecture,t.municipality,t.address].filter(Boolean).join(' ').toLowerCase().includes(q));
   if(!q&&!equipmentFilter){$("#meta").textContent=directory.length+'館収録 · 名前・地域、または上映方式で探せます';$("#grid").innerHTML='<div class="empty">映画館名・住所・地域を入力するか、上映方式を選んでください。</div>';return}
   $("#meta").textContent=directory.length+'件表示'+(equipmentFilter?' · '+equipmentFilter:'');
   if(!directory.length){$("#grid").innerHTML='<div class="empty">条件に合う映画館がありません。</div>';return}
   $("#grid").innerHTML='<div class="tableHint">表は左右にスワイプできます</div><div class="theaterTableWrap"><table class="theaterTable"><thead><tr><th>映画館</th><th>エリア</th><th>IMAX</th><th>Dolby</th><th>4DX / MX4D</th><th>ScreenX</th><th>スクリーン設備</th><th>リンク</th></tr></thead><tbody>'+directory.slice(0,150).map(rowHtml).join('')+'</tbody></table></div>';
 }
 let equipmentFilter=selectedFormat||'';
 window.renderDirectory=renderTheaterTable;
 document.querySelectorAll('[data-format-filter]').forEach(b=>{
   b.replaceWith(b.cloneNode(true));
 });
 document.querySelectorAll('[data-format-filter]').forEach(b=>b.addEventListener('click',()=>{
   equipmentFilter=b.dataset.formatFilter||''; selectedFormat=equipmentFilter;
   document.querySelectorAll('[data-format-filter]').forEach(x=>x.classList.toggle('active',x===b));
   const p=new URLSearchParams(location.search);if(equipmentFilter)p.set('format',equipmentFilter);else p.delete('format');history.replaceState(null,'',location.pathname+(p.toString()?'?'+p:''));
   renderTheaterTable();
 }));
 const input=$("#q"); if(input){const fresh=input.cloneNode(true);input.replaceWith(fresh);fresh.addEventListener('input',renderTheaterTable);}
 const timer=setInterval(()=>{if((theaters.length||osmTheaters.length)&&formatData&&Array.isArray(formatData.screens)){clearInterval(timer);renderTheaterTable();}},100);
 setTimeout(()=>clearInterval(timer),8000);
})();
</script>
'''

def prepare_tests():
    TEST.parent.mkdir(exist_ok=True)
    TEST.write_text(TEST_BODY, encoding='utf-8')

def apply():
    text=HTML.read_text(encoding='utf-8')
    text=re.sub(r'<script id="cinemap-theater-equipment-js-v1">.*?</script>\s*', '', text, flags=re.S)
    text=re.sub(r'<style id="cinemap-theater-table-v1">.*?</style>\s*', '', text, flags=re.S)
    text=re.sub(r'<script id="cinemap-theater-table-js-v1">.*?</script>\s*', '', text, flags=re.S)
    text=text.replace('</head>', STYLE+'\n</head>',1)
    text=text.replace('</body>', JS+'\n</body>',1)
    HTML.write_text(text,encoding='utf-8')

if __name__=='__main__':
    if len(sys.argv)!=2 or sys.argv[1] not in {'prepare-tests','apply'}:raise SystemExit('usage: prepare-tests|apply')
    prepare_tests() if sys.argv[1]=='prepare-tests' else apply()
