from pathlib import Path

p=Path('experience.html')
s=p.read_text(encoding='utf-8')

old_css=""".formatResult{margin-top:14px}.formatScore{display:grid;grid-template-columns:118px 84px 1fr;gap:10px;align-items:center;padding:10px 0;border-top:1px solid #24282e}.formatScore:first-child{border-top:0}.formatScore b{font-size:13px}.formatScore strong{letter-spacing:.08em;color:#e8c56b;font-size:13px}.formatScore span{font-size:11px;color:#9ba2aa;line-height:1.45}.decisionNote{font-size:10px;color:#777;margin-top:10px;line-height:1.55}"""
new_css=""".formatResult{margin-top:14px}.formatScore{display:grid;grid-template-columns:118px 84px 1fr;gap:10px;align-items:center;padding:10px 0;border-top:1px solid #24282e}.formatScore:first-child{border-top:0}.formatScore b{font-size:13px}.formatScore strong{letter-spacing:.08em;color:#e8c56b;font-size:13px}.formatScore span{font-size:11px;color:#9ba2aa;line-height:1.45}.formatScore.isNavigable{position:relative;cursor:pointer;padding-right:22px}.formatScore.isNavigable:after{content:'›';position:absolute;right:2px;top:50%;transform:translateY(-50%);font-size:19px;color:#d8d2c8}.formatScore.isNavigable:active{background:#ffffff08}.formatScoreMeta{display:flex;flex-direction:column;gap:4px;min-width:0}.formatScoreCta{display:inline-flex;align-items:center;gap:4px;width:max-content;max-width:100%;font-size:10px!important;font-weight:750;color:#d8d2c8!important;text-decoration:underline;text-underline-offset:3px}.decisionNote{font-size:10px;color:#777;margin-top:10px;line-height:1.55}"""
if old_css not in s:
    raise SystemExit('CSS anchor not found')
s=s.replace(old_css,new_css,1)

old_js="""function reason(k){return k==='IMAX'?'大画面・スケール感との相性':k==='Dolby Cinema'?'黒・コントラストと立体音響':k==='4DX / MX4D'?'動きのある場面を身体で楽しむ':k==='ScreenX'?'左右まで広がる視界を楽しむ':'追加演出なしで作品に集中'}async function run(){const q=input.value.trim();if(!q)return;btn.disabled=true;out.innerHTML='<div class=\"decisionNote\">作品情報を確認中…</div>';try{const r=await fetch('https://backend-one-gray-94.vercel.app/api/movies?q='+encodeURIComponent(q)+'&limit=5',{cache:'no-store'}),d=await r.json(),m=[...(d.movies||[]),...(d.external||[])][0];if(!m)throw 0;const scores=scoreMovie(m),rows=Object.entries(scores).sort((a,b)=>b[1]-a[1]);out.innerHTML='<div class=\"decisionNote\"><b>'+(m.title||q)+'</b>の作品傾向からの目安</div>'+rows.map(([k,v])=>'<div class=\"formatScore\"><b>'+k+'</b><strong>'+stars(v)+'</strong><span>'+reason(k)+'</span></div>').join('')+'<div class=\"decisionNote\">※ジャンル等からの目安です。作品固有の上映仕様・上映有無は劇場公式情報を確認してください。</div>'}"""
new_js="""function reason(k){return k==='IMAX'?'大画面・スケール感との相性':k==='Dolby Cinema'?'黒・コントラストと立体音響':k==='4DX / MX4D'?'動きのある場面を身体で楽しむ':k==='ScreenX'?'左右まで広がる視界を楽しむ':'追加演出なしで作品に集中'}function tabFor(k){return k==='IMAX'?'aspect':k==='Dolby Cinema'?'visual':k==='4DX / MX4D'||k==='ScreenX'?'special':'visual'}function tabLabel(k){return k==='IMAX'?'画角を詳しく見る':k==='Dolby Cinema'?'映像を詳しく見る':k==='4DX / MX4D'||k==='ScreenX'?'体感を詳しく見る':'映像を詳しく見る'}async function run(){const q=input.value.trim();if(!q)return;btn.disabled=true;out.innerHTML='<div class=\"decisionNote\">作品情報を確認中…</div>';try{const r=await fetch('https://backend-one-gray-94.vercel.app/api/movies?q='+encodeURIComponent(q)+'&limit=5',{cache:'no-store'}),d=await r.json(),m=[...(d.movies||[]),...(d.external||[])][0];if(!m)throw 0;const scores=scoreMovie(m),rows=Object.entries(scores).sort((a,b)=>b[1]-a[1]);out.innerHTML='<div class=\"decisionNote\"><b>'+(m.title||q)+'</b>の作品傾向からの目安</div>'+rows.map(([k,v],i)=>{const target=tabFor(k),more=i>0?'<span class=\"formatScoreCta\">'+tabLabel(k)+' →</span>':'';return '<div class=\"formatScore'+(i>0?' isNavigable':'')+'\"'+(i>0?' role=\"button\" tabindex=\"0\" data-go-tab=\"'+target+'\" aria-label=\"'+k+'の詳しい説明を見る\"':'')+'><b>'+k+'</b><strong>'+stars(v)+'</strong><span class=\"formatScoreMeta\"><span>'+reason(k)+'</span>'+more+'</span></div>'}).join('')+'<div class=\"decisionNote\">※ジャンル等からの目安です。作品固有の上映仕様・上映有無は劇場公式情報を確認してください。</div>';out.querySelectorAll('[data-go-tab]').forEach(el=>{const go=()=>window.switchExperienceTab&&window.switchExperienceTab(el.dataset.goTab,true);el.addEventListener('click',go);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}})})}"""
if old_js not in s:
    raise SystemExit('decision JS anchor not found')
s=s.replace(old_js,new_js,1)

old_tabs=""" tabs.forEach(tab=>tab.addEventListener('click',()=>show(tab.dataset.expTab)));
 show('recommend');"""
new_tabs=""" window.switchExperienceTab=(key,scroll)=>{show(key);if(scroll){const nav=document.querySelector('.expTabs');if(nav)nav.scrollIntoView({behavior:'smooth',block:'start'})}};
 tabs.forEach(tab=>tab.addEventListener('click',()=>window.switchExperienceTab(tab.dataset.expTab,false)));
 show('recommend');"""
if old_tabs not in s:
    raise SystemExit('tabs JS anchor not found')
s=s.replace(old_tabs,new_tabs,1)

p.write_text(s,encoding='utf-8')
