/* Dedicated wanted-film tab; uses the same operations as discovery and records. */
(function(root){
 'use strict';
 const list=document.getElementById('wantWatchList'),Bookmarks=root.CinelvaBookmarks;
 if(!list||!Bookmarks)return;
 function render(){
  let entries;try{entries=Bookmarks.all();}catch(error){list.textContent=error.message;return;}
  list.replaceChildren();
  if(!entries.length){const p=document.createElement('p');p.className='hint';p.textContent='見たい映画はまだありません。映画一覧のブックマークから追加できます。';list.append(p);return;}
  for(const movie of entries){
   const row=document.createElement('article');row.className='want-watch-item';
   const link=document.createElement('a');link.href='../search.html?'+new URLSearchParams({id:movie.tmdbId,search:movie.title||''});link.textContent=movie.title||'作品';
   const source=movie.poster||movie.poster_path||'';
   const poster=source.startsWith('/')?'https://image.tmdb.org/t/p/w185'+source:source;
   if(/^https:\/\//.test(poster)){const image=document.createElement('img');image.src=poster;image.alt='';image.loading='lazy';image.style.cssText='width:42px;height:63px;object-fit:cover;float:left;margin-right:10px;border-radius:4px';image.onerror=()=>{image.hidden=true};link.append(image);}
   const slot=document.createElement('div');slot.className='want-watch-controls';row.append(link,slot);list.append(row);
   root.CinelvaQuickRate?.mountInline(slot,movie);
  }
 }
 root.addEventListener('cinelva-bookmarks-updated',render);
 root.addEventListener('storage',event=>{if(event.key===Bookmarks.KEY||event.key===null)render();});
 root.addEventListener('pageshow',render);
 render();
})(window);
