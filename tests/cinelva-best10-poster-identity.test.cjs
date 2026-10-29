const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const html=fs.readFileSync('my-best10.html','utf8');
const source=html.slice(html.indexOf('const best10PosterUrl='),html.indexOf('window.hydrateBest10Posters='));
async function hydrate(picks,catalog,detail){
 const calls=[],saved=[];
 const context={picks,best10Catalog:async()=>catalog,best10Normalize:s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[\s・･]/g,''),API:'https://example.test',fetch:async url=>{calls.push(url);return {ok:true,json:async()=>({movie:detail})}},localStorage:{setItem:(key,value)=>saved.push({key,value})},render(){}};
 vm.createContext(context);vm.runInContext(source,context);await vm.runInContext('hydrateBest10Posters()',context);return {picks,calls,saved};
}
const fight={id:550,tmdbId:550,title:'ファイト・クラブ',year:1999,poster:'/fight.jpg'};
test('Best10 local/import record IDs cannot identify unrelated poster or detail lookup',async()=>{
 const result=await hydrate([{id:550,title:'別の映画',year:2026}], [fight],fight);
 assert.equal(result.picks[0].poster,undefined);assert.equal(result.calls.length,0);assert.equal(result.saved.length,0);
});
test('Best10 rejects conflicting explicit TMDB identity metadata',async()=>{
 const result=await hydrate([{id:'local',tmdbId:550,title:'別の映画',year:2026}],[fight],fight);
 assert.equal(result.picks[0].poster,undefined);assert.equal(result.saved.length,0);
});
test('Best10 resolves one exact catalog title/year without treating local ID as TMDB',async()=>{
 const result=await hydrate([{id:'local-1',title:fight.title,year:1999}],[fight],fight);
 assert.equal(result.picks[0].poster,'https://image.tmdb.org/t/p/w342/fight.jpg');assert.equal(result.calls.length,0);
});
test('Best10 remote fallback requires explicit ID plus corroborating title/year',async()=>{
 const result=await hydrate([{id:'local',tmdbId:550,title:fight.title,year:1999}],[],fight);
 assert.equal(result.calls.length,1);assert.equal(result.picks[0].poster,'https://image.tmdb.org/t/p/w342/fight.jpg');
});
test('Best10 ambiguous title/year catalog matches remain unresolved',async()=>{
 const result=await hydrate([{id:'local',title:fight.title,year:1999}],[fight,{...fight,id:551,tmdbId:551,poster:'/other.jpg'}],fight);
 assert.equal(result.picks[0].poster,undefined);assert.equal(result.saved.length,0);
});
