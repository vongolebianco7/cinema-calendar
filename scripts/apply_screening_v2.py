from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

search_path = ROOT / "search.html"
critic_path = ROOT / "critic.html"
search = search_path.read_text(encoding="utf-8")
critic = critic_path.read_text(encoding="utf-8")

old_css = '.formatRating.best{border-color:#665d39;background:#191710}'
new_css = '.formatRating.best{border-color:#665d39;background:#191710}.formatBadge{display:inline-block;margin-left:6px;padding:2px 6px;border:1px solid #665d39;border-radius:999px;color:#eadb96;font-size:8px;vertical-align:1px}.formatReasonTitle{font-size:9px;color:#777;letter-spacing:.08em;margin-top:6px}.formatConfidence{font-size:8px;color:#666;margin-top:5px}.formatSources{display:flex;gap:7px;flex-wrap:wrap;margin-top:6px}.formatSources a{font-size:8px;color:#aaa}.formatSub{margin-top:7px;padding-top:7px;border-top:1px solid #292929;color:#999;font-size:9px;line-height:1.5}'
if old_css not in search:
    raise SystemExit("search CSS anchor not found")
search = search.replace(old_css, new_css, 1)

old_open = 'async function openMovie(m){syncTrailUrl(m);modal.classList.add("show");detail.innerHTML=\'<div class="status">読み込み中…</div>\';const id=m.tmdbId||(m.catalog||m.source==="tmdb"?m.id:null);if(!id){renderDetail(m);return}try{let r=await fetch(API+"/api/movie-detail?id="+encodeURIComponent(id),{cache:"no-store"});if(!r.ok)throw new Error("detail "+r.status);let d=await r.json();let movie=d.movie||m;try{let vg=await fetch("data/viewing_guides.json",{cache:"no-store"}).then(x=>x.json());movie.viewing_guide=(vg.guides||[]).find(x=>Number(x.tmdb_id)===Number(movie.tmdbId||movie.id))||null}catch{}renderDetail(movie)}catch(e){renderDetail(m)}}'
new_open = '''const FORMAT_ORDER=["standard","imax","dolby_cinema","motion","screenx"];
let screeningEvidencePromise=null;
function withTimeout(promise,ms=9000,message="読み込みがタイムアウトしました"){return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(message)),ms))])}
async function screeningEvidenceRegistry(){if(!screeningEvidencePromise)screeningEvidencePromise=fetch("data/screening_format_evidence.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw new Error("screening evidence "+r.status);return r.json()}).catch(()=>({default:{},films:{},title_fixtures:{}}));return screeningEvidencePromise}
async function loadScreeningEvidence(m){const reg=await screeningEvidenceRegistry(),id=String(m.tmdbId||m.id||""),year=String(m.year||String(m.date||"").slice(0,4)||""),titleKey=String(m.title||"")+"|"+year,base={...(reg.default||{})},byTitle=(reg.title_fixtures||{})[titleKey]||{},byId=(reg.films||{})[id]||{};return {...base,...byTitle,...byId,sources:[...(base.sources||[]),...(byTitle.sources||[]),...(byId.sources||[])]}}
async function openMovie(m){syncTrailUrl(m);modal.classList.add("show");detail.innerHTML='<div class="status">読み込み中…</div>';const id=m.tmdbId||(m.catalog||m.source==="tmdb"?m.id:null);if(!id){m.screening_format_evidence=await loadScreeningEvidence(m);renderDetail(m);return}try{let r=await withTimeout(fetch(API+"/api/movie-detail?id="+encodeURIComponent(id),{cache:"no-store"}),9000);if(!r.ok)throw new Error("detail "+r.status);let d=await r.json();let movie=d.movie||m;try{let vg=await withTimeout(fetch("data/viewing_guides.json",{cache:"no-store"}),5000).then(x=>x.json());movie.viewing_guide=(vg.guides||[]).find(x=>Number(x.tmdb_id)===Number(movie.tmdbId||movie.id))||null}catch{}movie.screening_format_evidence=await loadScreeningEvidence(movie);renderDetail(movie)}catch(e){m.screening_format_evidence=await loadScreeningEvidence(m);renderDetail(m)}}'''
if old_open not in search:
    raise SystemExit("openMovie anchor not found")
search = search.replace(old_open, new_open, 1)

start = search.find('function formatRecommendationsHtml(m){')
end = search.find('\n\nfunction renderDetail(m){', start)
if start < 0 or end < 0:
    raise SystemExit("formatRecommendationsHtml block not found")
new_format = r'''function screeningKnown(v){return v!==undefined&&v!==null&&v!=="unknown"}
function screeningConfidence(values){const known=values.filter(screeningKnown).length;if(known===values.length&&known>0)return "確認済み";if(known>0)return "一部確認";return "情報不足"}
function formatReasonHtml(x){return '<div class="formatReasonTitle">上映方式おすすめの理由</div><small>'+E(x.reasons.join(" "))+'</small>'+(x.sub?'<div class="formatSub">'+E(x.sub)+'</div>':'')+'<div class="formatConfidence">根拠：'+E(x.confidence)+'</div>'+(x.sources?.length?'<div class="formatSources">'+x.sources.map(s=>'<a target="_blank" rel="noopener noreferrer" href="'+E(s.url)+'">'+E(s.label||"根拠")+' ↗</a>').join("")+'</div>':'')}
function scoreScreeningFormats(m,evidence){
 const e=evidence||{},sources=e.sources||[],imaxExpanded=["1.43","1.90","mixed"].includes(e.imax_expanded_ratio),imaxCamera=["imax_film","imax_certified_digital"].includes(e.imax_camera);
 let imaxScore=1,imaxReasons=[];
 if(imaxCamera&&imaxExpanded){imaxScore=5;imaxReasons.push("IMAXカメラ撮影と拡張画角が確認でき、通常上映より多い映像情報を見られるためIMAXを最優先。")}
 else if(e.filmed_for_imax===true){imaxScore=4;imaxReasons.push("Filmed for IMAXとして作品側がIMAX上映を前提に設計していることが確認できるため。")}
 else if(e.imax_dmr_only===true){imaxScore=2;imaxReasons.push("IMAX専用画角の根拠がなくDMR中心のため、追加料金に対する作品固有のメリットは限定的。")}
 else if(screeningKnown(e.imax_camera)||screeningKnown(e.imax_expanded_ratio)){imaxScore=2;imaxReasons.push("IMAX関連情報は一部確認できるものの、拡張画角と撮影方式の両方が揃って確認できないため。")}
 else imaxReasons.push("IMAX専用画角・IMAX撮影など作品固有の優位性を確認できないため、通常上映を優先。")

 let dolbyScore=1,dolbyReasons=[];
 if(e.dolby_vision_master===true&&e.dolby_atmos_mix===true){dolbyScore=5;dolbyReasons.push("Dolby VisionとDolby Atmosの両方が確認でき、映像と立体音響をセットで活かせるため。")}
 else if(e.dolby_vision_master===true||e.dolby_atmos_mix===true){dolbyScore=3;dolbyReasons.push(e.dolby_vision_master===true?"Dolby Visionの映像メリットは確認できるが、Atmosまで揃う根拠がないため。":"Dolby Atmosミックスは確認できるが、Dolby Visionまで揃う根拠がなく、Dolby Cinemaとしては中評価。")}
 else dolbyReasons.push("Dolby Vision / Dolby Atmosの作品固有対応を確認できないため、Dolby Cinemaを積極推奨しない。")

 let motionScore=(e.official_4dx===true||e.official_mx4d===true)?4:1,motionReasons=[motionScore>=4?"作品の4DX / MX4D公式対応が確認でき、体感演出を前提にした上映を選べるため。":"4DX / MX4Dの公式対応を確認できないため、作品ジャンルだけでは推奨しない。"];
 let screenxScore=e.official_screenx===true?4:1,screenxReasons=[screenxScore>=4?"ScreenX公式版が確認でき、左右壁面まで使う拡張映像を体験できるため。":"ScreenX専用素材・公式対応を確認できないため、広がりそうな作品という理由だけでは推奨しない。"];
 const premiumMax=Math.max(imaxScore,dolbyScore,motionScore,screenxScore),standardScore=premiumMax<=2?5:premiumMax===3?4:premiumMax===5?2:3;
 const rows={
  standard:{key:"standard",name:"通常上映",score:standardScore,reasons:[premiumMax<=2?"追加料金に見合うプレミアム方式固有のメリットが確認できないため、通常上映が最も合理的。":"プレミアム方式に確認済みの利点があるため、通常上映はコスト重視の選択肢。"],confidence:"確認済み",sources:[]},
  imax:{key:"imax",name:"IMAX",score:imaxScore,reasons:imaxReasons,confidence:screeningConfidence([e.imax_camera,e.imax_expanded_ratio,e.filmed_for_imax,e.imax_dmr_only]),sources},
  dolby_cinema:{key:"dolby_cinema",name:"Dolby Cinema",score:dolbyScore,reasons:dolbyReasons,confidence:screeningConfidence([e.dolby_vision_master,e.dolby_atmos_mix]),sources,sub:e.dolby_atmos_mix===true?"Dolby Atmos対応：立体音響は確認済み。AtmosはDolby Cinemaとは別の独立上映方式ではなく、Dolby Cinemaを構成する音響技術のひとつです。":"Dolby Atmosは音響技術であり、Dolby Cinemaと同列の上映方式としては扱いません。"},
  motion:{key:"motion",name:"4DX / MX4D",score:motionScore,reasons:motionReasons,confidence:screeningConfidence([e.official_4dx,e.official_mx4d]),sources},
  screenx:{key:"screenx",name:"ScreenX",score:screenxScore,reasons:screenxReasons,confidence:screeningConfidence([e.official_screenx]),sources}
 };
 const winner=FORMAT_ORDER.map(k=>rows[k]).reduce((a,b)=>b.score>a.score?b:a,rows.standard);return {rows,winner}
}
function formatRecommendationsHtml(m){const scored=scoreScreeningFormats(m,m.screening_format_evidence||{});return '<div class="section"><h3>どの上映方式で見る？</h3><div class="small">プレミアムだから高評価にはせず、その作品が方式固有のメリットを実際に使っているかで判定します。</div><div class="formatRatings">'+FORMAT_ORDER.map(k=>{const x=scored.rows[k],best=x.key===scored.winner.key;return '<div class="formatRating '+(best?'best':'')+'"><div><b>'+E(x.name)+(best?'<span class="formatBadge">おすすめ</span>':'')+'</b>'+formatReasonHtml(x)+'</div><div class="formatStars" aria-label="'+x.score+' / 5">'+starText(x.score)+'</div></div>'}).join("")+'</div><div class="formatNote">表示順は「通常上映 → IMAX → Dolby Cinema → 4DX / MX4D → ScreenX」で固定。★は検証できた作品固有の根拠から算出します。情報不足時はプレミアム方式を高く評価しません。</div><a class="formatLink" href="experience.html">上映方式を比較する →</a></div>'}
'''
search = search[:start] + new_format + search[end:]

old_initial = 'if(initialId){modal.classList.add("show");detail.innerHTML=\'<div class="status">読み込み中…</div>\';fetch(API+"/api/movie-detail?id="+encodeURIComponent(initialId),{cache:"no-store"}).then(r=>{if(!r.ok)throw new Error("detail "+r.status);return r.json()}).then(d=>renderDetail(d.movie)).catch(()=>{detail.innerHTML=\'<div class="status">作品情報を取得できませんでした。</div>\'})}else if(q.value)search();'
new_initial = 'if(initialId){modal.classList.add("show");detail.innerHTML=\'<div class="status">読み込み中…</div>\';withTimeout(fetch(API+"/api/movie-detail?id="+encodeURIComponent(initialId),{cache:"no-store"}),9000).then(r=>{if(!r.ok)throw new Error("detail "+r.status);return r.json()}).then(async d=>{d.movie.screening_format_evidence=await loadScreeningEvidence(d.movie);renderDetail(d.movie)}).catch(()=>{detail.innerHTML=\'<div class="status">作品情報を取得できませんでした。<br><button type="button" data-retry-detail style="margin-top:10px;padding:8px 11px">再試行</button></div>\';const retry=detail.querySelector("[data-retry-detail]");if(retry)retry.onclick=()=>location.reload()})}else if(q.value)search();'
if old_initial not in search:
    raise SystemExit("initial detail load anchor not found")
search = search.replace(old_initial, new_initial, 1)

critic_anchor = 'async function fetchCriticMovie(id,title=""){'
if critic_anchor not in critic:
    raise SystemExit("critic fetch anchor not found")
critic = critic.replace(critic_anchor, 'function withTimeout(promise,ms=9000,message="読み込みがタイムアウトしました"){return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(message)),ms))])}\nasync function fetchCriticMovie(id,title=""){', 1)
critic = critic.replace('const r=await fetch(API+"/api/movie-detail?id="+encodeURIComponent(id),{cache:"no-store"})', 'const r=await withTimeout(fetch(API+"/api/movie-detail?id="+encodeURIComponent(id),{cache:"no-store"}),9000)', 1)
critic = critic.replace('const r=await fetch(API+"/api/movies?q="+encodeURIComponent(title)+"&limit=8",{cache:"no-store"})', 'const r=await withTimeout(fetch(API+"/api/movies?q="+encodeURIComponent(title)+"&limit=8",{cache:"no-store"}),9000)', 1)
critic = critic.replace('const r2=await fetch(API+"/api/movie-detail?id="+encodeURIComponent(rid),{cache:"no-store"})', 'const r2=await withTimeout(fetch(API+"/api/movie-detail?id="+encodeURIComponent(rid),{cache:"no-store"}),9000)', 1)
old_iife = '(async()=>{const p=new URLSearchParams(location.search),id=p.get("id"),title=p.get("search")||p.get("title")||p.get("from")||"";const movie=await fetchCriticMovie(id,title);if(movie){const back=document.getElementById("detailBack"),mid=movie.tmdbId||movie.id||id;if(back)back.href="search.html?"+new URLSearchParams({id:String(mid||""),search:movie.title||title}).toString();render(movie);return}app.innerHTML=\'<div class="status">作品情報を取得できませんでした。<br><a href="search.html?search=\'+encodeURIComponent(title)+\'" style="display:inline-block;margin-top:12px;color:#ddd">作品検索へ戻る →</a></div>\'})();'
new_iife = '(async function loadCriticPage(){const p=new URLSearchParams(location.search),id=p.get("id"),title=p.get("search")||p.get("title")||p.get("from")||"";app.innerHTML=\'<div class="status">作品を読み込み中…</div>\';try{const movie=await withTimeout(fetchCriticMovie(id,title),10000);if(movie){const back=document.getElementById("detailBack"),mid=movie.tmdbId||movie.id||id;if(back)back.href="search.html?"+new URLSearchParams({id:String(mid||""),search:movie.title||title}).toString();render(movie);return}throw new Error("movie not found")}catch(e){const timed=String(e&&e.message||"").includes("タイムアウト");app.innerHTML=\'<div class="status">\'+(timed?\'読み込みがタイムアウトしました。\':\'作品情報を取得できませんでした。\')+\'<br><button type="button" data-retry-movie style="margin-top:12px;padding:9px 12px;border:0;border-radius:8px;font-weight:800">再試行</button><br><a href="search.html?search=\'+encodeURIComponent(title)+\'" style="display:inline-block;margin-top:12px;color:#ddd">作品検索へ戻る →</a></div>\';const retry=app.querySelector("[data-retry-movie]");if(retry)retry.onclick=loadCriticPage}})();'
if old_iife not in critic:
    raise SystemExit("critic page loader anchor not found")
critic = critic.replace(old_iife, new_iife, 1)

search_path.write_text(search, encoding="utf-8")
critic_path.write_text(critic, encoding="utf-8")
print("screening recommendation v2 patch applied")
