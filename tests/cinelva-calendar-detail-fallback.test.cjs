const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context=require('../js/calendar-context.js');
for(const file of ['index.html','cinelva/index.html']){
 const code=fs.readFileSync(file,'utf8').match(/let fullDetailHref=.*?;/)[0];
 function href(m){return new URL(vm.runInNewContext(code+'fullDetailHref',{m,CinemapCalendarContext:context,URLSearchParams,encodeURIComponent}),'https://cinelva.test/');}
 test(file+': unlinked film searches by title without an undefined ID',()=>{const u=href({title:'君の僕の詩',event:'streaming',service:'FOD',date:'2026-10-01'});assert.equal(u.searchParams.get('search'),'君の僕の詩');assert.equal(u.searchParams.has('id'),false);});
 test(file+': identified film preserves calendar context',()=>{const u=href({title:'Film',tmdbId:550,event:'streaming',service:'FOD',date:'2026-10-01'});assert.equal(u.searchParams.get('id'),'550');assert.equal(u.searchParams.get('from'),'calendar');assert.equal(u.searchParams.get('date'),'2026-10-01');});
}
