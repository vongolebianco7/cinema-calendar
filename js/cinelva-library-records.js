/* My Cinelva versioned records. Does not modify the existing Ocean record key. */
(function(root) {
  'use strict';
  const KEY='cinelva-library-records-v2';
  const LEGACY='cinemap-viewing-records-v1';
  const DELETED='cinelva-library-deleted-legacy-v1';
  const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
  const validId=id=>/^[1-9]\d*$/.test(String(id));
  const validScore=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=5&&Math.round(value*10)===value*10;
  const validDate=value=>{
    if(value===null) return true;
    if(typeof value!=='string'||!/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(value)) return false;
    const [y,m,d]=value.split('-').map(Number);
    if(y<1||y>9999) return false;
    if(m===undefined) return true;
    if(m<1||m>12) return false;
    if(d===undefined) return true;
    const last=new Date(Date.UTC(y, m, 0)).getUTCDate();
    return d>=1&&d<=last;
  };
  function storage() {
    const s=root.localStorage;
    if(!s||typeof s.getItem!=='function'||typeof s.setItem!=='function') throw new Error('ブラウザの保存領域を利用できません');
    return s;
  }
  function parseMap(raw,label) {
    if(raw===null) return {};
    let parsed;
    try { parsed=JSON.parse(raw); } catch { throw new Error(label+'の保存データを読み取れません'); }
    if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)) throw new Error(label+'の保存形式が不正です');
    return parsed;
  }
  function load() { return parseMap(storage().getItem(KEY),'My Cinelva'); }
  function legacy() { return parseMap(storage().getItem(LEGACY),'旧鑑賞記録'); }
  function deleted() {
    const raw=storage().getItem(DELETED);
    if(raw===null)return [];
    let parsed;try{parsed=JSON.parse(raw);}catch{throw new Error('旧鑑賞記録の削除情報を読み取れません');}
    if(!Array.isArray(parsed)||parsed.some(id=>!validId(id)))throw new Error('旧鑑賞記録の削除情報が不正です');
    return parsed.map(String);
  }
  function all() {
    const current=load(), older=legacy(), hidden=new Set(deleted()), output=[];
    for(const [id, old] of Object.entries(older)) {
      if(!validId(id)||hidden.has(id)||!old||typeof old!=='object'||Array.isArray(old)) continue;
      if(own(current,id)) continue;
      output.push({...old,id,title:String(old.title||''),poster:String(old.poster||''),year:old.year||null,
        director:String(old.director||''),genres:Array.isArray(old.genres)?old.genres:[],
        region:String(old.region||''),rating:validScore(old.rating)?old.rating:null,
        watchedAt:validDate(old.watchedAt)?old.watchedAt:null,legacy:true,watched:!!old.watched});
    }
    for(const [id,entry] of Object.entries(current)) {
      if(!validId(id)||!entry||typeof entry!=='object'||Array.isArray(entry)) continue;
      output.push({...entry,id,legacy:false});
    }
    return output;
  }
  function recordValue(movie,rating,watchedAt,current,older) {
    const id=String(movie?.id??movie?.tmdbId??'');
    if(!validId(id)||!(rating===null||validScore(rating))) throw new Error('作品IDまたは評価が不正です');
    for(const field of ['genres','countries','formats','workForms'])if(movie[field]!=null&&!Array.isArray(movie[field]))throw new Error('分類メタデータの形式が不正です');
    for(const field of ['countries','formats','workForms'])if(Array.isArray(movie[field])&&movie[field].some(value=>typeof value!=='string'))throw new Error('分類メタデータの値が不正です');
    const old=current[id]||{}, source=older[id]||{};
    const date=watchedAt===undefined?(old.watchedAt??source.watchedAt??null):watchedAt;
    if(!validDate(date)) throw new Error('鑑賞日の形式が不正です');
    const now=new Date().toISOString();
    return {...source,...old,...movie,id,title:String(movie.title??old.title??source.title??'').slice(0,160),
      poster:String(movie.poster??old.poster??source.poster??'').slice(0,500),
      director:String(movie.director??old.director??source.director??'').slice(0,120),
      genres:Array.isArray(movie.genres)?movie.genres.slice(0,12):(old.genres??source.genres??[]),
      countries:Array.isArray(movie.countries)?movie.countries.slice(0,20):(old.countries??source.countries??[]),
      rating,watchedAt:date,watched:movie.watched!==false,legacy:false,createdAt:old.createdAt||source.createdAt||now,updatedAt:now};
  }
  function writeRecords(next,hidden) {
    const area=storage(), priorDeleted=area.getItem(DELETED), nextDeleted=JSON.stringify(hidden);
    let changed=false;
    if(nextDeleted!==JSON.stringify(deleted())) { area.setItem(DELETED,nextDeleted); changed=true; }
    try { area.setItem(KEY,JSON.stringify(next)); }
    catch(error) { if(changed){if(priorDeleted===null&&typeof area.removeItem==='function')area.removeItem(DELETED);else area.setItem(DELETED,priorDeleted??'[]');} throw error; }
  }
  function save(movie,rating,watchedAt) {
    const current=load(), value=recordValue({...movie,watched:true},rating,watchedAt,current,legacy());
    writeRecords({...current,[value.id]:value},deleted().filter(id=>id!==value.id));
    return value;
  }
  function saveUnrated(movie,watchedAt) { return save(movie,null,watchedAt); }
  function restore(rows) {
    if(!Array.isArray(rows)||rows.length>10000)throw new Error('復元する記録の形式・件数が不正です');
    const current=load(), older=legacy(), next={...current}, ids=new Set();
    for(const row of rows) {
      if(!row||typeof row!=='object'||Array.isArray(row)||typeof row.title!=='string')throw new Error('作品データが不正です');
      const value=recordValue(row,row.rating??null,row.watchedAt??null,current,older);
      if(ids.has(value.id))throw new Error('同じ作品IDが重複しています');
      ids.add(value.id); next[value.id]=value;
    }
    writeRecords(next,deleted().filter(id=>!ids.has(id)));
    return rows.length;
  }
  function remove(id) {
    id=String(id);
    if(!validId(id)) throw new Error('作品IDが不正です');
    const current=load();
    const old=legacy();
    if(!own(current,id)&&!own(old,id)) return false;
    const storageArea=storage();
    const priorDeleted=storageArea.getItem(DELETED);
    const hidden=new Set(deleted());
    if(own(old,id))hidden.add(id);else hidden.delete(id);
    storageArea.setItem(DELETED,JSON.stringify([...hidden]));
    const next={...current};
    delete next[id];
    try{storageArea.setItem(KEY,JSON.stringify(next));}
    catch(error){if(priorDeleted===null){if(typeof storageArea.removeItem==='function')storageArea.removeItem(DELETED);else storageArea.setItem(DELETED,'[]');}else storageArea.setItem(DELETED,priorDeleted);throw error;}
    return true;
  }
  function summary(records,year,month) {
    const watched=records.filter(r=>r.watched!==false), prefix=String(year), monthPrefix=prefix+'-'+String(month).padStart(2,'0');
    return {total:watched.length,year:watched.filter(r=>typeof r.watchedAt==='string'&&r.watchedAt.slice(0,4)===prefix).length,
      month:watched.filter(r=>typeof r.watchedAt==='string'&&r.watchedAt.slice(0,7)===monthPrefix).length,
      unknownDate:watched.filter(r=>!r.watchedAt).length,legacyUnrated:records.filter(r=>r.legacy&&r.watched&&r.rating===null).length};
  }
  const api={KEY,LEGACY,DELETED,all,save,saveUnrated,restore,remove,summary,validDate,validScore};
  root.CinelvaLibraryRecords=api;
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
})(typeof window==='undefined'?globalThis:window);
