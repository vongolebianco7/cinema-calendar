const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
test('calendar exposes one festival and event tab',()=>{
 assert.match(html,/data-mode="festival"[^>]*>映画祭・イベント<\/button>/);
 assert.doesNotMatch(html,/data-mode="events"/);
});
test('credits menu opens the current personal library',()=>{
 assert.match(fs.readFileSync('credits.html','utf8'),/<a href="my-cinelva\/">My Cinelva<\/a>/);
});
test('unified calendar preserves festivals, awards, domestic events and outdoor film links',()=>{
 const nodes={};const el=s=>nodes[s]||(nodes[s]={innerHTML:'',classList:{remove(){},add(){}}});
 const ctx={view:new Date(2026,9,1),active:'すべて',outdoorEvents:[{event_id:'out',name:'屋外上映',date:'2026-10-10',movie:'上映作品',area:'東京',place:'公園'}],festivalEvents:['国内映画祭','海外映画祭','映画賞','国内イベント'].map(service=>({title:service,date:'2026-10-10',service})),document:{querySelector:el,querySelectorAll:()=>[]},$:el,monthPageStart:()=>new Date(2026,8,28),monthPageWeekCount:()=>5,dayColorClass:()=>'',sameDay:()=>false,currentWeekStart:()=>new Date(),mountCalendarOutdoorReviews(){},festivalAwardOrg:()=>'',window:{}};
 vm.createContext(ctx);
 vm.runInContext(html.slice(html.indexOf('function renderOutdoorCalendar(){'),html.indexOf('\nfunction renderCal(){')),ctx);
 ctx.renderOutdoorCalendar();
 for(const label of ['国内映画祭','海外映画祭','映画賞','国内イベント','屋外上映','上映作品'])assert.ok(nodes['#dates'].innerHTML.includes(label),label);
 ctx.active='海外映画祭';ctx.renderOutdoorCalendar();
 assert.ok(nodes['#dates'].innerHTML.includes('海外映画祭'));assert.ok(!nodes['#dates'].innerHTML.includes('屋外上映'));
 ctx.active='すべて';ctx.festivalEvents=[{title:'翌月の映画祭',date:'2026-11-01',service:'国内映画祭'}];
 const bar={dataset:{outdoor:encodeURIComponent('翌月の映画祭')}};
 ctx.document.querySelectorAll=s=>s==='[data-outdoor]'?[bar]:[];
 let opened;ctx.openMovie=movie=>opened=movie;
 ctx.renderOutdoorCalendar();bar.onclick();
 assert.equal(opened?.title,'翌月の映画祭','adjacent-month festival bar must open details even without a month detail card');
});
