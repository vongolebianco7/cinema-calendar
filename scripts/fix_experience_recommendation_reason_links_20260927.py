from pathlib import Path

p=Path('experience.html')
s=p.read_text(encoding='utf-8')

s=s.replace(".formatScoreCta{display:inline-flex;align-items:center;gap:4px;width:max-content;max-width:100%;font-size:10px!important;font-weight:750;color:#d8d2c8!important;text-decoration:underline;text-underline-offset:3px}",".formatScoreActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}.formatReasonToggle,.formatScoreCta{appearance:none;border:0;background:none;padding:0;font:inherit;display:inline-flex;align-items:center;gap:4px;width:max-content;max-width:100%;font-size:10px!important;font-weight:750;color:#d8d2c8!important;text-decoration:underline;text-underline-offset:3px;cursor:pointer}.formatReasonBody{display:none;margin-top:5px;color:#9ba2aa!important;font-size:10px!important;line-height:1.55}.formatReasonBody.show{display:block}")

old="rows.map(([k,v],i)=>{const target=tabFor(k),more=i>0?'<span class=\"formatScoreCta\">'+tabLabel(k)+' →</span>':'';return '<div class=\"formatScore'+(i>0?' isNavigable':'')+'\"'+(i>0?' role=\"button\" tabindex=\"0\" data-go-tab=\"'+target+'\" aria-label=\"'+k+'の詳しい説明を見る\"':'')+'><b>'+k+'</b><strong>'+stars(v)+'</strong><span class=\"formatScoreMeta\"><span>'+reason(k)+'</span>'+more+'</span></div>'}).join('')"
new="rows.map(([k,v],i)=>{const target=tabFor(k),tabLink=i>0?'<button type=\"button\" class=\"formatScoreCta\" data-go-tab=\"'+target+'\">'+tabLabel(k)+' →</button>':'';return '<div class=\"formatScore\"><b>'+k+'</b><strong>'+stars(v)+'</strong><span class=\"formatScoreMeta\"><span>'+reason(k)+'</span><span class=\"formatScoreActions\"><button type=\"button\" class=\"formatReasonToggle\" aria-expanded=\"false\">理由を見る</button>'+tabLink+'</span><span class=\"formatReasonBody\">'+reason(k)+'。作品ジャンルとの相性を基準にした目安で、作品固有の上映仕様は未確認なら加点していません。</span></span></div>'}).join('')"
if old not in s:
    raise SystemExit('target renderer not found')
s=s.replace(old,new)

old_listener="out.querySelectorAll('[data-go-tab]').forEach(el=>{const go=()=>window.switchExperienceTab&&window.switchExperienceTab(el.dataset.goTab,true);el.addEventListener('click',go);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}})})"
new_listener="out.querySelectorAll('.formatReasonToggle').forEach(btn=>btn.addEventListener('click',()=>{const body=btn.closest('.formatScoreMeta')?.querySelector('.formatReasonBody');if(!body)return;const open=!body.classList.contains('show');body.classList.toggle('show',open);btn.setAttribute('aria-expanded',open?'true':'false');btn.textContent=open?'理由を閉じる':'理由を見る'}));out.querySelectorAll('[data-go-tab]').forEach(el=>el.addEventListener('click',()=>window.switchExperienceTab&&window.switchExperienceTab(el.dataset.goTab,true)))"
if old_listener not in s:
    raise SystemExit('target listener not found')
s=s.replace(old_listener,new_listener)

p.write_text(s,encoding='utf-8')
