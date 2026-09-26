from pathlib import Path

p=Path('critic.html')
s=p.read_text(encoding='utf-8')

css_anchor='.criticMapEmpty.show{display:block}\n'
css_add='''.criticMapEmpty.show{display:block}
.criticJourney{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:12px 0 2px}.criticJourneyStep{border:1px solid #2c2c2c;border-radius:10px;padding:9px;background:#101010;min-width:0}.criticJourneyStep strong{display:block;font-size:8px;color:#6f6f6f;letter-spacing:.07em}.criticJourneyStep span{display:block;margin-top:4px;font-size:10px;line-height:1.45;color:#b8b8b8}.criticJourneyStep.active{border-color:#777;background:#181818}.criticJourneyStep.active strong,.criticJourneyStep.active span{color:#eee}.topicContext{margin-top:9px;padding:9px 10px;border-left:2px solid #555;background:#0d0d0d;font-size:10px;color:#aaa;line-height:1.6}.topicContext b{color:#ddd}.criticNext{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:12px}.criticNext a{display:block;border:1px solid #303030;border-radius:9px;padding:9px 10px;text-decoration:none;background:#121212}.criticNext a b{display:block;font-size:10px}.criticNext a span{display:block;font-size:8px;color:#777;margin-top:4px;line-height:1.4}@media(max-width:560px){.criticJourney{grid-template-columns:1fr}.criticNext{grid-template-columns:1fr}}
'''
if css_anchor not in s:
    raise SystemExit('css anchor missing')
s=s.replace(css_anchor,css_add,1)

helper_anchor='''function topicMapHtml(ts){\n'''
helper='''function topicContextHtml(m,x){
 const parts=[];
 if(m.director)parts.push('監督：'+m.director);
 if(m.year)parts.push(String(m.year)+'年');
 if((m.genres||[]).length)parts.push((m.genres||[]).slice(0,3).join(' / '));
 const base=parts.join(' · ');
 return '<div class="topicContext"><b>'+E(m.title)+'</b>を'+E(lensLabel(lensValue(x)))+'から読む。'+(base?' <span>'+E(base)+'</span>':'')+'</div>';
}
function criticJourneyHtml(){
 return '<div class="criticJourney"><div class="criticJourneyStep active" data-journey="topic"><strong>01 · 論点</strong><span>作品固有の問いを選ぶ</span></div><div class="criticJourneyStep" data-journey="human"><strong>02 · 人間の批評</strong><span>実際に誰がどう語るか</span></div><div class="criticJourneyStep" data-journey="deeper"><strong>03 · 次の映画へ</strong><span>作り手・比較作品へつなぐ</span></div></div>';
}
function setJourney(stage){
 const order={topic:0,human:1,deeper:2},n=order[stage]??0;
 document.querySelectorAll('[data-journey]').forEach((el,i)=>el.classList.toggle('active',i<=n));
}
function nextLinksHtml(m,x,dna,related){
 const links=[];
 const roleMap={IMAGE:['撮影',dna.cinematography],STORY:['脚本',dna.writers],PERFORMANCE:['出演',dna.cast],SOUND:['音楽',dna.music],AUTHOR:['監督',dna.directors],HISTORY:['監督',dna.directors],THEME:['脚本',dna.writers]};
 const hit=roleMap[lensBase(x.kind)],people=hit&&Array.isArray(hit[1])?hit[1].filter(Boolean):[];
 if(people.length){const person=people[0];links.push('<a href="discover.html?person='+encodeURIComponent(person.id)+'&role='+encodeURIComponent(hit[0])+'&name='+encodeURIComponent(person.name)+'&fromId='+encodeURIComponent(m.tmdbId||m.id||'')+'&from='+encodeURIComponent(m.title||'')+'"><b>'+E(hit[0]+'：'+person.name)+'</b><span>この論点を作り手の他作品へ広げる</span></a>')}
 if(related&&related.length){const r=related[0];links.push('<a href="critic.html?id='+encodeURIComponent(r.tmdbId||r.id||'')+'&search='+encodeURIComponent(r.title||'')+'&lens='+encodeURIComponent(lensValue(x))+'&from='+encodeURIComponent(m.title||'')+'&fromId='+encodeURIComponent(m.tmdbId||m.id||'')+'"><b>'+E(r.title)+'</b><span>同じ視点を別作品で比較する</span></a>')}
 return links.length?'<div class="criticNext">'+links.join('')+'</div>':'';
}
'''
if helper_anchor not in s:
    raise SystemExit('helper anchor missing')
s=s.replace(helper_anchor,helper+helper_anchor,1)

old="""<div class=\"lead\">気になる論点を選ぶと、その論点を実際に語る人間の批評へ進めます。</div>'+topicMapHtml(ts)+'<div class=\"panel\" id=\"panel\"></div>"""
new="""<div class=\"lead\">気になる論点を選ぶと、その論点を実際に語る人間の批評へ進めます。</div>'+criticJourneyHtml()+topicMapHtml(ts)+'<div class=\"panel\" id=\"panel\"></div>"""
if old not in s:
    raise SystemExit('journey insert anchor missing')
s=s.replace(old,new,1)

panel_old="""panel.innerHTML='<div class=\"question\">'+E(x.q)+'</div>'+creatorFocusHtml(x.kind,dna)+'<div class=\"shareRow\">"""
if panel_old not in s:
    raise SystemExit('panel anchor missing')
s=s.replace(panel_old,"""setJourney('topic');panel.innerHTML='<div class=\"question\">'+E(x.q)+'</div>'+topicContextHtml(m,x)+creatorFocusHtml(x.kind,dna)+'<div class=\"shareRow\">""",1)

load_old='''if(load)load.onclick=()=>loadVideos(panel,m,x);const share=panel.querySelector("[data-share]");'''
load_new='''if(load)load.onclick=()=>{setJourney('human');loadVideos(panel,m,x)};const share=panel.querySelector("[data-share]");'''
if load_old not in s:
    raise SystemExit('load anchor missing')
s=s.replace(load_old,load_new,1)

accept_old='''if(n)n.onclick=()=>loadVideos(panel,m,x);loadVideos(panel,m,x)};'''
accept_new='''if(n)n.onclick=()=>{setJourney('human');loadVideos(panel,m,x)};setJourney('human');loadVideos(panel,m,x)};'''
if accept_old not in s:
    raise SystemExit('accept anchor missing')
s=s.replace(accept_old,accept_new,1)

guide_old="""<details class=\"guide\"><summary>Cinemapの補助視点を見る</summary><div class=\"guideGrid\"><div class=\"guideCell\"><strong>別の読み</strong>'+E(x.counter)+'</div><div class=\"guideCell\"><strong>見直すポイント</strong>'+E(x.inspect)+'</div></div></details>'"""
guide_new="""<details class=\"guide\"><summary>Cinemapの補助視点を見る</summary><div class=\"guideGrid\"><div class=\"guideCell\"><strong>別の読み</strong>'+E(x.counter)+'</div><div class=\"guideCell\"><strong>見直すポイント</strong>'+E(x.inspect)+'</div></div></details>'+nextLinksHtml(m,x,dna,related)"""
if guide_old not in s:
    raise SystemExit('guide anchor missing')
s=s.replace(guide_old,guide_new,1)

s=s.replace('Cinemap Critic Map v3.5','Cinemap Critic Map v3.6',1)
p.write_text(s,encoding='utf-8')
print('Applied deeper Critic Map journey')
# workflow trigger
