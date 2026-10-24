(function(root,factory){
 const api=factory(root,typeof module==='object'&&module.exports?require('./cinelva-now-playing.js'):root.CinelvaNowPlaying);
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.CinelvaCalendarNowPlaying=api;
 if(root.document){const start=()=>api.mount(root.document);if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',start,{once:true});else start();}
})(typeof globalThis==='object'?globalThis:this,function(root,source){
 const scriptURL=root.document?.currentScript?.src;
 const base=scriptURL?new URL('../',scriptURL).href:null;
 const id=movie=>{const value=movie?.tmdbId??movie?.tmdb_id??movie?.id;return /^\d+$/.test(String(value))&&Number.isSafeInteger(Number(value))&&Number(value)>0?String(Number(value)):'';};
 function activeIds(data,now=Date.now()){
  const snapshot=data?.snapshot??data,ids=new Set(source?.snapshotState(snapshot,now)==='fresh'?snapshot.movies.map(row=>String(Number(row.id))):[]);
  const day=new Date(now+9*3600000).toISOString().slice(0,10);
  for(const row of data?.screenings||[]){
   const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value))&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
   if(id(row)&&/^https:\/\//.test(row.source_url||'')&&validDate(row.date)&&validDate(row.end_date)&&row.date<=day&&day<=row.end_date)ids.add(id(row));
  }
  return ids;
 }
 function matches(movie,data,now=Date.now()){return !!id(movie)&&activeIds(data,now).has(id(movie));}
 function annotate(doc){
  const mark=(holder,key)=>{if(holder&&key&&!holder.dataset.nowFilmId)holder.dataset.nowFilmId=key;};
  for(const link of doc.querySelectorAll('a[href*="search.html"],a[href*="themoviedb.org/movie/"]')){
   const url=new URL(link.href),key=id({id:url.searchParams.get('id')||url.pathname.match(/\/movie\/(\d+)/)?.[1]});
   if(!key)continue;
   const image=link.querySelector('img');
   const holder=link.querySelector('.poster,.awardPoster,.presetCardPoster,.cinelva-label-poster');
   if(holder)mark(holder,key);else if(image)mark(wrap(image),key);
  }
  const detail=doc.querySelector('.detailTop > img'),key=id({id:new URL(doc.location?.href||'https://invalid/').searchParams.get('id')});
  if(detail&&key)mark(wrap(detail),key);
  function wrap(image){
   const parent=image.parentElement;
   if(parent.matches('[data-now-film-id],.poster,.cinelva-label-poster'))return parent;
   const fallback=image.getAttribute('onerror')?.includes('nextElementSibling')?image.nextElementSibling:null;
   const holder=doc.createElement('span');holder.className='cinelva-label-poster';image.before(holder);holder.append(image);if(fallback)holder.append(fallback);return holder;
  }
 }
 function reconcile(doc,data,now=Date.now()){
  annotate(doc);
  const ids=activeIds(data,now);
  for(const poster of doc.querySelectorAll('[data-now-film-id]')){
   const current=poster.querySelector(':scope > .cinelva-now-playing-label'),active=ids.has(poster.dataset.nowFilmId);
   if(!active){current?.remove();continue;}
   if(!current){const label=doc.createElement('span');label.className='cinelva-now-playing-label';label.textContent='上映中';label.title='現在の上映情報（TMDB・公式上映期間）';poster.append(label);}
  }
 }
 async function mount(doc){
  let data=null,queued=false,timer;
  const observer=new root.MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(update);}});
  function update(){queued=false;observer.disconnect();reconcile(doc,data);observer.observe(doc.body,{childList:true,subtree:true});root.clearTimeout(timer);const snapshot=data?.snapshot??data,midnight=(Math.floor((Date.now()+9*3600000)/86400000)+1)*86400000-9*3600000;const expiry=source?.snapshotState(snapshot)==='fresh'?Date.parse(snapshot.generated_at)+36*3600000+1:Infinity;timer=root.setTimeout(update,Math.max(1,Math.min(midnight,expiry)-Date.now()));}
  update();
  doc.addEventListener('visibilitychange',update);
  const read=async name=>{try{const response=await root.fetch(base?new URL('data/'+name,base).href:'data/'+name,{cache:'no-store',signal:AbortSignal.timeout(8000)});return response.ok?await response.json():null;}catch{return null;}};
  const [snapshot,special,revival]=await Promise.all(['now_playing.json','special_screenings.json','revival_screenings.json'].map(read));
  data={snapshot,screenings:[...(Array.isArray(special?.screenings)?special.screenings:[]),...(Array.isArray(revival?.screenings)?revival.screenings:[])]};
  update();
  root.addEventListener('pagehide',()=>{observer.disconnect();root.clearTimeout(timer);});
  root.addEventListener('pageshow',update);
 }
 return {id,matches,activeIds,annotate,reconcile,mount};
});
