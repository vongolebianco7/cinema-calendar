from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parents[1]

def read(p): return (ROOT/p).read_text(encoding='utf-8')
def write(p,s): (ROOT/p).write_text(s,encoding='utf-8')
def rep(s,a,b,label):
    if a in s: return s.replace(a,b,1)
    print('skip',label)
    return s

# ---------- Calendar ----------
p='index.html'; s=read(p)
# Strongly guarantee 3-column TV cards on phones and compact cards.
css='''\n/* 2026-09-26 calendar UX fixes */
.tvWeekMovies{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:7px!important}
.tvMovie{min-width:0!important}
@media(max-width:760px){.tvWeekMovies{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:5px!important}.tvMovie{display:block!important;padding:5px!important}.tvMoviePoster{width:100%!important}.tvMovieProgram{font-size:9px!important;line-height:1.25}.tvMovieTitle{font-size:8px!important;line-height:1.25}}
.festivalSpan.cont{font-weight:850;opacity:.96}
'''
if '2026-09-26 calendar UX fixes' not in s: s=s.replace('</style>',css+'</style>',1)
# Ensure theatrical chips exist just like subscription filters.
s=s.replace('mode==="theatrical"?["すべて"]','mode==="theatrical"?["すべて","通常","リバイバル","午前十時"]')
# Make continuation segments begin with the festival title so ellipsis never hides the identity.
s=s.replace("(firstSeg?ev.title:'継続｜'+ev.title)","(firstSeg?ev.title:ev.title+'（継続）')")
# Special screenings span all active weeks, not start week only.
s=s.replace('if(!m.date)return false;let d=new Date(m.date+"T00:00:00");return d>=ws&&d<=we',
'''if(!m.date)return false;let d=new Date(m.date+"T00:00:00"),z=new Date((m.end_date||m.date)+"T00:00:00");return d<=we&&z>=ws''')
# Add data-grounded revival classification + poster hydration for Morning Ten.
helpers='''
function revivalNorm(s){return String(s||"").toLowerCase().normalize("NFKC").replace(/[\\s　・･:：!！?？「」『』【】\\[\\]()（）\\-―ー]/g,"")}
function applyRevivalClassification(){
 const hist=(releaseHistory.records||[]).filter(r=>r.kind==="theatrical"&&r.date),DAY=86400000;
 for(const m of movies){
  if(m.special_screening==="asa10"||m.event!=="theatrical"||!m.date)continue;
  const cur=new Date(m.date+"T00:00:00"),key=revivalNorm(m.title),id=String(m.id||m.tmdbId||"");
  const old=hist.some(r=>{if(!r.date)return false;const rd=new Date(r.date+"T00:00:00");if((cur-rd)<180*DAY)return false;return (id&&String(r.id||r.tmdbId||"")===id)||(key&&revivalNorm(r.title)===key)});
  if(old){m.service="リバイバル上映";m.revival=true}
 }
}
function morningTenQuery(title){return String(title||"").replace(/（\\d{4}年版）/g,"").replace(/【[^】]+】/g,"").trim()}
async function hydrateMorningTenPosters(){
 const rows=movies.filter(m=>m.special_screening==="asa10"&&(!m.poster||!m.id));
 let cursor=0;
 async function worker(){while(cursor<rows.length){const m=rows[cursor++],q=morningTenQuery(m.title),key=revivalNorm(q);let hit=movies.find(x=>x!==m&&x.poster&&revivalNorm(x.title)===key);
   if(!hit)try{const r=await fetch("https://backend-one-gray-94.vercel.app/api/movies?q="+encodeURIComponent(q)+"&limit=5",{cache:"no-store"});if(r.ok){const d=await r.json(),a=[...(d.movies||[]),...(d.external||[])];hit=a.find(x=>revivalNorm(x.title)===key||revivalNorm(x.original_title)===key)||a[0]}}catch{}
   if(hit){m.poster=hit.poster||hit.posterUrl||m.poster;m.id=hit.tmdbId||hit.id||m.id;m.tmdbId=hit.tmdbId||hit.id||m.tmdbId;m.score=hit.score??m.score;m.votes=hit.votes??m.votes}
 }}
 await Promise.all([worker(),worker(),worker()])
}
'''
if 'function applyRevivalClassification()' not in s:
    s=s.replace('async function boot(){',helpers+'\nasync function boot(){',1)
needle='if(dr&&dr.ok){let dd=await dr.json();directors=dd.directors||{}}render();'
if needle in s:
    s=s.replace(needle,'if(dr&&dr.ok){let dd=await dr.json();directors=dd.directors||{}}applyRevivalClassification();await hydrateMorningTenPosters();render();',1)
s=s.replace('Cinemap v0.4.71','Cinemap v0.4.72')
write(p,s)

# ---------- Discover: 3-column results + separate theater/streaming recommendation shelves ----------
p='discover.html'; s=read(p)
css='''\n/* split recommendation shelves + 3-column condition results */
#grid.grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px}
@media(max-width:650px){#grid.grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px}#grid .body{padding:6px}#grid .title{font-size:10px}#grid .meta{font-size:8px}}
.recommendShelfBlock{margin:10px 0 16px}.recommendShelfBlock .presetShelfHead{margin-bottom:7px}
'''
if 'split recommendation shelves + 3-column condition results' not in s: s=s.replace('</style>',css+'</style>',1)
# Replace one shelf with two if not already split.
old='<section class="presetShelf"><div class="presetShelfHead"><h2 id="presetHeading">いま人気</h2><div class="status" id="presetStatus"></div></div><div class="presetShelfGrid" id="presetGrid"></div></section>'
new='''<section class="recommendShelfBlock"><div class="presetShelfHead"><h2 id="presetHeading">劇場で人気</h2><div class="status" id="presetStatus"></div></div><div class="presetShelfGrid" id="presetGrid"></div></section><section class="recommendShelfBlock"><div class="presetShelfHead"><h2 id="streamingPresetHeading">配信で人気</h2><div class="status" id="streamingPresetStatus"></div></div><div class="presetShelfGrid" id="streamingPresetGrid"></div></section>'''
if old in s: s=s.replace(old,new,1)
# Replace preset rendering/loading with two contextual shelves, while preserving chips as criterion controls.
start=s.find('function renderPreset(){')
end=s.find('async function load(reset=true)',start)
if start>=0 and end>start and 'function loadRecommendationShelves()' not in s:
    block='''function recommendationCard(m){return '<button class="presetCard" data-rec-id="'+E(m.tmdbId||m.id)+'" data-rec-title="'+E(m.title||'')+'"><div class="presetCardPoster">'+(m.poster?'<img loading="lazy" src="'+E(m.poster)+'">':'')+'</div><div class="presetCardBody"><div class="presetCardTitle">'+E(m.title)+'</div><div class="presetCardMeta">'+E(m.year||String(m.date||'').slice(0,4))+' · ★ '+Number(m.score||0).toFixed(1)+'</div></div></button>'}
function recSort(list){let a=[...list];if(preset==="rated")a=a.filter(m=>Number(m.score)>=7.5).sort((x,y)=>Number(y.score)-Number(x.score)||Number(y.votes)-Number(x.votes));else if(preset==="short")a=a.filter(m=>Number(m.runtime)>0&&Number(m.runtime)<=100).sort((x,y)=>Number(y.votes)-Number(x.votes));else if(preset==="new")a=a.sort((x,y)=>String(y.date||'').localeCompare(String(x.date||''))||Number(y.votes)-Number(x.votes));else if(preset==="classic")a=a.filter(m=>Number(String(m.date||'').slice(0,4))<=1999).sort((x,y)=>Number(y.score)-Number(x.score)||Number(y.votes)-Number(x.votes));else a=a.sort((x,y)=>Number(y.votes)-Number(x.votes)||Number(y.score)-Number(x.score));return a}
function dedupeRecommendations(list){const seen=new Set();return list.filter(m=>{const k=String(m.id||m.tmdbId||m.title);if(seen.has(k))return false;seen.add(k);return true})}
function renderRecommendationShelf(id,list){const box=$("#"+id);if(!box)return;box.innerHTML=list.slice(0,14).map(recommendationCard).join("")||'<div class="empty">該当作品がありません。</div>';box.querySelectorAll('[data-rec-id]').forEach(b=>b.onclick=()=>location.href='search.html?'+new URLSearchParams({id:b.dataset.recId,search:b.dataset.recTitle}).toString())}
async function loadRecommendationShelves(){
 const label={popular:"人気",rated:"高評価",short:"100分以内",classic:"名作",new:"新しい作品"}[preset]||"人気";$("#presetHeading").textContent="劇場で"+label;$("#streamingPresetHeading").textContent="配信で"+label;$("#presetStatus").textContent=$("#streamingPresetStatus").textContent="読み込み中…";
 try{const r=await fetch(API+"/api/calendar",{cache:"no-store"});if(!r.ok)throw 0;const d=await r.json(),rows=d.movies||[];const theater=recSort(dedupeRecommendations(rows.filter(m=>m.event==="theatrical"||m.service==="劇場公開"))),stream=recSort(dedupeRecommendations(rows.filter(m=>m.event==="streaming")));renderRecommendationShelf("presetGrid",theater);renderRecommendationShelf("streamingPresetGrid",stream);$("#presetStatus").textContent=theater.length+"作品から";$("#streamingPresetStatus").textContent=stream.length+"作品から"}catch{$("#presetStatus").textContent=$("#streamingPresetStatus").textContent="取得できませんでした"}
}
'''
    s=s[:start]+block+s[end:]
# Wire chips to contextual shelves and init.
s=s.replace('loadPreset()});','loadRecommendationShelves()});')
s=s.replace('loadPreset();if(person){','loadRecommendationShelves();if(person){')
s=s.replace('loadPreset();load(true);','loadRecommendationShelves();')
s=s.replace('Cinemap v1.5.3','Cinemap v1.5.4')
write(p,s)

# ---------- Rankings ----------
p='rankings.html'; s=read(p)
css='''\n/* ranking density fixes */
.rankGrid{align-items:start}.rankCard{align-self:start;height:auto}.rankCard [hidden],.rankCard img[hidden],.rankPosterPlaceholder[hidden]{display:none!important}.rankCard>div[data-box-film]{display:flex;flex-direction:column}.rankCard .body{min-height:0!important}
'''
if 'ranking density fixes' not in s:s=s.replace('</style>',css+'</style>',1)
# Add Asia virtual region.
s=s.replace('function allRegions(){return ["すべて",...Object.keys(rankings||{})]}','function allRegions(){return ["すべて",...Object.keys(rankings||{}),"アジア"]}')
s=s.replace('function baseRegions(){return regionActive==="すべて"?Object.keys(rankings||{}):[regionActive]}','function baseRegions(){return regionActive==="アジア"?[]:regionActive==="すべて"?Object.keys(rankings||{}):[regionActive]}')
asia='''
const ASIA_GENRES={"すべて":"","ドラマ":"18","コメディ":"35","アクション":"28","SF":"878","スリラー":"53","ホラー":"27","恋愛":"10749","アニメ":"16","犯罪":"80","ドキュメンタリー":"99","ファンタジー":"14"};
async function renderAsiaRating(){
 const regionOpts=allRegions();$("#regionChips").innerHTML=regionOpts.map(x=>'<button class="chip '+(x===regionActive?'active':'')+'" data-region="'+x+'">'+x+'</button>').join("");const genreOpts=Object.keys(ASIA_GENRES);if(!genreOpts.includes(genreActive))genreActive="すべて";$("#genreChips").innerHTML=genreOpts.map(x=>'<button class="chip '+(x===genreActive?'active':'')+'" data-genre="'+x+'">'+x+'</button>').join("");const eraOpts=["すべて","今年","2020年代","2010年代","2000年代","1990年代","1980年代"];if(!eraOpts.includes(eraActive))eraActive="すべて";$("#eraChips").innerHTML=eraOpts.map(x=>'<button class="chip '+(x===eraActive?'active':'')+'" data-era="'+x+'">'+x+'</button>').join("");document.querySelectorAll('[data-region]').forEach(b=>b.onclick=()=>{regionActive=b.dataset.region;genreActive="すべて";eraActive="すべて";render()});document.querySelectorAll('[data-genre]').forEach(b=>b.onclick=()=>{genreActive=b.dataset.genre;render()});document.querySelectorAll('[data-era]').forEach(b=>b.onclick=()=>{eraActive=b.dataset.era;render()});let p=new URLSearchParams({country:"KR|CN|HK|TW|IN|TH|PH|ID|MY|SG",sort:"vote_average.desc",rating:"6.5",votes:"150"});if(genreActive!=="すべて")p.set("genre",ASIA_GENRES[genreActive]);if(eraActive==="今年"){const y=String(new Date().getFullYear());p.set("from",y);p.set("to",y)}else if(/年代$/.test(eraActive)){const y=eraActive.slice(0,4);p.set("from",y);p.set("to",String(Number(y)+9))}$("#grid").className="rankGrid";$("#grid").innerHTML='<div class="empty">読み込み中…</div>';try{const r=await fetch("https://backend-one-gray-94.vercel.app/api/discover?"+p.toString(),{cache:"no-store"}),d=await r.json(),list=d.movies||[];$("#grid").innerHTML=list.length?list.map(card).join(""):'<div class="empty">該当作品がありません</div>';$("#sourceNote").textContent="アジア制作映画 · TMDBユーザー評価順"}catch{$("#grid").innerHTML='<div class="empty">ランキングを取得できませんでした</div>'}
}
'''
if 'async function renderAsiaRating()' not in s:s=s.replace('function renderRating(){','function renderRating(){if(regionActive==="アジア"){renderAsiaRating();return}',1);s=s.replace('function renderRating(){if(regionActive==="アジア"){renderAsiaRating();return}',asia+'function renderRating(){if(regionActive==="アジア"){renderAsiaRating();return}',1)
# Country-based domestic box-office buckets.
start=s.find('function renderBox(){')
end=s.find('function awardFilmName',start)
if start>=0 and end>start:
    newbox='''function productionBucket(movie,row){const cs=(movie?.countries||[]).map(x=>String(x));const has=(...keys)=>cs.some(c=>keys.some(k=>c.toLowerCase().includes(k)));if(has("japan"))return "日本";if(has("united states","usa"))return "アメリカ";if(has("south korea","korea","china","hong kong","taiwan","india","thailand","philippines","indonesia","malaysia","singapore"))return "アジア";if(has("united kingdom","france","germany","italy","spain","sweden","norway","denmark","netherlands","belgium","poland"))return "ヨーロッパ";return row.region==="邦画"?"日本":"その他"}
async function renderBox(){const regions=["すべて","日本","アメリカ","アジア","ヨーロッパ","その他"];$("#boxRegionChips").innerHTML=regions.map(x=>'<button class="chip '+(x===boxRegion?'active':'')+'" data-box-region="'+x+'">'+x+'</button>').join("");const years=Object.keys(boxoffice.by_year||{}).sort((a,b)=>Number(b)-Number(a)),periods=["歴代",...years];if(!periods.includes(boxEra))boxEra="歴代";$("#boxEraChips").innerHTML=periods.map(x=>'<button class="chip '+(x===boxEra?'active':'')+'" data-box-era="'+x+'">'+x+'</button>').join("");document.querySelectorAll('[data-box-region]').forEach(b=>b.onclick=()=>{boxRegion=b.dataset.boxRegion;render()});document.querySelectorAll('[data-box-era]').forEach(b=>b.onclick=()=>{boxEra=b.dataset.boxEra;render()});let raw=boxEra==="歴代"?(boxoffice.all_time||[]):((boxoffice.by_year||{})[boxEra]||[]),enriched=await Promise.all(raw.map(async m=>({...m,_movie:await resolveMovie(m.title)})));enriched.forEach(m=>m._bucket=productionBucket(m._movie,m));let list=boxRegion==="すべて"?enriched:enriched.filter(x=>x._bucket===boxRegion);list.sort((a,b)=>(b.gross||0)-(a.gross||0));$("#grid").className="rankGrid";$("#grid").innerHTML=list.length?list.map((m,i)=>'<a class="rankCard" href="'+(m._movie&&(m._movie.tmdbId||m._movie.id)?'search.html?id='+encodeURIComponent(m._movie.tmdbId||m._movie.id)+'&search='+encodeURIComponent(m._movie.title||m.title):'search.html?search='+encodeURIComponent(m.title))+'">'+(m._movie?.poster?'<img src="'+m._movie.poster+'" loading="lazy">':'<div class="rankPosterPlaceholder"></div>')+'<div class="body"><div class="no">#'+(i+1)+'</div><div class="title">'+m.title+'</div><div class="meta">'+(m.year||boxEra||'')+' · '+m._bucket+'</div><div class="meta" style="font-weight:800;color:#e5e7eb">'+Number(m.gross||0).toFixed(1)+'億円</div></div></a>').join(''):'<div class="empty">該当作品がありません</div>';$("#sourceNote").textContent="日本国内興行収入 · 制作国別 · "+(boxEra==="歴代"?"歴代":""+boxEra+"年")}
'''
    s=s[:start]+newbox+s[end:]
# Honor-category ordering: Best Picture first after All.
order='''const AWARD_CATEGORY_ORDER=["作品賞","最優秀作品賞","Best Picture","パルム・ドール","金獅子賞","金熊賞","監督賞","脚本賞","主演男優賞","主演女優賞","助演男優賞","助演女優賞","撮影賞","編集賞","音楽賞","国際長編映画賞"];function orderedAwardCategories(list){const rank=x=>{const n=String(x);let i=AWARD_CATEGORY_ORDER.findIndex(k=>n===k||n.includes(k));return i<0?999:i};return [...new Set(list)].sort((a,b)=>rank(a)-rank(b)||String(a).localeCompare(String(b),"ja"))}
'''
if 'AWARD_CATEGORY_ORDER' not in s:s=s.replace('const AWARD_ORG_ORDER=',order+'const AWARD_ORG_ORDER=',1)
s=s.replace('cats=["すべて",...new Set(inOrg.map(x=>x.category))]','cats=["すべて",...orderedAwardCategories(inOrg.map(x=>x.category))]')
s=s.replace('Cinemap v0.4.65','Cinemap v0.4.67')
write(p,s)

# Extend official annual box-office tabs before 2022.
p='data/boxoffice.json'; d=json.loads(read(p)); by=d.setdefault('by_year',{})
if '2021' not in by:
    by['2021']=[
      {"title":"シン・エヴァンゲリオン劇場版","gross":102.8,"region":"邦画"},{"title":"名探偵コナン 緋色の弾丸","gross":76.5,"region":"邦画"},{"title":"竜とそばかすの姫","gross":66.0,"region":"邦画"},{"title":"ARASHI Anniversary Tour 5×20 FILM Record of Memories","gross":45.5,"region":"邦画"},{"title":"東京リベンジャーズ","gross":45.0,"region":"邦画"},{"title":"るろうに剣心 最終章 The Final","gross":43.5,"region":"邦画"},{"title":"新解釈・三國志","gross":40.3,"region":"邦画"},{"title":"花束みたいな恋をした","gross":38.1,"region":"邦画"},{"title":"マスカレード・ナイト","gross":38.1,"region":"邦画"},{"title":"ワイルド・スピード／ジェットブレイク","gross":36.6,"region":"洋画"},{"title":"007／ノー・タイム・トゥ・ダイ","gross":27.2,"region":"洋画"},{"title":"ゴジラvsコング","gross":19.0,"region":"洋画"},{"title":"DUNE／デューン 砂の惑星","gross":11.2,"region":"洋画"}]
    d.setdefault('sources',[]).append({"name":"日本映画製作者連盟 2021年興行収入10億円以上番組","url":"https://www.eiren.org/toukei/img/eiren_kosyu/data_2021.pdf","as_of":"2022-01"})
if '2020' not in by:
    by['2020']=[
      {"title":"劇場版「鬼滅の刃」無限列車編","gross":365.5,"region":"邦画"},{"title":"今日から俺は!!劇場版","gross":53.7,"region":"邦画"},{"title":"コンフィデンスマンJP プリンセス編","gross":38.4,"region":"邦画"},{"title":"映画ドラえもん のび太の新恐竜","gross":33.5,"region":"邦画"},{"title":"事故物件 恐い間取り","gross":23.4,"region":"邦画"},{"title":"糸","gross":22.7,"region":"邦画"},{"title":"劇場版 ヴァイオレット・エヴァーガーデン","gross":21.3,"region":"邦画"},{"title":"TENET テネット","gross":27.3,"region":"洋画"},{"title":"パラサイト 半地下の家族","gross":47.4,"region":"洋画"},{"title":"スター・ウォーズ／スカイウォーカーの夜明け","gross":73.2,"region":"洋画"}]
    d.setdefault('sources',[]).append({"name":"日本映画製作者連盟 2020年興行収入10億円以上番組","url":"https://www.eiren.org/toukei/img/eiren_kosyu/2020.pdf","as_of":"2021-01"})
write(p,json.dumps(d,ensure_ascii=False,indent=2)+'\n')

# ---------- My Cinemap ----------
p='my-cinemap.html'; s=read(p)
css='''\n/* My Cinemap compact mobile + additional themes */
.art.amber{background:#b47722;color:#fff8e8}.art.teal{background:#165b5a;color:#efffff}.art.lavender{background:#d8cfea;color:#261f32}.art.paper{background:#f4f0e6;color:#24201a}
.movieName,.posterName{font-synthesis:none;line-break:strict;word-break:normal;overflow-wrap:normal}
@media(max-width:760px){.hero{padding:16px 0 8px}.editor{display:flex;flex-direction:column;gap:10px}.previewPanel{order:-1;position:static}.panel{padding:10px}.label{margin:8px 0 4px}.results{max-height:110px}.list{display:grid;grid-template-columns:1fr 1fr;gap:4px}.item{grid-template-columns:20px 28px minmax(0,1fr) auto;padding:3px 0}.item img{width:28px}.buttons{gap:5px;margin-top:8px}.buttons button{padding:9px 5px;font-size:10px}.art{aspect-ratio:16/9;padding:3.2%}.artTitle{font-size:clamp(18px,5.8vw,25px);margin:1% 0}.artSub{font-size:9px;margin-bottom:1.5%}.rankGrid{height:66%;gap:1%}.rank{padding-top:1%;grid-template-columns:19% 1fr}.num{font-size:clamp(18px,5vw,28px)}.movieName{font-size:clamp(6px,1.7vw,9px)}.year{font-size:6px}.credit{font-size:7px}}
'''
if 'My Cinemap compact mobile + additional themes' not in s:s=s.replace('</style>',css+'</style>',1)
if 'data-theme="amber"' not in s:
    s=s.replace('<button class="themeChoice" data-theme="mono"><span class="themeSwatch" style="background:#dedede"></span>Monochrome</button>',
'''<button class="themeChoice" data-theme="mono"><span class="themeSwatch" style="background:#dedede"></span>Monochrome</button>
<button class="themeChoice" data-theme="amber"><span class="themeSwatch" style="background:#b47722"></span>Cinema / Amber</button>
<button class="themeChoice" data-theme="teal"><span class="themeSwatch" style="background:#165b5a"></span>Modern / Teal</button>
<button class="themeChoice" data-theme="lavender"><span class="themeSwatch" style="background:#d8cfea"></span>Soft / Lavender</button>
<button class="themeChoice" data-theme="paper"><span class="themeSwatch" style="background:#f4f0e6"></span>Paper / White</button>''',1)
# Add palettes and wait for fonts before canvas rendering; use Japanese-safe title font.
s=s.replace('document.getElementById("save").onclick=async()=>{let w=1600', 'document.getElementById("save").onclick=async()=>{if(document.fonts?.ready)await document.fonts.ready;let w=1600',1)
s=s.replace('mono:["#dedede","#151515"]}', 'mono:["#dedede","#151515"],amber:["#b47722","#fff8e8"],teal:["#165b5a","#efffff"],lavender:["#d8cfea","#261f32"],paper:["#f4f0e6","#24201a"]}',1)
s=s.replace('x.font="700 58px Georgia, serif"','x.font=\'700 58px "Hiragino Sans","Yu Gothic",Meiryo,sans-serif\'',1)
s=s.replace('x.font="700 "+size+"px Georgia, serif"','x.font=\'700 \'+size+\'px "Hiragino Sans","Yu Gothic",Meiryo,sans-serif\'')
# Add title to critic deep link for robust fallback.
s=s.replace("critic.html?id='+encodeURIComponent(m.tmdbId||m.id||'')+'\"", "critic.html?id='+encodeURIComponent(m.tmdbId||m.id||'')+'&search='+encodeURIComponent(m.title||'')+'\"")
s=s.replace('Cinemap v0.4.66','Cinemap v0.4.67')
write(p,s)

# ---------- Experience: expose verified IMAX GT screens ----------
p='experience.html'; s=read(p)
css='''\n.gtTheaters{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}.gtTheater{border:1px solid var(--line);border-radius:10px;background:#0d0d0d;padding:14px}.gtTheater b{display:block;font-size:15px}.gtTheater strong{display:block;color:#64b9ff;font-size:20px;margin-top:5px}.gtTheater a{display:inline-block;margin-top:9px;color:#aaa;font-size:10px;text-decoration:underline}@media(max-width:650px){.gtTheaters{grid-template-columns:1fr}}
'''
if '.gtTheaters{' not in s:s=s.replace('</style>',css+'</style>',1)
sec='''<section class="section" id="imax-gt-theaters"><div class="sectionHead"><div><div class="eyebrow">VERIFIED SCREENS</div><h2>IMAX GTを観られる映画館・スクリーン</h2></div><p>公式劇場ページでスクリーンまで確認できた国内のIMAX GT。通常のIMAXレーザーとは分けて表示します。</p></div><div class="gtTheaters"><article class="gtTheater"><b>グランドシネマサンシャイン 池袋</b><strong>シアター12</strong><span class="note">東京都 · IMAX GT</span><a href="https://www.cinemasunshine.co.jp/pages/gdcs/" target="_blank" rel="noopener noreferrer">劇場公式で確認 →</a></article><article class="gtTheater"><b>109シネマズ大阪エキスポシティ</b><strong>シアター11</strong><span class="note">大阪府 · IMAX GT</span><a href="https://109cinemas.net/osaka-expocity/establishment.html" target="_blank" rel="noopener noreferrer">劇場公式で確認 →</a></article></div></section>'''
if 'id="imax-gt-theaters"' not in s:s=s.replace('</main>',sec+'</main>',1)
write(p,s)

# ---------- Core/Critic Map: simplify + robust broken-link fallback ----------
p='critic.html'; s=read(p)
css='''\n/* Critic Map clarity pass */
.flow{display:none!important}.hero{padding-bottom:10px}.lead{margin-bottom:10px}.topicSections{display:grid;gap:12px}.deep{margin-top:14px;padding-top:14px}.deep h2{font-size:14px;color:#bbb}.matrix{max-height:250px}.relatedGroups{margin-top:10px}.works{padding-bottom:5px}
@media(max-width:560px){.topics{grid-template-columns:1fr 1fr}.topic{padding:10px}.topic b{font-size:11px}.topic span{font-size:9px}.panel{padding:12px}.question{font-size:16px}}
'''
if 'Critic Map clarity pass' not in s:s=s.replace('</style>',css+'</style>',1)
# Related links carry title as fallback.
s=s.replace("href=\"critic.html?id='+encodeURIComponent(x.tmdbId||x.id)+'\"", "href=\"critic.html?id='+encodeURIComponent(x.tmdbId||x.id)+'&search='+encodeURIComponent(x.title||'')+'\"")
# Dynamic lens rewrites preserve search title too.
s=s.replace('const rp=new URLSearchParams({id:String(a.dataset.relatedId),lens:selectedLens,from:m.title||"",fromId:String(m.tmdbId||m.id||"")})', 'const rp=new URLSearchParams({id:String(a.dataset.relatedId),search:(a.querySelector("b")?.textContent||""),lens:selectedLens,from:m.title||"",fromId:String(m.tmdbId||m.id||"")})')
old='''(async()=>{const id=new URLSearchParams(location.search).get("id");if(!id){app.textContent="作品を指定してください。";return}try{const r=await fetch(API+"/api/movie-detail?id="+encodeURIComponent(id),{cache:"no-store"});if(!r.ok)throw 0;const d=await r.json();render(d.movie)}catch{app.textContent="作品情報を取得できませんでした。"}})();'''
new='''async function fetchCriticMovie(id){if(!id)return null;const r=await fetch(API+"/api/movie-detail?id="+encodeURIComponent(id),{cache:"no-store"});if(!r.ok)return null;const d=await r.json();return d.movie||null}
(async()=>{const p=new URLSearchParams(location.search),id=p.get("id"),title=p.get("search")||p.get("title")||"";let movie=null;try{movie=await fetchCriticMovie(id);if(!movie&&title){const r=await fetch(API+"/api/movies?q="+encodeURIComponent(title)+"&limit=5",{cache:"no-store"});if(r.ok){const d=await r.json(),rows=[...(d.movies||[]),...(d.external||[])],n=title.toLowerCase();const hit=rows.find(x=>String(x.title||"").toLowerCase()===n)||rows[0];if(hit)movie=await fetchCriticMovie(hit.tmdbId||hit.id)}}}catch{}if(movie){render(movie);return}app.innerHTML='<div class="status">作品情報を取得できませんでした。<br><a href="search.html?search='+encodeURIComponent(title)+'" style="display:inline-block;margin-top:12px;color:#ddd">作品検索へ戻る →</a></div>'})();'''
if old in s:s=s.replace(old,new,1)
s=s.replace('Cinemap Critic Map v3.3','Cinemap Critic Map v3.4')
write(p,s)

# Search detail: include title in Critic Map link for fallback.
p='search.html'; s=read(p)
s=s.replace("href=\"critic.html?id='+encodeURIComponent(m.tmdbId||m.id||'')+'\"", "href=\"critic.html?id='+encodeURIComponent(m.tmdbId||m.id||'')+'&search='+encodeURIComponent(m.title||'')+'\"")
write(p,s)

print('batch patch complete')
