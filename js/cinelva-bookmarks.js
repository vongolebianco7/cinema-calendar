/* Independent local bookmark store. Existing keys and payloads remain compatible. */
(function(root){
 'use strict';
 const KEY='cinelva-want-to-watch-v1';
 const valid=id=>/^[1-9]\d*$/.test(String(id??''));
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 function identity(movie){
  const id=typeof movie==='object'&&movie!==null?(movie.tmdbId??movie.tmdb_id??movie.id):movie;
  if(!valid(id))throw Error('作品IDを確認できません');
  return String(id);
 }
 function read(key){
  const raw=root.localStorage.getItem(key);if(raw===null)return {};
  let data;try{data=JSON.parse(raw);}catch{throw Error('保存データを読み取れません。バックアップを確認してください');}
  if(!data||typeof data!=='object'||Array.isArray(data))throw Error('保存データの形式を確認してください');
  return data;
 }
 function aliases(){
  // Resolve historical local record IDs without mutating either record store.
  const map=new Map();
  for(const key of ['cinemap-viewing-records-v1','cinelva-library-records-v2']){
   let records;try{records=read(key);}catch{continue;}
   for(const [key,row] of Object.entries(records)){
    if(!row||typeof row!=='object')continue;
    const explicit=row.tmdbId??row.tmdb_id;
    if(valid(explicit)){if(valid(row.id))map.set(String(row.id),String(explicit));if(valid(key))map.set(String(key),String(explicit));}
   }
  }
  return map;
 }
 function matchingKeys(data,movie){
  const id=identity(movie),map=aliases();
  const canonical=id;
  return Object.keys(data).filter(key=>{
   const row=data[key];const explicit=row&&typeof row==='object'?(row.tmdbId??row.tmdb_id):null;
   const candidate=explicit??(row&&typeof row==='object'?row.id:null)??key;
   return valid(candidate)&&(explicit!=null?String(candidate):(map.get(String(candidate))||String(candidate)))===canonical;
  });
 }
 function has(movie){return matchingKeys(read(KEY),movie).length>0;}
 function all(){
  const data=read(KEY),map=aliases(),seen=new Set(),rows=[];
  for(const [key,row] of Object.entries(data)){
   if(!row||typeof row!=='object'||Array.isArray(row))continue;
   const source=row.tmdbId??row.tmdb_id??row.id??key;if(!valid(source))continue;
   const id=(row.tmdbId??row.tmdb_id)!=null?String(source):(map.get(String(source))||String(source));
   if(seen.has(id))continue;seen.add(id);rows.push({...row,id:row.id??key,tmdbId:id});
  }
  return rows.sort((a,b)=>String(b.savedAt||'').localeCompare(String(a.savedAt||'')));
 }
 function toggle(movie){
  const id=identity(movie),data=read(KEY),keys=matchingKeys(data,movie),marked=keys.length===0;
  if(marked){const canonical=id;
   if(own(data,canonical))throw Error('保存済み作品IDが一致しません');
   const metadata={};for(const key of ['year','original_title','poster','poster_url','poster_path','director','genres','countries','runtime'])if(movie[key]!==undefined)metadata[key]=movie[key];
   data[canonical]={...metadata,id:canonical,tmdbId:canonical,title:movie.title||movie.name||'作品',savedAt:new Date().toISOString()};
  }else for(const key of keys)delete data[key];
  root.localStorage.setItem(KEY,JSON.stringify(data));
  root.dispatchEvent(new CustomEvent('cinelva-bookmarks-updated',{detail:{id,marked}}));
  return marked;
 }
 const bindings=new WeakMap();
 function sync(button,movie){
  try{const marked=has(movie),label=marked?'見たい映画から解除':'見たい映画に保存';
   button.classList.toggle('is-bookmarked',marked);button.setAttribute('aria-pressed',String(marked));button.setAttribute('aria-label',label+'：'+(movie.title||movie.name||'作品'));button.title=label;
  }catch(error){button.setAttribute('aria-label',error.message);}
 }
 function bind(button,movie){
  bindings.set(button,movie);sync(button,movie);
  button.onclick=event=>{event.preventDefault();event.stopPropagation();try{toggle(movie);}catch(error){button.setAttribute('aria-label','保存できません：'+error.message);button.title=error.message;}};
  return button;
 }
 function refresh(){
  if(!root.document)return;
  root.document.querySelectorAll('[data-bookmark-id]').forEach(button=>{const movie=bindings.get(button);if(movie)sync(button,movie);});
 }
 if(root.addEventListener){root.addEventListener('cinelva-bookmarks-updated',refresh);root.addEventListener('storage',event=>{if(event.key===KEY||event.key===null)refresh();});root.addEventListener('pageshow',refresh);}
 root.CinelvaBookmarks={KEY,identity,all,has,toggle,bind};
})(typeof window==='undefined'?globalThis:window);
