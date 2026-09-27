from pathlib import Path
import sys

HTML = Path('theaters.html')
TEST = Path('tests/test_theater_equipment_explorer.py')

TEST_BODY = r'''from pathlib import Path
html = Path("theaters.html").read_text(encoding="utf-8")
checks = {
    "equipment explorer marker": "cinemap-theater-equipment-v1",
    "format filters": 'id="formatFilters"',
    "format all": 'data-format-filter=""',
    "IMAX filter": 'data-format-filter="IMAX"',
    "Dolby Cinema filter": 'data-format-filter="Dolby Cinema"',
    "4DX filter": 'data-format-filter="4DX"',
    "MX4D filter": 'data-format-filter="MX4D"',
    "ScreenX filter": 'data-format-filter="ScreenX"',
    "format tag renderer": "theaterFormatRows",
    "screen equipment renderer": "renderEquipmentSummary",
    "unknown fallback": "スクリーン設備 未確認",
    "experience links": "experience.html?format=",
}
missing = [name for name, marker in checks.items() if marker not in html]
if missing:
    raise SystemExit("missing: " + ", ".join(missing))
if "paid_api" in html.lower() or "google places api" in html.lower():
    raise SystemExit("unexpected new paid API marker")
print("theater equipment explorer checks passed")
'''

STYLE = r'''
<style id="cinemap-theater-equipment-v1">
.theaterTools{margin:14px 0 18px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:14px 0}
.theaterToolsTitle{font-size:11px;font-weight:800;color:#aaa;margin-bottom:8px}
.formatFilters{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px;-webkit-overflow-scrolling:touch}.formatFilters::-webkit-scrollbar{display:none}
.formatFilter{flex:0 0 auto;white-space:nowrap;border:1px solid #383838;background:#121212;color:#ccc;border-radius:999px;padding:8px 11px;font-size:11px}
.formatFilter.active{background:#eee;color:#111;border-color:#eee}
.theaterFormats{display:flex;gap:5px;flex-wrap:wrap;margin-top:9px}.formatTag{display:inline-flex;align-items:center;border:1px solid #4b4030;background:#1b1711;color:#ddc89b;border-radius:999px;padding:4px 7px;font-size:9px;font-weight:750}.formatTag.unknown{border-color:#333;background:#151515;color:#777}
.equipmentSummary{margin-top:9px;padding-top:8px;border-top:1px solid #232323;color:#a2a2a2;font-size:10px;line-height:1.55}.equipmentSummary b{display:block;color:#ddd;font-size:10px;margin-bottom:3px}.equipmentSummary a{color:#cdbb91;text-decoration:underline;text-underline-offset:2px}
.card{min-width:0}.card h3{line-height:1.45}.grid{align-items:start}
@media(max-width:520px){.grid{grid-template-columns:1fr!important}.card{padding:14px 3px}.formatFilters{margin-right:-18px;padding-right:18px}}
</style>
'''

TOOLS = r'''
<div class="theaterTools" aria-label="上映方式で映画館を絞り込み">
 <div class="theaterToolsTitle">上映方式で絞り込む</div>
 <div class="formatFilters" id="formatFilters">
  <button class="formatFilter active" data-format-filter="">すべて</button>
  <button class="formatFilter" data-format-filter="IMAX">IMAX</button>
  <button class="formatFilter" data-format-filter="IMAXレーザー">IMAXレーザー</button>
  <button class="formatFilter" data-format-filter="Dolby Cinema">Dolby Cinema</button>
  <button class="formatFilter" data-format-filter="Dolby Atmos">Dolby Atmos</button>
  <button class="formatFilter" data-format-filter="4DX">4DX</button>
  <button class="formatFilter" data-format-filter="MX4D">MX4D</button>
  <button class="formatFilter" data-format-filter="ScreenX">ScreenX</button>
 </div>
</div>
'''

JS = r'''
<script id="cinemap-theater-equipment-js-v1">
(function(){
 const norm=s=>String(s||'').replace(/[\s　・･\.\-]/g,'').toLowerCase();
 const originalRender=window.renderDirectory;
 let equipmentFilter=selectedFormat||'';
 function formatFamilyMatch(actual,wanted){
   actual=String(actual||'').trim(); wanted=String(wanted||'').trim();
   if(!wanted)return true;
   if(wanted==='IMAX')return /^IMAX/i.test(actual);
   if(wanted==='ScreenX')return /screenx/i.test(actual);
   if(wanted==='Dolby Atmos')return /dolby atmos/i.test(actual)||/atmos/i.test(actual);
   return actual.toLowerCase()===wanted.toLowerCase();
 }
 window.theaterFormatRows=function(t){
   const tn=norm(t&&t.name), pref=String(t&&t.prefecture||'');
   return (formatData.screens||[]).filter(x=>{
     const xn=norm(x.theater);
     if(!tn||!xn)return false;
     const nameMatch=xn===tn||xn.includes(tn)||tn.includes(xn);
     const prefMatch=!pref||!x.prefecture||String(x.prefecture)===pref;
     return nameMatch&&prefMatch;
   });
 };
 window.renderEquipmentSummary=function(t){
   const rows=window.theaterFormatRows(t);
   if(!rows.length)return '<div class="theaterFormats"><span class="formatTag unknown">上映方式 未確認</span></div><div class="equipmentSummary"><b>スクリーン設備 未確認</b>確認できた設備情報のみ表示します。</div>';
   const formats=[...new Set(rows.map(x=>String(x.format||'').trim()).filter(Boolean))];
   const screens=[...new Set(rows.map(x=>String(x.screen||'').trim()).filter(Boolean))];
   const tags=formats.map(f=>'<a class="formatTag" href="experience.html?format='+encodeURIComponent(f)+'">'+esc(f)+'</a>').join('');
   const source=rows.find(x=>x.source_url)?.source_url||'';
   const screenText=screens.length?screens.join(' / '):'未確認';
   return '<div class="theaterFormats">'+tags+'</div><div class="equipmentSummary"><b>スクリーン設備</b>'+esc(screenText)+(source?' · <a target="_blank" rel="noopener noreferrer" href="'+esc(source)+'">公式設備情報</a>':'')+'</div>';
 };
 function renderEnhancedDirectory(){
   const all=[...theaters,...osmTheaters],uniq=new Map();
   all.forEach(t=>{const k=norm(t.name)+'|'+String(t.prefecture||'')+'|'+String(t.municipality||'');if(k&&!uniq.has(k))uniq.set(k,t)});
   let directory=[...uniq.values()]; directoryCache=directory;
   const q=$("#q").value.trim().toLowerCase();
   if(equipmentFilter) directory=directory.filter(t=>window.theaterFormatRows(t).some(x=>formatFamilyMatch(x.format,equipmentFilter)||formatFamilyMatch(x.screen,equipmentFilter)));
   if(q) directory=directory.filter(t=>[t.name,t.prefecture,t.municipality,t.address].filter(Boolean).join(' ').toLowerCase().includes(q));
   if(!q&&!equipmentFilter){$("#meta").textContent=directory.length+'館収録 · 名前・地域、または上映方式で探せます';$("#grid").innerHTML='<div class="empty">映画館名・住所・地域を入力するか、上映方式を選んでください。</div>';return}
   $("#meta").textContent=directory.length+'件表示'+(equipmentFilter?' · '+equipmentFilter:'');
   $("#grid").innerHTML=directory.length?directory.slice(0,100).map(t=>{const place=[t.prefecture,t.municipality,t.address].filter(Boolean).join(' ');return '<article class="card"><h3>'+esc(t.name||'名称未登録')+'</h3><div class="place">'+esc(place||'所在地未登録')+'</div>'+window.renderEquipmentSummary(t)+'<div class="btns">'+(t.website?'<a class="btn" target="_blank" rel="noopener noreferrer" href="'+esc(t.website)+'">公式</a>':'')+'<a class="btn" target="_blank" rel="noopener noreferrer" href="'+scheduleUrl(t)+'">上映スケジュール</a><a class="btn" target="_blank" rel="noopener noreferrer" href="'+mapsUrl(t)+'">地図</a></div></article>'}).join(''):'<div class="empty">条件に合う映画館がありません。</div>';
 }
 window.renderDirectory=renderEnhancedDirectory;
 document.querySelectorAll('[data-format-filter]').forEach(b=>b.addEventListener('click',()=>{
   equipmentFilter=b.dataset.formatFilter||''; selectedFormat=equipmentFilter;
   document.querySelectorAll('[data-format-filter]').forEach(x=>x.classList.toggle('active',x===b));
   const p=new URLSearchParams(location.search); if(equipmentFilter)p.set('format',equipmentFilter);else p.delete('format'); history.replaceState(null,'',location.pathname+(p.toString()?'?'+p:''));
   renderEnhancedDirectory();
 }));
 if(equipmentFilter){const b=[...document.querySelectorAll('[data-format-filter]')].find(x=>formatFamilyMatch(equipmentFilter,x.dataset.formatFilter)&&x.dataset.formatFilter);if(b){document.querySelectorAll('[data-format-filter]').forEach(x=>x.classList.toggle('active',x===b));}}
 const timer=setInterval(()=>{if((theaters.length||osmTheaters.length)&&formatData&&Array.isArray(formatData.screens)){clearInterval(timer);renderEnhancedDirectory();}},100);
 setTimeout(()=>clearInterval(timer),8000);
})();
</script>
'''

def prepare_tests():
    TEST.parent.mkdir(exist_ok=True)
    TEST.write_text(TEST_BODY, encoding='utf-8')

def apply():
    text=HTML.read_text(encoding='utf-8')
    if 'cinemap-theater-equipment-v1' not in text:
        text=text.replace('</head>', STYLE+'\n</head>', 1)
    if 'id="formatFilters"' not in text:
        anchor='<div class="search"><input id="q" placeholder="映画館名・住所・地域を入力"></div>'
        if anchor not in text: raise SystemExit('search anchor missing')
        text=text.replace(anchor, anchor+'\n'+TOOLS, 1)
    if 'cinemap-theater-equipment-js-v1' not in text:
        text=text.replace('</body>', JS+'\n</body>', 1)
    HTML.write_text(text, encoding='utf-8')

if __name__=='__main__':
    if len(sys.argv)!=2 or sys.argv[1] not in {'prepare-tests','apply'}: raise SystemExit('usage: prepare-tests|apply')
    prepare_tests() if sys.argv[1]=='prepare-tests' else apply()
