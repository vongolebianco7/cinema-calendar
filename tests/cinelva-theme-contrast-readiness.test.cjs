const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('contrast measurements ignore detached snapshot nodes and retain visible control assertions',()=>{
 const source=fs.readFileSync('tests/cinelva-theme-browser.mjs','utf8');
 const callback=source.slice(source.indexOf('evaluateAll(elements=>{')+'evaluateAll('.length,source.indexOf('\n  });',source.indexOf('const contrasts=')))+'}';
 const gone={isConnected:false,className:'calendarCoverage',getClientRects:()=>[]}, visible={isConnected:true,className:'heroAction',getClientRects:()=>[{}]};
 const checks=vm.runInNewContext('('+callback+')(elements)',{elements:[gone,visible],getComputedStyle:el=>el.isConnected?{color:'rgb(36, 37, 33)',backgroundColor:'rgb(255, 254, 250)'}:{color:'',backgroundColor:''}});
 assert.equal(checks.length,1);assert.equal(checks[0].name,'heroAction');assert.ok(checks[0].ratio>=4.5);
});
