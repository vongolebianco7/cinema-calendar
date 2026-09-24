'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key=m=>String(m.id||m.title);
const safe=u=>{try{const x=new URL(u);return x.protocol==='https:'?x.href:''}catch{return ''}};
function read(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}}
let state=read('cinema-night-shelf',{});if(!state||Array.isArray(state)||typeof state!=='object')state={};
let movies=[],availability={},plans=[],offset=0,loaded=false;
function save(){try{localStorage.setItem('cinema-night-shelf',JSON.stringify(state))}catch{$('#status').textContent='このブラウザでは保存できません。ページを閉じるまで保持します。'}}
function providers(m){const a=availability[key(m)];return Array.isArray(a?.flatrate)?a.flatrate:[]}
function profile(){const r=read('cinema-now-dna-ratings',[]),g=new Map();if(!Array.isArray(r))return g;for(const x of r){if(x.r<4)continue;const m=movies.find(m=>x.id?String(x.id)===String(m.id):x.title===m.title);for(const z of m?.genres||[])g.set(z,(g.get(z)||0)+1)}return g}
function connection(a,b){
 if(a.director&&a.director===b.director)return a.director+'監督を2本で辿る';
 const cast=(a.cast||[]).filter(x=>(b.cast||[]).includes(x));if(cast.length)return cast[0]+'の出演作を2本で辿る';
 const shared=(a.genres||[]).filter(g=>(b.genres||[]).includes(g));return shared.length?shared.slice(0,2).join(' × ')+'でつながる2本':'';
}
function scoreMovie(m,p,direction){
 const gs=m.genres||[],common=gs.filter(g=>p.has(g)).length,novel=gs.filter(g=>!p.has(g)).length;
 let s=Number(m.score||0)*Math.min(1,Number(m.votes||0)/100);
 if(state[key(m)]?.status==='saved')s+=2;
 if(p.size&&direction==='familiar')s+=common*2;
 if(p.size&&direction==='explore')s+=(common?2:0)+novel*2-common;
 return s;
}
function generate(){
 if(!loaded)return;
 plans=[];offset=0;
 const services=[...document.querySelectorAll('#services input:checked')].map(x=>x.value),p=profile(),direction=$('#direction').value;
 $('#dnaInfo').textContent=p.size?'映画DNAで高く評価したジャンルも使って候補を並べます。':'映画DNAを診断すると、好みを候補選びに反映できます。';
 const rated=read('cinema-now-dna-ratings',[]),seen=new Set(Array.isArray(rated)?rated.map(x=>String(x.id||x.title)):[]);
 const pool=movies.filter(m=>state[key(m)]?.status!=='watched'&&!seen.has(key(m))&&(!$('#only').checked||providers(m).some(s=>services.includes(s))));
 pool.sort((a,b)=>scoreMovie(b,p,direction)-scoreMovie(a,p,direction));
 if($('#format').value==='two'){
  for(let i=0;i<Math.min(pool.length,90);i++)for(let j=i+1;j<Math.min(pool.length,90);j++){
   const a=pool[i],b=pool[j],why=connection(a,b);if(!why)continue;
   const duration=(Number(a.runtime)||0)+(Number(b.runtime)||0);
   plans.push({items:[a,b],duration,why,score:scoreMovie(a,p,direction)+scoreMovie(b,p,direction)+(a.director&&a.director===b.director?4:0)})
  }
 }else{
  plans=pool.map(m=>({items:[m],duration:Number(m.runtime)||0,why:direction==='explore'&&p.size?'好みとの共通点を残しつつ、少し外側へ。':direction==='familiar'&&p.size?'映画DNAで高評価だった傾向から。':'評価件数を加味したTMDB評価から。',score:scoreMovie(m,p,direction)}))
 }
 plans.sort((a,b)=>b.score-a.score);
 const used=new Set(),first=[],rest=[];for(const p0 of plans){if(p0.items.every(m=>!used.has(key(m)))){first.push(p0);p0.items.forEach(m=>used.add(key(m)))}else rest.push(p0)}plans=[...first,...rest];
 $('#status').textContent=pool.length+'作品から '+plans.length+'候補';
 render();
}
function actions(m){const k=esc(key(m)),s=state[key(m)]?.status;return '<div class="actions"><button data-save="'+k+'" aria-pressed="'+(s==='saved')+'">'+(s==='saved'?'保存を解除':'＋ あとで観る')+'</button><button data-watch="'+k+'">'+(s==='watched'?'未鑑賞に戻す':'鑑賞済みにする')+'</button><a target="_blank" rel="noopener noreferrer" href="https://filmarks.com/search/movies?q='+encodeURIComponent(m.title)+'">Filmarksで探す</a></div>'}
function movieHtml(m){const ps=providers(m),a=availability[key(m)],source=safe(a?.source_url)||('https://www.themoviedb.org/movie/'+encodeURIComponent(m.id)+'/watch?locale=JP');return '<article class="movie">'+(safe(m.poster)?'<img class="poster" src="'+esc(safe(m.poster))+'" alt="" loading="lazy">':'<div class="poster"></div>')+'<div><div class="meta">'+(m.runtime?m.runtime+'分 · ':'')+esc((m.genres||[]).join(' / '))+'</div><h3>'+esc(m.title)+'</h3><div class="meta">TMDB '+(m.score?'★'+Number(m.score).toFixed(1):'評価なし')+'（'+Number(m.votes||0).toLocaleString()+'件）</div><div class="meta">'+(ps.length?'見放題：'+esc(ps.join(' / ')):'見放題の確認情報なし')+'</div>'+(m.id?'<a target="_blank" rel="noopener noreferrer" href="'+esc(source)+'">配信先を確認</a>':'')+actions(m)+'</div></article>'}
function render(){
 const rows=plans.slice(offset,offset+3);$('#shuffle').hidden=plans.length<=3;
 $('#results').innerHTML=rows.length?rows.map((p,i)=>'<article class="program"><div class="programTop"><b>PROGRAM '+String(offset+i+1).padStart(2,'0')+'</b><span>'+(p.duration?p.duration+'分':'')+'</span></div><div class="bridge">'+esc(p.why)+'</div>'+p.items.map(movieHtml).join('')+'<div class="actions"><button data-share="'+(offset+i)+'">プログラムを共有</button></div></article>').join(''):'<div class="empty">条件に合う候補がありません。見放題の絞り込みを変更してください。</div>';
 renderShelf();
}
function renderShelf(){const s=$('#shelfMode').value,rows=Object.values(state).filter(x=>x?.status===s&&x.movie);$('#shelf').innerHTML=rows.length?rows.map(x=>'<div class="shelfRow"><b>'+esc(x.movie.title)+'</b>'+actions(x.movie)+'</div>').join(''):'<p class="note">'+(s==='saved'?'気になる作品の「あとで観る」で、ここに保存できます。':'鑑賞済みにした作品がここに残ります。')+'</p>'}
async function share(p){const text=p.items.map(m=>m.title+(m.runtime?'（'+m.runtime+'分）':'')).join(' → ')+'\n'+p.why+'\n'+location.href.split('#')[0];try{if(navigator.share){await navigator.share({title:'鑑賞プラン',text});return}await navigator.clipboard.writeText(text);$('#status').textContent='プログラムをコピーしました。'}catch(e){if(e.name!=='AbortError')prompt('このプログラムをコピーしてください',text)}}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.share!==undefined)return share(plans[+b.dataset.share]);const k=b.dataset.save||b.dataset.watch;if(!k)return;const m=movies.find(m=>key(m)===k)||state[k]?.movie;if(!m)return;if(b.dataset.save){if(state[k]?.status==='saved')delete state[k];else state[k]={status:'saved',movie:m}}else state[k]={status:state[k]?.status==='watched'?'saved':'watched',movie:m};save();generate();});
$('#settings').addEventListener('submit',e=>{e.preventDefault();generate()});
$('#settings').addEventListener('change',()=>{if(loaded)generate()});
$('#shuffle').onclick=()=>{offset=offset+3>=plans.length?0:offset+3;render()};
$('#shelfMode').onchange=renderShelf;
async function boot(){try{const [mr,ar]=await Promise.all([fetch('data/movies.json'),fetch('data/availability.json').catch(()=>null)]);if(!mr.ok)throw Error();const data=await mr.json(),seen=new Set();movies=(data.movies||[]).filter(m=>{const k=key(m);if(seen.has(k)||!m.title||m.event==='festival')return false;seen.add(k);return true});let warning='';if(ar?.ok){availability=(await ar.json()).movies||{}}else warning='配信情報を取得できません。見放題の絞り込みを外すと候補を表示できます。';const names=[...new Set(['Netflix','Prime Video','Disney+','U-NEXT','Hulu',...Object.values(availability).flatMap(a=>a.flatrate||[])])].sort();$('#services').innerHTML=names.map(s=>'<label><input type="checkbox" value="'+esc(s)+'"> '+esc(s)+'</label>').join('');loaded=true;$('#make').disabled=false;$('#results').innerHTML='<div class="empty">条件を選んで「プログラムをつくる」を押してください。</div>';$('#status').textContent=warning||movies.length+'作品から選べます。';renderShelf();}catch{$('#status').innerHTML='作品を読み込めませんでした。<a href="night.html">再読み込み</a>';renderShelf()}}
boot();
