const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const path=require('node:path').resolve(__dirname,'..',process.env.CINELVA_BACKUP_MODULE||'js/data-backup.js');
function setup(initial={},failure=null){const map=new Map(Object.entries(initial));const storage={get length(){return map.size},key:i=>[...map.keys()][i],getItem:k=>map.get(k)??null,setItem(k,v){if(k===failure)throw Error('quota');map.set(k,v)},removeItem:k=>map.delete(k)};const ctx={globalThis:{},TextEncoder,Date,JSON,Object,Error,Set};vm.runInNewContext(fs.readFileSync(path,'utf8'),ctx);return{api:ctx.globalThis.CinemapBackup,storage,map}}
test('backup module is available',()=>assert.ok(fs.existsSync(path),'missing data-backup.js'));
if(fs.existsSync(path)){
test('round trip preserves raw records, lists, Ocean and settings; excludes unrelated data',()=>{const original={'cinemap-viewing-records-v1':'{"10":{"watched":true,"rating":4.2,"resonated":true}}','cinemap-my-list':'[{"title":"映画"}]','cinemap:ocean:last-shown-growth':'{"stats":{"watched":600}}','cinemaNow.mode':'streaming','unrelated-secret':'private'};const s=setup(original);const data=s.api.exportData(s.storage);assert.equal(data.entries['unrelated-secret'],undefined);const target=setup();assert.equal(target.api.restore(target.storage,JSON.stringify(data)).written,4);for(const [k,v]of Object.entries(original))if(k!=='unrelated-secret')assert.equal(target.map.get(k),v)});
test('conflicts are skipped; unrelated and newer destination data stay intact',()=>{const s=setup({'cinemap-my-list':'new','unrelated':'safe'});const input={format:'cinemap-backup',version:1,entries:{'cinemap-my-list':'[{"title":"old"}]','cinemap-my-candidates':'[]'}};const result=s.api.restore(s.storage,JSON.stringify(input));assert.equal(result.skipped,1);assert.equal(s.map.get('cinemap-my-list'),'new');assert.equal(s.map.get('unrelated'),'safe')});
test('malformed, unknown and prototype keys cannot write any data',()=>{for(const entries of [{'cinemap-my-list':[]},{'token':'x'},JSON.parse('{"__proto__":"x"}')]){const s=setup();assert.throws(()=>s.api.restore(s.storage,JSON.stringify({format:'cinemap-backup',version:1,entries})));assert.equal(s.map.size,0)}});
test('future versions, missing entries and oversize payload are rejected',()=>{const s=setup();for(const input of ['{',JSON.stringify({format:'cinemap-backup',version:9,entries:{}}),JSON.stringify({format:'cinemap-backup',version:1}), ' '.repeat(10*1024*1024+1)])assert.throws(()=>s.api.restore(s.storage,input));assert.equal(s.map.size,0)});
test('quota failure rolls back only this attempt; existing data survives',()=>{const s=setup({'cinemap-my-list':'saved'},'cinemap-my-candidates');assert.throws(()=>s.api.restore(s.storage,JSON.stringify({format:'cinemap-backup',version:1,entries:{'cinemaNow.mode':'streaming','cinemap-my-candidates':'[]'}})));assert.equal(s.map.size,1);assert.equal(s.map.get('cinemap-my-list'),'saved')});
test('export fails visibly when browser storage is unavailable',()=>{const s=setup();assert.throws(()=>s.api.exportData(null))});
test('invalid stored JSON shapes reject the entire import before any writes',()=>{
 const invalid={
  'cinemap-my-candidates':['[null]','{}','["movie"]'],
  'cinemap-my-list':['null','[null]','[{"genres":{}}]'],
  'cinemap-my-saved-list':['[]','{"picks":[null]}'],
  'cinemap-my-saved-lists':['[null]','[{"picks":{}}]'],
  'cinemap-viewing-records-v1':['[]','{"10":null}','{"10":{"genres":"SF"}}'],
  'cinemap-ocean-demo-records-v1':['{"10":false}'],
  'cinemap:ocean:last-shown-growth':['[]','{"stats":[]}'],
 };
 for(const [key,values]of Object.entries(invalid))for(const value of values){
  const s=setup({'cinemap-my-font-style':'modern'});
  assert.throws(()=>s.api.restore(s.storage,JSON.stringify({format:'cinemap-backup',version:1,entries:{'cinemaNow.mode':'streaming',[key]:value}})),undefined,key+' '+value);
  assert.equal(s.map.size,1,'no valid earlier key may be partially written');
 }
});
test('export preserves damaged existing raw data for recovery without silently importing it',()=>{
 const s=setup({'cinemap-my-candidates':'[null]'});
 assert.equal(s.api.exportData(s.storage).entries['cinemap-my-candidates'],'[null]');
 assert.throws(()=>s.api.inspect(JSON.stringify(s.api.exportData(s.storage))));
});
test('backup round trip preserves unrated records and legacy deletion markers',()=>{
 const original={
  'cinelva-library-records-v2':JSON.stringify({'42':{id:'42',title:'未評価作品',rating:null,watchedAt:'2026-10'}}),
  'cinelva-library-deleted-legacy-v1':'["7"]',
 };
 const source=setup(original),payload=source.api.exportData(source.storage),target=setup();
 target.api.restore(target.storage,JSON.stringify(payload));
 for(const [key,value]of Object.entries(original))assert.equal(target.map.get(key),value);
});
}
test('bookmark backup preserves raw legacy values and unknown fields without changing viewing records',()=>{
 const original={'cinelva-want-to-watch-v1':JSON.stringify({900:{id:900,title:'旧ブックマーク',savedAt:'2020',extra:{keep:true}}}),'cinelva-library-records-v2':JSON.stringify({900:{id:900,tmdbId:42,title:'映画',rating:4,watchedAt:null}})};
 const s=setup(original),payload=s.api.exportData(s.storage),target=setup();
 assert.equal(payload.entries['cinelva-want-to-watch-v1'],original['cinelva-want-to-watch-v1']);
 s.api.inspect(JSON.stringify(payload));target.api.restore(target.storage,JSON.stringify(payload));
 for(const [key,value]of Object.entries(original))assert.equal(target.map.get(key),value);
});
test('invalid bookmark backups are rejected before any storage writes',()=>{
 for(const raw of ['{','[]','null','{"42":null}','{"42":{"id":"bad"}}']){
  const s=setup({'cinelva-want-to-watch-v1':'{"7":{"id":7,"title":"safe"}}'});
  assert.throws(()=>s.api.restore(s.storage,JSON.stringify({format:'cinemap-backup',version:1,entries:{'cinelva-want-to-watch-v1':raw}})));
  assert.equal(s.map.get('cinelva-want-to-watch-v1'),'{"7":{"id":7,"title":"safe"}}');
 }
});
