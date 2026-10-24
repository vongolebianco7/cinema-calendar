(function(root,factory){
 const api=factory(root,typeof module==='object'&&module.exports?require('./cinelva-now-playing.js'):root.CinelvaNowPlaying);
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.CinelvaCalendarNowPlaying=api;
 if(root.document){const start=()=>api.mount(root.document);if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',start,{once:true});else start();}
})(typeof globalThis==='object'?globalThis:this,function(root,source){
 const id=movie=>{const value=movie?.tmdbId??movie?.tmdb_id??movie?.id;return /^\d+$/.test(String(value))&&Number.isSafeInteger(Number(value))&&Number(value)>0?String(Number(value)):'';};
 function matches(movie,data,now=Date.now()){return source?.snapshotState(data,now)==='fresh'&&!!id(movie)&&data.movies.some(row=>String(Number(row.id))===id(movie));}
 function reconcile(doc,data,now=Date.now()){
  const ids=source?.snapshotState(data,now)==='fresh'?new Set(data.movies.map(row=>String(Number(row.id)))):new Set();
  for(const poster of doc.querySelectorAll('[data-now-film-id]')){
   const current=poster.querySelector(':scope > .cinelva-now-playing-label'),active=ids.has(poster.dataset.nowFilmId);
   if(!active){current?.remove();continue;}
   if(!current){const label=doc.createElement('span');label.className='cinelva-now-playing-label';label.textContent='上映中';label.title='現在の上映中情報（TMDB日本向け掲載）';poster.append(label);}
  }
 }
 async function mount(doc){
  let data=null,queued=false,timer;
  const observer=new root.MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(update);}});
  function update(){queued=false;observer.disconnect();reconcile(doc,data);observer.observe(doc.body,{childList:true,subtree:true});root.clearTimeout(timer);if(source?.snapshotState(data)==='fresh')timer=root.setTimeout(update,Math.max(1,Date.parse(data.generated_at)+36*3600000-Date.now()+1));}
  update();
  doc.addEventListener('visibilitychange',update);
  try{const response=await root.fetch('data/now_playing.json',{cache:'no-store',signal:AbortSignal.timeout(8000)});if(response.ok)data=await response.json();}catch{/* Missing information never implies current screening. */}
  update();
  root.addEventListener('pagehide',()=>{observer.disconnect();root.clearTimeout(timer);},{once:true});
  root.addEventListener('pageshow',update);
 }
 return {id,matches,reconcile,mount};
});
