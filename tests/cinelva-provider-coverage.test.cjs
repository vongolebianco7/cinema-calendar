const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const route=fs.readFileSync('backend/app/api/discover/route.ts','utf8');
function minimumVotes(query){const p=new URLSearchParams(query),url=new URL('https://example.test');const code=route.match(/const minVotes=.*?;url.searchParams.set\("vote_count.gte",minVotes\);/s)?.[0];assert.ok(code);vm.runInNewContext(code,{p,url});return url.searchParams.get('vote_count.gte');}
test('provider browsing includes films with fewer than 100 votes',()=>assert.equal(minimumVotes('provider=8'),'0'));
test('explicit recommendation thresholds remain respected',()=>{assert.equal(minimumVotes('provider=8&votes=500'),'500');assert.equal(minimumVotes(''),'100');});
for(const file of ['discover.html','cinelva/discover.html'])test(file+' permits page 21 without exceeding upstream limit',()=>{const html=fs.readFileSync(file,'utf8'),expression=html.match(/page<Math.min\(totalPages,(\d+)\)/);assert.ok(expression);const cap=Number(expression[1]);assert.ok(20<Math.min(40,cap));assert.ok(!(500<Math.min(700,cap)));});
