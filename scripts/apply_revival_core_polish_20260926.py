from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def rw(path,fn):
 p=ROOT/path;s=p.read_text(encoding='utf-8');n=fn(s);p.write_text(n,encoding='utf-8')

def patch_index(s):
 # Load manually verified revival screenings beside Morning Ten data.
 old='fetch("data/special_screenings.json?"+Date.now()).catch(()=>null)]);let md=await mr.json();'
 new='fetch("data/special_screenings.json?"+Date.now()).catch(()=>null),fetch("data/revival_screenings.json?"+Date.now()).catch(()=>null)]);let md=await mr.json();'
 if old in s:
  s=s.replace('let [mr,tr,dr,fr,er,sr,hr,ar,lr,tdr,spr]=await Promise.all([','let [mr,tr,dr,fr,er,sr,hr,ar,lr,tdr,spr,rr]=await Promise.all([',1).replace(old,new,1)
 # Add verified revival rows after Morning Ten rows.
 needle='if(spr&&spr.ok){let sp=await spr.json();for(const x of(sp.screenings||[]))movies.push({...x,revival:false})}'
 if needle in s and 'if(rr&&rr.ok)' not in s:
  s=s.replace(needle,needle+'if(rr&&rr.ok){let rv=await rr.json();for(const x of(rv.screenings||[]))movies.push({...x,revival:true,service:"リバイバル上映"})}',1)
 # Hydrate posters for both Morning Ten and revival rows; respect year hints in Morning Ten labels.
 s=s.replace('function morningTenQuery(title){return String(title||"").replace(/（\\d{4}年版）/g,"").replace(/【[^】]+】/g,"").trim()}',
'''function morningTenQuery(title){return String(title||"").replace(/（\\d{4}年版）/g,"").replace(/【[^】]+】/g,"").trim()}\nfunction titleYearHint(title){const m=String(title||"").match(/（(\\d{4})年版）/);return m?m[1]:""}''')
 s=s.replace('const rows=movies.filter(m=>m.special_screening==="asa10"&&(!m.poster||!m.id));','const rows=movies.filter(m=>(m.special_screening==="asa10"||m.service==="リバイバル上映")&&(!m.poster||!m.id));')
 s=s.replace('const m=rows[cursor++],q=morningTenQuery(m.title),key=revivalNorm(q);let hit=movies.find(x=>x!==m&&x.poster&&revivalNorm(x.title)===key);',
'const m=rows[cursor++],q=morningTenQuery(m.title),key=revivalNorm(q),yearHint=titleYearHint(m.title);let hit=movies.find(x=>x!==m&&x.poster&&revivalNorm(x.title)===key&&(!yearHint||String(x.year||x.date||"").startsWith(yearHint)));')
 s=s.replace('hit=a.find(x=>revivalNorm(x.title)===key||revivalNorm(x.original_title)===key)||a[0]',
'hit=a.find(x=>(revivalNorm(x.title)===key||revivalNorm(x.original_title)===key)&&(!yearHint||String(x.year||x.date||"").startsWith(yearHint)))||a.find(x=>revivalNorm(x.title)===key||revivalNorm(x.original_title)===key)||a[0]')
 return s

def patch_critic(s):
 # Secondary creator/related exploration becomes optional instead of permanently consuming the page.
 s=s.replace('<section class="deep"><h2>さらに深掘る</h2>', '<details class="deep"><summary>作り手・関連作品へ広げる</summary>',1)
 # Change the corresponding first deep closing tag only where followed by body close.
 s=s.replace("+'</section></div>';\n if(incomingLens&&fromId)", "+'</details></div>';\n if(incomingLens&&fromId)",1)
 css='''\n.deep>summary{cursor:pointer;font-size:13px;font-weight:800;color:#ccc;padding:8px 0;list-style:none}.deep>summary:after{content:" ＋";color:#777}.deep[open]>summary:after{content:" −"}.deep[open]>summary{margin-bottom:10px}\n'''
 if '.deep>summary{' not in s:s=s.replace('</style>',css+'</style>',1)
 return s

rw('index.html',patch_index)
rw('critic.html',patch_critic)
print('revival/core polish complete')
