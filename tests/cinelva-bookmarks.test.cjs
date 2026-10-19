const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(seed={}){
 const values=new Map(Object.entries(seed)),writes=[],events=[];
 const root={localStorage:{getItem:k=>values.get(k)??null,setItem(k,v){writes.push(k);values.set(k,v);}},dispatchEvent:e=>events.push(e)};
 const source=fs.existsSync('js/cinelva-bookmarks.js')?fs.readFileSync('js/cinelva-bookmarks.js','utf8'):'';
 vm.runInNewContext(source,{window:root,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},Date});
 assert.ok(root.CinelvaBookmarks,'shared bookmark API is available');
 return {api:root.CinelvaBookmarks,root,values,writes,events};
}
const KEY='cinelva-want-to-watch-v1';
test('toggle never changes viewing records, ratings, legacy keys or unrelated bookmarks',()=>{
 const record=JSON.stringify({900:{id:900,tmdbId:42,rating:4.3,watched:true,watchedAt:'2025-01',comment:'preserve',extra:{a:1}}});
 const legacy=JSON.stringify({12:{watched:false,rating:0}}),old={7:{id:7,title:'old',extra:'keep',savedAt:'2020'}};
 const s=setup({[KEY]:JSON.stringify(old),'cinelva-library-records-v2':record,'cinemap-viewing-records-v1':legacy});
 assert.equal(s.api.toggle({id:900,tmdbId:42,title:'映画'}),true);
 assert.equal(s.api.has({id:42}),true);assert.equal(s.api.has({id:900,tmdb_id:42,title:'旧作品'}),true);
 assert.deepEqual(JSON.parse(s.values.get(KEY))['7'],old[7]);
 assert.equal(s.api.toggle({id:42}),false);
 assert.equal(s.values.get('cinelva-library-records-v2'),record);assert.equal(s.values.get('cinemap-viewing-records-v1'),legacy);
 assert.ok(s.writes.every(k=>k===KEY));assert.equal(s.events.length,2);
});
test('old local-ID bookmarks resolve through record aliases and remove without duplicates',()=>{
 const old={900:{id:'900',title:'旧作品',savedAt:'2020',custom:'preserve'},7:{id:7,title:'other'}};
 const s=setup({[KEY]:JSON.stringify(old),'cinelva-library-records-v2':JSON.stringify({900:{id:900,tmdb_id:42,title:'旧作品'}})});
 assert.equal(s.api.has({id:42}),true);assert.equal(s.api.all()[0].tmdbId,'42');
 assert.equal(s.values.get(KEY),JSON.stringify(old),'reading does not migrate stored data');
 assert.equal(s.api.toggle({id:42}),false);assert.deepEqual(Object.keys(JSON.parse(s.values.get(KEY))),['7']);
});
test('corrupt or unavailable storage is never replaced with empty data',()=>{
 for(const raw of ['{broken','[]','null']){const s=setup({[KEY]:raw});assert.throws(()=>s.api.toggle({id:42}));assert.equal(s.values.get(KEY),raw);assert.equal(s.events.length,0);}
 const s=setup();s.root.localStorage.setItem=()=>{throw Error('quota');};assert.throws(()=>s.api.toggle({id:42}));assert.equal(s.events.length,0);
});
test('invalid explicit film identity is rejected and unknown fields survive reads',()=>{
 const s=setup({[KEY]:JSON.stringify({42:{id:42,title:'映画',custom:7}})});
 assert.throws(()=>s.api.toggle({id:42,tmdbId:'bad'}));assert.equal(s.api.all()[0].custom,7);
 assert.equal(s.api.has({id:43}),false);
});
test('two tabs read latest storage before every toggle',()=>{
 const s=setup();s.api.toggle({id:42,title:'A'});const data=JSON.parse(s.values.get(KEY));data[7]={id:7,title:'B'};s.values.set(KEY,JSON.stringify(data));
 s.api.toggle({id:42});assert.ok(JSON.parse(s.values.get(KEY))[7]);
});
test('explicit TMDB identity does not alias a different films local record ID',()=>{
 const s=setup({'cinelva-library-records-v2':JSON.stringify({42:{id:42,tmdbId:77}})});
 s.api.toggle({id:900,tmdbId:42,title:'canonical 42'});
 assert.equal(s.api.has({id:42,tmdbId:42}),true);assert.equal(s.api.has({id:42}),true);
 assert.equal(s.api.has({id:42,tmdbId:77}),false);
});
test('new bookmarks store film metadata without copying viewing state or review snapshots',()=>{
 const s=setup();s.api.toggle({id:42,title:'film',poster:'https://example.com/poster.jpg',rating:4,watched:true,comment:'private',viewingMethod:'映画館'});
 const row=JSON.parse(s.values.get(KEY))[42];assert.equal(row.title,'film');assert.equal(row.rating,undefined);assert.equal(row.watched,undefined);assert.equal(row.comment,undefined);
});
test('old canonical bookmark is not reassigned to an unrelated imported local ID collision',()=>{
 const s=setup({[KEY]:JSON.stringify({42:{id:42,title:'Film A',custom:'keep'}}),'cinelva-library-records-v2':JSON.stringify({42:{id:42,tmdbId:77,title:'Film B'}})});
 assert.equal(s.api.has({id:42}),true);assert.equal(s.api.has({id:77}),false);assert.equal(s.api.all()[0].tmdbId,'42');
 s.api.toggle({id:77,title:'Film B'});assert.equal(JSON.parse(s.values.get(KEY))[42].custom,'keep');
});
