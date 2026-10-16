/* My Cinelva versioned records. Does not modify the existing Ocean record key. */
(function(root) {
  'use strict';
  const KEY='cinelva-library-records-v2';
  const LEGACY='cinemap-viewing-records-v1';
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
  function all() {
    const current=load(), older=legacy(), output=[];
    for(const [id, old] of Object.entries(older)) {
      if(!validId(id)||!old||typeof old!=='object'||Array.isArray(old)) continue;
      if(own(current,id)) continue;
      output.push({id,title:String(old.title||''),poster:String(old.poster||''),year:old.year||null,
        director:String(old.director||''),genres:Array.isArray(old.genres)?old.genres:[],
        region:String(old.region||''),rating:validScore(old.rating)?old.rating:null,
        watchedAt:null,legacy:true,watched:!!old.watched});
    }
    for(const [id,entry] of Object.entries(current)) {
      if(!validId(id)||!entry||typeof entry!=='object'||Array.isArray(entry)) continue;
      output.push({...entry,id,legacy:false});
    }
    return output;
  }
  function save(movie,rating,watchedAt) {
    const id=String(movie?.tmdbId??movie?.id??'');
    if(!validId(id)||!validScore(rating)) throw new Error('作品IDまたは評価が不正です');
    const current=load(), old=current[id]||{}, source=legacy()[id]||{};
    const date=watchedAt===undefined?(old.watchedAt??null):watchedAt;
    if(!validDate(date)) throw new Error('鑑賞日の形式が不正です');
    const now=new Date().toISOString();
    const value={...old,id,title:String(movie.title??old.title??source.title??'').slice(0,160),
      poster:String(movie.poster??old.poster??source.poster??'').slice(0,500),
      year:movie.year??old.year??source.year??null,
      director:String(movie.director??old.director??source.director??'').slice(0,120),
      genres:Array.isArray(movie.genres)?movie.genres.slice(0,12):(old.genres??source.genres??[]),
      region:String(movie.region??old.region??source.region??'').slice(0,60),
      rating,watchedAt:date,createdAt:old.createdAt||now,updatedAt:now};
    const next={...current,[id]:value};
    storage().setItem(KEY,JSON.stringify(next));
    return value;
  }
  function remove(id) {
    id=String(id);
    if(!validId(id)) throw new Error('作品IDが不正です');
    const current=load();
    if(!own(current,id)) return false;
    const next={...current};
    delete next[id];
    storage().setItem(KEY,JSON.stringify(next));
    return true;
  }
  function summary(records,year,month) {
    const rated=records.filter(r=>validScore(r.rating));
    const prefix=String(year);
    const monthPrefix=prefix+'-'+String(month).padStart(2,'0');
    return {total:rated.length,year:rated.filter(r=>typeof r.watchedAt==='string'&&r.watchedAt.slice(0,4)===prefix).length,
      month:rated.filter(r=>typeof r.watchedAt==='string'&&r.watchedAt.slice(0,7)===monthPrefix).length,
      unknownDate:rated.filter(r=>!r.watchedAt).length,legacyUnrated:records.filter(r=>r.legacy&&r.watched&&r.rating===null).length};
  }
  root.CinelvaLibraryRecords={KEY,all,save,remove,summary,validDate,validScore};
})(typeof window==='undefined'?globalThis:window);
