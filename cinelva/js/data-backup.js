/* Additive, origin-local backup. Existing keys and records are never renamed. */
(function(root){
 'use strict';
 const KEYS = new Set(['cinemap-viewing-records-v1','cinemap-ocean-demo-records-v1','cinemap:ocean:last-shown-growth','cinemap-my-list','cinemap-my-saved-list','cinemap-my-saved-lists','cinemap-my-candidates','cinemap-my-font-style','cinemap-my-cinema-theme','cinemap-my-cinema-background','cinemaNow.mode','cinemaNow.active','cinema-theater-prefecture']);
 const LIMIT=10*1024*1024;
 function inspect(text){
  if(typeof text!=='string'||text.length>LIMIT||new TextEncoder().encode(text).length>LIMIT)throw Error('バックアップは10 MiB以内のJSONを指定してください。');
  const data=JSON.parse(text);
  if(!data||data.format!=='cinemap-backup'||data.version!==1||!data.entries||typeof data.entries!=='object'||Array.isArray(data.entries))throw Error('対応していないバックアップ形式です。');
  for(const [key,value]of Object.entries(data.entries))if(!KEYS.has(key)||typeof value!=='string')throw Error('対応していないデータ項目が含まれています。');
  return data;
 }
 function exportData(storage){
  if(!storage)throw Error('保存領域を利用できません。');
  const entries=Object.create(null);
  for(const key of KEYS){const value=storage.getItem(key);if(value!==null)entries[key]=value;}
  const data={format:'cinemap-backup',version:1,createdAt:new Date().toISOString(),entries};
  inspect(JSON.stringify(data));return data;
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
 root.CinemapBackup={inspect,exportData,restore};
})(typeof window==='undefined'?globalThis:window);
