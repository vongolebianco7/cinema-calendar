/* Additive, origin-local backup. Existing keys and records are never renamed. */
(function(root){
 'use strict';
 const KEYS = new Set(['cinelva-library-records-v2','cinelva-library-deleted-legacy-v1','cinemap-viewing-records-v1','cinemap-ocean-demo-records-v1','cinemap:ocean:last-shown-growth','cinemap-my-list','cinemap-my-saved-list','cinemap-my-saved-lists','cinemap-my-candidates','cinemap-my-font-style','cinemap-my-cinema-theme','cinemap-my-cinema-background','cinemaNow.mode','cinemaNow.active','cinema-theater-prefecture']);
 const LIMIT=10*1024*1024;
 function envelope(text){
  if(typeof text!=='string'||text.length>LIMIT||new TextEncoder().encode(text).length>LIMIT)throw Error('バックアップは10 MiB以内のJSONを指定してください。');
  const data=JSON.parse(text);
  if(!data||data.format!=='cinemap-backup'||data.version!==1||!data.entries||typeof data.entries!=='object'||Array.isArray(data.entries))throw Error('対応していないバックアップ形式です。');
  for(const [key,value]of Object.entries(data.entries))if(!KEYS.has(key)||typeof value!=='string')throw Error('対応していないデータ項目が含まれています。');
  return data;
 }
 const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
 const optionalString=value=>value==null||typeof value==='string';
 function movie(value){
  return object(value)&&['title','director','poster','region','movieComment'].every(key=>optionalString(value[key]))
   &&(value.genres==null||(Array.isArray(value.genres)&&value.genres.every(x=>typeof x==='string')));
 }
 const movies=value=>Array.isArray(value)&&value.every(movie);
 function list(value){
  return object(value)&&(value.picks===undefined||movies(value.picks))
   &&['title','sub','theme','font','format','layout'].every(key=>optionalString(value[key]));
 }
 function validPayload(key,raw){
  if(!['cinelva-library-records-v2','cinelva-library-deleted-legacy-v1','cinemap-viewing-records-v1','cinemap-ocean-demo-records-v1','cinemap:ocean:last-shown-growth','cinemap-my-list','cinemap-my-saved-list','cinemap-my-saved-lists','cinemap-my-candidates'].includes(key))return true;
  let value;try{value=JSON.parse(raw);}catch{return false;}
  if(key==='cinelva-library-records-v2')return object(value)&&Object.entries(value).every(([id,item])=>/^[1-9]\d*$/.test(id)&&movie(item)&&(item.rating===null||typeof item.rating==='number'&&Number.isFinite(item.rating)&&item.rating>=0&&item.rating<=5)&&(item.watchedAt==null||typeof item.watchedAt==='string'));
  if(key==='cinelva-library-deleted-legacy-v1')return Array.isArray(value)&&value.every(id=>/^[1-9]\d*$/.test(String(id)));
  if(key==='cinemap-my-list'||key==='cinemap-my-candidates')return movies(value);
  if(key==='cinemap-my-saved-list')return value===null||list(value);
  if(key==='cinemap-my-saved-lists')return Array.isArray(value)&&value.every(list);
  if(key==='cinemap:ocean:last-shown-growth')return value===null||(object(value)&&(value.stats===undefined||object(value.stats))&&(value.milestone==null||object(value.milestone)));
  return object(value)&&Object.values(value).every(movie);
 }
 function inspect(text){
  const data=envelope(text);
  for(const [key,value]of Object.entries(data.entries))if(!validPayload(key,value))throw Error('保存データの形式が不正です（'+key+'）。既存データは変更していません。');
  return data;
 }
 function exportData(storage){
  if(!storage)throw Error('保存領域を利用できません。');
  const entries=Object.create(null);
  for(const key of KEYS){const value=storage.getItem(key);if(value!==null)entries[key]=value;}
  const data={format:'cinemap-backup',version:1,createdAt:new Date().toISOString(),entries};
  // Export damaged legacy values verbatim for recovery; only import validates payloads.
  envelope(JSON.stringify(data));return data;
 }
 function restore(storage,text){
  const data=inspect(text);if(!storage)throw Error('保存領域を利用できません。');
  const pending=[],written=[];let skipped=0;
  // Read everything before any write, so blocked storage cannot cause a partial import.
  for(const [key,value]of Object.entries(data.entries)){if(storage.getItem(key)!==null)skipped++;else pending.push([key,value]);}
  try{for(const [key,value]of pending){storage.setItem(key,value);written.push(key);}}
  catch(error){let rollbackFailed=false;for(const key of written){try{storage.removeItem(key);}catch{rollbackFailed=true;}}
   throw Error(rollbackFailed?'復元に失敗しました。一部の追加データが残った可能性があります。バックアップを保持してください。':'復元できませんでした。今回追加したデータを取り消しました。既存データとバックアップは保持されています。');}
  return{written:written.length,skipped};
 }

 // Preview and merge ONLY the current My Cinelva record key. Never modify other backup keys.
 const RECORD_KEY='cinelva-library-records-v2';
 const LEGACY_KEY='cinemap-viewing-records-v1';
 function recordMap(raw,label){
  if(raw===null)return {};
  let data;try{data=JSON.parse(raw)}catch{throw Error(label+'を読み取れません。既存データは変更していません。')}
  if(!object(data)||!validPayload(RECORD_KEY,JSON.stringify(data)))throw Error(label+'の形式が不正です。既存データは変更していません。');
  return data;
 }
 function mergePlan(storage,text){
  if(!storage)throw Error('保存領域を利用できません。');
  const data=inspect(text);
  if(!Object.prototype.hasOwnProperty.call(data.entries,RECORD_KEY))throw Error('ファイルにMy Cinelvaの鑑賞記録がありません。');
  const incoming=recordMap(data.entries[RECORD_KEY],'取り込み元の鑑賞記録');
  const existing=recordMap(storage.getItem(RECORD_KEY),'現在の鑑賞記録');
  const legacyRaw=storage.getItem(LEGACY_KEY);
  let legacy={};if(legacyRaw!==null){try{legacy=JSON.parse(legacyRaw)}catch{throw Error('旧鑑賞記録を読み取れません。')};if(!object(legacy))throw Error('旧鑑賞記録の形式が不正です。')}
  const deletedRaw=storage.getItem('cinelva-library-deleted-legacy-v1');
  let deleted=[];if(deletedRaw!==null){try{deleted=JSON.parse(deletedRaw)}catch{throw Error('旧鑑賞記録の削除情報を読み取れません。')};if(!Array.isArray(deleted))throw Error('旧鑑賞記録の削除情報が不正です。')}
  const hidden=new Set(deleted.map(String));
  const existingIds=new Set([...Object.keys(existing),...Object.keys(legacy).filter(id=>!hidden.has(id))]);
  const additions={};let skipped=0;
  for(const [id,record] of Object.entries(incoming)){
   if(existingIds.has(id)){skipped++;continue}
   additions[id]=record;
  }
  return {existing,incoming,additions,added:Object.keys(additions).length,skipped,existingCount:existingIds.size,rawBefore:storage.getItem(RECORD_KEY)};
 }
 function previewRecordMerge(storage,text){
  const p=mergePlan(storage,text);
  return {existing:p.existingCount,incoming:Object.keys(p.incoming).length,added:p.added,skipped:p.skipped};
 }
 function mergeRecords(storage,text){
  const p=mergePlan(storage,text);
  if(!p.added)return {added:0,skipped:p.skipped};
  // Re-read just before writing: reject concurrent modifications instead of overwriting them.
  if(storage.getItem(RECORD_KEY)!==p.rawBefore)throw Error('鑑賞記録が変更されました。再度ファイルを選択してください。');
  const combined={...p.existing,...p.additions};
  try{storage.setItem(RECORD_KEY,JSON.stringify(combined))}
  catch{throw Error('保存できませんでした。元の記録は保持されています。')}
  return {added:p.added,skipped:p.skipped};
 }
 root.CinemapBackup={inspect,exportData,restore,previewRecordMerge,mergeRecords};
})(typeof window==='undefined'?globalThis:window);
