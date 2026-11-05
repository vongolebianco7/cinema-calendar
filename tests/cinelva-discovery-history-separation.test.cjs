const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('discover.html','utf8');
test('film history and true-story discovery are separate visible presets',()=>{
 assert.match(html,/data-p="classic">映画史をたどる/);
 assert.match(html,/data-p="history">史実をもとにした作品/);
 assert.match(html,/CINELVA_RELIABLE_PRESETS=new Set\(\[[^\]]*"history"/);
 assert.match(html,/history:"史実をもとにした作品"/);
});
test('the true-story preset uses explicit story evidence and excludes unrelated historical classics',()=>{
 const shelves=require('../js/cinelva-discovery-shelves.js');
 const start=html.indexOf('function hasAny('),end=html.indexOf('function recSort(');
 assert.ok(start>=0&&end>start,'recommendation filter functions exist');
 const ctx={CinelvaDiscoveryShelves:shelves,Date};vm.runInNewContext(html.slice(start,end)+';this.recMatch=recMatch;',ctx);
 assert.equal(ctx.recMatch({title:'A film',overview:'Based on a true story',votes:100,score:7},'history'),true);
 assert.equal(ctx.recMatch({title:'A classic film',overview:'A fictional adventure',year:1940,votes:1000,score:8},'history'),false);
 assert.equal(ctx.recMatch({title:'A classic film',overview:'A fictional adventure',year:1940,votes:1000,score:8},'classic'),true);
});
