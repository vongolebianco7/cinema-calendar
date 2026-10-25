(function(root,factory){
 'use strict';const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.CinelvaNowPlaying=api;
 if(root.document){const start=()=>{const section=root.document.getElementById('nowPlaying');if(section)api.mount(section);};if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',start,{once:true});else start();}
})(typeof globalThis==='object'?globalThis:this,function(root){
 'use strict';
 const AGE=36*3600000,FUTURE=300000;
 const positive=value=>Number.isSafeInteger(Number(value))&&Number(value)>0;
 const compact=value=>String(value||'').normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu,'');
 function snapshotState(data,now=Date.now()){
  if(!data||data.schema_version!==1||data.region!=='JP'||data.source?.id!=='tmdb'||data.source?.endpoint!=='/movie/now_playing'||data.complete!==true||!Array.isArray(data.movies)||typeof data.generated_at!=='string'||!/(?:Z|[+-]\d{2}:\d{2})$/.test(data.generated_at))return 'unavailable';
  const time=Date.parse(data.generated_at);
  if(!Number.isFinite(time)||time>now+FUTURE||data.movies.some(m=>!positive(m.id)||typeof m.title!=='string'||!m.title.trim()))return 'unavailable';
  if(now-time>AGE)return 'stale';
  return data.movies.length?'fresh':'empty';
 }
 function selectMovies(movies,query='',sort='popular'){
  const seen=new Set(),term=compact(query);
  const selected=(movies||[]).filter(m=>{const id=String(m.id);if(seen.has(id))return false;seen.add(id);return !term||[m.title,m.original_title].some(x=>compact(x).includes(term));});
  return selected.sort(sort==='title'?(a,b)=>a.title.localeCompare(b.title,'ja')||Number(a.id)-Number(b.id):(a,b)=>(Number(b.popularity)||0)-(Number(a.popularity)||0)||a.title.localeCompare(b.title,'ja'));
 }
 async function readSnapshot(){const r=await root.fetch('data/now_playing.json',{cache:'no-store',signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('snapshot unavailable');return r.json();}
 async function isCurrentlyPlaying(identity){
  if(!positive(identity))return false;
  try{const data=await readSnapshot();return snapshotState(data)==='fresh'&&data.movies.some(m=>String(m.id)===String(identity));}catch{return false;}
 }
 async function detailFallback(identity){
  if(!positive(identity))return null;
  try{const data=await readSnapshot(),state=snapshotState(data);if(state==='unavailable')return null;return data.movies.find(m=>String(m.id)===String(identity))||null;}catch{return null;}
 }
 async function mount(section){
  const doc=section.ownerDocument,status=section.querySelector('[data-now-status]'),grid=section.querySelector('[data-now-grid]'),controls=section.querySelector('[data-now-controls]'),search=section.querySelector('[data-now-search]'),sort=section.querySelector('[data-now-sort]'),more=section.querySelector('[data-now-more]'),observed=section.querySelector('[data-now-observed]');
  let data,expanded=false;
  const unavailable=(message)=>{status.textContent=message;grid.replaceChildren();controls.hidden=true;more.hidden=true;};
  try{
   data=await readSnapshot();const state=snapshotState(data);
   if(state!=='unavailable'){observed.dateTime=data.generated_at;observed.textContent='情報確認：'+new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',dateStyle:'medium',timeStyle:'short'}).format(new Date(data.generated_at))+'（日本時間）';}
   if(state==='stale'){unavailable('上映中情報の更新が必要です。最新の上映状況は映画館の公式サイトでご確認ください。');return;}
   if(state==='unavailable'){unavailable('上映中情報を取得できませんでした。更新後にもう一度ご確認ください。');return;}
   if(state==='empty'){unavailable('現在、情報提供元で確認できる上映中作品はありません。');return;}
   controls.hidden=false;
   const render=()=>{
    const all=selectMovies(data.movies,search.value,sort.value),shown=expanded?all:all.slice(0,12);
    grid.replaceChildren();status.textContent=all.length+'作品'+(all.length>shown.length?'（'+shown.length+'作品を表示）':'');
    if(!all.length){const empty=doc.createElement('p');empty.className='empty';empty.textContent='条件に合う上映中作品はありません。';grid.append(empty);}
    for(const movie of shown){
     root.CinelvaMovieIdentity?.ingest(movie);
     const wrap=doc.createElement('div');wrap.className='cinelva-discover-review-wrap';
     const card=doc.createElement('a');card.className='presetCard';card.dataset.nowPlayingId=String(movie.id);
     card.href='search.html?'+new URLSearchParams({id:String(movie.id),search:movie.title});
     const poster=doc.createElement('div');poster.className='presetCardPoster';
     const body=doc.createElement('div');body.className='presetCardBody';
     const title=doc.createElement('div');title.className='presetCardTitle';title.textContent=movie.title;body.append(title);
     const year=doc.createElement('div');year.className='presetCardMeta';year.textContent=movie.year||'公開年未確認';body.append(year);
     card.append(poster,body);wrap.append(card);
     const review=doc.createElement('div');review.className='cinelva-discover-review';wrap.append(review);
     root.CinelvaQuickRate?.mountInline(review,movie);
     grid.append(wrap);
     const artwork=root.CinelvaMovieIdentity?.posterFor(movie)||movie.poster;
     if(artwork)root.CinelvaMovieIdentity?.hydrateCard(poster,{...movie,poster:artwork});
     else{const missing=doc.createElement('span');missing.textContent='画像未提供';poster.append(missing);}
    }
    more.hidden=all.length<=12;more.textContent=expanded?'閉じる':'すべて表示（'+all.length+'作品）';more.setAttribute('aria-expanded',String(expanded));
   };
   search.addEventListener('input',()=>{expanded=false;render();});sort.addEventListener('change',render);more.addEventListener('click',()=>{expanded=!expanded;render();});render();
  }catch{unavailable('上映中情報を取得できませんでした。時間をおいて再度お試しください。');}
 }
 return {snapshotState,selectMovies,detailFallback,isCurrentlyPlaying,mount};
});
