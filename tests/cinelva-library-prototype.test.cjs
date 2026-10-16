const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('preview/my-cinelva/index.html','utf8');
const context={};vm.createContext(context);vm.runInContext(html.match(/<script id="demo-model">([\s\S]*?)<\/script>/)[1],context);
const M=context.CinelvaDemo;
const movie={id:1,title:'デモ',year:2001,countries:['Japan','France'],director:'監督'};
test('partial dates contribute only to known periods',()=>{
 const rs=[null,'2026','2026-10','2026-10-16'].map((date,i)=>({...movie,id:i+1,rating:0,watchedAt:date}));
 const s=M.stats(rs,2026,10);assert.equal(s.total,4);assert.equal(s.year,3);assert.equal(s.month,2);assert.equal(s.days['2026-10-16'],1);assert.equal(s.unknownDate,1);
});
test('score zero is rated and editing preserves title count and date',()=>{
 let rs=M.upsert([],movie,0,null);assert.equal(rs.length,1);assert.equal(rs[0].rating,0);
 rs=M.upsert(rs,movie,4.2,undefined);assert.equal(rs.length,1);assert.equal(rs[0].rating,4.2);assert.equal(rs[0].watchedAt,null);
});
test('invalid scores and dates reject before changing input',()=>{
 for(const score of [-1,5.1,NaN,1.11])assert.throws(()=>M.upsert([],movie,score,null));
 for(const date of ['2026-02-30','2026-13','bad'])assert.throws(()=>M.upsert([],movie,4,date));
});
test('co-productions count once overall and in each country',()=>{
 const s=M.stats([{...movie,rating:4,watchedAt:null}],2026,10);assert.equal(s.total,1);assert.equal(s.japan,1);assert.equal(s.foreign,0);assert.equal(s.countries.Japan,1);assert.equal(s.countries.France,1);
});
test('unrated and duplicate movie records do not inflate statistics',()=>{
 const s=M.stats([{...movie,rating:null},{...movie,rating:4},{...movie,rating:5}],2026,10);assert.equal(s.total,1);
});
test('empty statistics and filters remain usable',()=>{
 assert.equal(M.stats([],2026,10).total,0);assert.equal(M.filter([],{country:'Japan'}).length,0);
 const rs=[{...movie,rating:4,watchedAt:'2026'}];assert.equal(M.filter(rs,{country:'France',decade:2000}).length,1);assert.equal(M.filter(rs,{month:'2026-10'}).length,0);
});
test('demo presets produce exactly the requested unique records',()=>{
 for(const n of [0,5,20,200,1000]){const rs=M.makeDemo(n,[movie]);assert.equal(rs.length,n);assert.equal(M.stats(rs,2026,10).total,n);}
});
test('prototype cannot touch real browser data',()=>{
 assert.doesNotMatch(html,/\b(localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest)\s*[.(]/);assert.match(html,/デモ/);
});
test('atlas genre groups preserve overlap without inventing records',()=>{
 const rs=[{...movie,rating:4,genres:['SF','ドラマ','SF']}];
 assert.equal(M.filter(rs,{genre:'SF'}).length,1);assert.equal(M.filter(rs,{genre:'ホラー'}).length,0);
 const groups=M.atlasGroups(rs,'genre');assert.equal(groups.SF,1);assert.equal(groups['ドラマ'],1);
});
test('award atlas counts winners only and filters by organization',()=>{
 const rs=[{...movie,rating:4,awards:[{organization:'A',result:'winner'},{organization:'A',result:'winner'}]},{...movie,id:2,rating:3,awards:[{organization:'B',result:'nominee'}]}];
 assert.equal(M.atlasGroups(rs,'award').A,1);assert.equal(M.atlasGroups(rs,'award').B,undefined);
 assert.equal(M.filter(rs,{awardOrg:'A'}).length,1);assert.equal(M.filter(rs,{awardOrg:'B'}).length,0);
});
