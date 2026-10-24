const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('movie grid sorter includes ranking review wrappers and concrete sort labels',()=>{
 const source=fs.readFileSync('js/movie-grid-sort.js','utf8');
 assert.ok(source.includes('.rankReviewWrap'));
 assert.ok(!source.includes('ランキング順')&&!source.includes('元の表示順'));
});
test('bookmark sort is deterministic and leaves saved input unchanged',()=>{
 const html=fs.readFileSync('my-cinelva/index.html','utf8');
 const part=html.match(/function sortedBookmarks\(entries,order\)\{[\s\S]*?\n\}/)?.[0];
 assert.ok(part,'bookmark sorting is available');
 const ctx={};vm.runInNewContext(part+';globalThis.sort=sortedBookmarks;',ctx);
 const rows=[{id:1,title:'B',year:2020,savedAt:'2024-02-01'},{id:2,title:'A',year:2024,savedAt:'2024-01-01'},{id:3,title:'C'}],before=JSON.stringify(rows);
 assert.deepEqual(Array.from(ctx.sort(rows,'title'),x=>x.id),[2,1,3]);
 assert.deepEqual(Array.from(ctx.sort(rows,'releaseNew'),x=>x.id),[2,1,3]);
 assert.deepEqual(Array.from(ctx.sort(rows,'releaseOld'),x=>x.id),[1,2,3]);
 assert.deepEqual(Array.from(ctx.sort(rows,'savedNew'),x=>x.id),[1,2,3]);
 assert.equal(JSON.stringify(rows),before);
});
test('box office lookup never replaces a supplied ID with a same-title remake',async()=>{
 const html=fs.readFileSync('rankings.html','utf8');const body=html.slice(html.indexOf('async function resolveMovie('),html.indexOf('async function hydrateOneBoxCard('));
 const ctx={movieLookupCache:new Map(),normalizeBoxTitle:s=>String(s).toLowerCase(),window:{},localBoxMovies:async()=>[{id:2,title:'Same',year:2024,poster:'/wrong.jpg'}],boxPosterUrl:s=>s||'',URLSearchParams,fetch:async()=>({ok:true,json:async()=>({movies:[{id:2,title:'Same',year:2024,poster:'/wrong.jpg'}]})})};
 vm.runInNewContext(body+';globalThis.resolveMovie=resolveMovie',ctx);
 assert.equal(await ctx.resolveMovie('Same',1,2024),null);
});
