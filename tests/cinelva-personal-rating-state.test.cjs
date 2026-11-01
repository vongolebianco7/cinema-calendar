const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('js/cinelva-quick-rate.js','utf8');
const start=source.indexOf(' const updatePersonal=()=>{');
const end=source.indexOf('\n const tmdbScore=',start);
function render(record){
 const value={},states={};
 const personal={querySelector:()=>value,classList:{toggle:(key,state)=>states[key]=state},style:{setProperty(){}}};
 vm.runInNewContext(source.slice(start,end)+';updatePersonal();',{personal,controls:{classList:{toggle:(key,state)=>{assert.equal(key,'is-watched');assert.equal(state,Boolean(record&&record.watched!==false));}}},assert,movie:{id:42},viewingRecord:()=>record});
 return {text:value.textContent,unwatched:states['is-unwatched']};
}
test('zero rating remains a watched record, distinct from absent and explicitly unwatched records',()=>{
 assert.deepEqual(render({watched:true,rating:0}),{text:'0.0',unwatched:false});
 assert.deepEqual(render(undefined),{text:'未鑑賞',unwatched:true});
 assert.deepEqual(render({watched:false,rating:4}),{text:'未鑑賞',unwatched:true});
});
test('watched records with no rating do not invent a zero rating',()=>{
 for(const rating of [null,undefined,'',NaN])assert.deepEqual(render({watched:true,rating}),{text:'未評価',unwatched:false});
 assert.deepEqual(render({watched:true,rating:4.1}),{text:'4.1',unwatched:false});
});
test('My Cinelva counts zero-rated and unrated watched records while excluding unwatched rows',()=>{
 const page=fs.readFileSync('js/cinelva-records-page.js','utf8');
 const line=page.split('\n').find(line=>line.includes('const recordMovies ='));
 const state={records:[{id:1,watched:true,rating:0},{id:2,watched:true,rating:null},{id:3,watched:false,rating:4}]};
 const ids=vm.runInNewContext(line+';recordMovies().map(row=>row.id)',{state});
 assert.deepEqual(Array.from(ids),[1,2]);
});
test('award affinity averages retain zero ratings and exclude missing ratings',()=>{
 const page=fs.readFileSync('js/cinelva-records-page.js','utf8');
 const line=page.split('\n').find(line=>line.includes('const scores=[...unique.values()]'));
 const unique=new Map([['1',{id:1}],['2',{id:2}],['3',{id:3}]]);
 const ratingById=new Map([['1',0],['2',4]]);
 const scores=vm.runInNewContext(line+';scores',{unique,ratingById});
 assert.deepEqual(Array.from(scores),[0,4]);
 assert.equal(scores.reduce((a,b)=>a+b,0)/scores.length,2);
});
test('dashboard and director averages include zero without coercing unrated values',()=>{
 const page=fs.readFileSync('js/cinelva-records-page.js','utf8');
 const line=page.split('\n').find(line=>line.includes('const ratingValues ='));
 const records=[0,4,null,undefined,'',NaN,6,-1].map(rating=>({rating}));
 const scores=vm.runInNewContext(line+';ratingValues(records)',{records});
 assert.deepEqual(Array.from(scores),[0,4]);
});
