const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('js/cinelva-quick-rate.js','utf8');
function harness(initial){
 let records=initial;
 const start=source.indexOf('let localRecordIndexSource=')>=0?source.indexOf('let localRecordIndexSource='):source.indexOf('function viewingRecord(');
 const ctx={root:{},canonicalId:m=>m.tmdbId||m.id,allRecords:()=>records};vm.createContext(ctx);
 vm.runInContext(source.slice(start,source.indexOf('function open(movie,')),ctx);
 return {find:m=>ctx.viewingRecord(m),replace:next=>{records=next}};
}
test('large local review lists build identity index once instead of rescanning each card',()=>{
 let reads=0;const records=Array.from({length:1000},(_,i)=>({get id(){reads++;return String(i)},rating:4}));
 const api=harness(records);
 for(let i=0;i<1000;i++)assert.equal(api.find({_localRecord:true,id:String(i)}),records[i]);
 assert.ok(reads<=3000,'1000 lookups should need linear identity reads; got '+reads);
});
test('local review index invalidates on new canonical records and keeps first duplicate semantics',()=>{
 const first={id:'1',rating:3},second={id:'1',rating:4};const api=harness([first,second]);
 assert.equal(api.find({_localRecord:true,id:'1'}),first);
 const edited={id:'1',rating:5};api.replace([edited]);assert.equal(api.find({_localRecord:true,id:'1'}),edited);
 api.replace([]);assert.equal(api.find({_localRecord:true,id:'1'}),undefined);
});
test('verified TMDB and unverified legacy identities retain existing safeguards',()=>{
 const remote={id:'local',tmdbId:550,title:'Film',year:1999},legacy={id:42,title:'Other',year:2000};const api=harness([remote,legacy]);
 assert.equal(api.find({id:550,title:'Film',year:1999}),remote);
 assert.equal(api.find({id:42,title:'Wrong',year:2000}),undefined);
 assert.equal(api.find({id:42,title:'Other',year:2000}),legacy);
});
