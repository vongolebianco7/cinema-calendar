const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
for(const mode of ['tv','festival','events'])test('active '+mode+' calendar renders external values only as text and HTTPS links',()=>{
 const html=fs.readFileSync('index.html','utf8'),payload='<svg onload=alert(1)>';
 const extract=name=>{const start=html.indexOf('function '+name+'(');return html.slice(start,html.indexOf('\nfunction ',start+10));};
 const elements=new Map();const element=()=>({innerHTML:'',textContent:'',classList:{add(){},remove(){}}});
 const row={title:payload,name:payload,program:payload,time:payload,service:payload,date:'2026-10-28',event:'tv',source_url:'javascript:alert(1)',url:'javascript:alert(1)',place:payload,area:payload};
 const ctx={Date,URL,encodeURIComponent,mode,active:'すべて',view:new Date(2026,9,15),movies:[row],festivalEvents:[row],outdoorEvents:[row],calendarPriorityBudget:0,filtered:()=>[row],missingPoster:()=>'',tvChannelColor:()=> '#000',sameDay:()=>false,currentWeekStart:()=>new Date(2026,9,26),dayColorClass:()=>'',mountCalendarOutdoorReviews(){},document:{querySelector:()=>element(),querySelectorAll:()=>[]},$:key=>{if(!elements.has(key))elements.set(key,element());return elements.get(key)}};
 vm.createContext(ctx);vm.runInContext(['esc','safeCalendarUrl','monthPageStart','monthPageEnd','monthPageWeekCount','renderOutdoorCalendar','renderCal'].map(extract).join('\n'),ctx);
 ctx.renderCal();const result=elements.get('#dates').innerHTML;
 assert.ok(!result.includes('<svg onload'),mode+' text must not become markup');
 assert.ok(!result.includes('href="javascript:'),mode+' source URL must not run script');
});
test('special screening detail treats movie text and source URL as untrusted data',()=>{
 const html=fs.readFileSync('index.html','utf8');
 const source=html.slice(html.indexOf('function esc(value)'),html.indexOf('function streamServiceColor'));
 const detail={innerHTML:''};
 const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const context={$:()=>detail,showModal(){},encodeURIComponent,URL,esc:escape};
 vm.createContext(context);vm.runInContext(source,context);
 context.openMovie({special_screening:'asa10',title:'<img src=x onerror=alert(1)>',date:'2026-10-28',source_url:'javascript:alert(1)'});
 assert.ok(!detail.innerHTML.includes('<img src=x'),'title must remain text');
 assert.ok(!detail.innerHTML.includes('href="javascript:'),'source must not execute script');
});
test('timeline escapes observed provider labels and validates source URLs',()=>{
 const html=fs.readFileSync('index.html','utf8');
 const extract=name=>{const start=html.indexOf('function '+name+'(');return html.slice(start,html.indexOf('\nfunction ',start+10));};
 const ctx={URL,availabilitySnapshot:{movies:{'1':{checked_at:'2026-10-28',flatrate:['<img src=x onerror=alert(1)>'],source_url:'javascript:alert(1)'}}},CinelvaDataQuality:{availabilityIsFresh:()=>true},related:()=>[],normTitle:x=>String(x),releaseHistory:{records:[]}};
 vm.createContext(ctx);vm.runInContext(extract('esc')+extract('safeCalendarUrl')+extract('movieTimelineHtml'),ctx);
 const result=ctx.movieTimelineHtml({id:1,title:'Film'});
 assert.ok(!result.includes('<img src=x'));
 assert.ok(!result.includes('href="javascript:'));
});
test('ordinary movie trailers reject script schemes without changing record data',()=>{
 const html=fs.readFileSync('index.html','utf8'),detail={innerHTML:''};
 const source=html.slice(html.indexOf('function esc(value)'),html.indexOf('function streamServiceColor'));
 const noop=()=>'';
 const ctx={$:()=>detail,showModal:noop,URL,URLSearchParams,encodeURIComponent,related:()=>[],directors:{},availabilitySnapshot:{movies:{}},CinelvaDataQuality:{availabilityIsFresh:()=>false},filmingLocationHtml:noop,contextHtml:noop,exploreHtml:noop,experienceFitHtml:noop,movieTimelineHtml:noop,CinemapCalendarContext:{detailHref:()=>null},document:{querySelectorAll:()=>[]}};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 const movie={title:'<img src=x onerror=alert(1)>',trailer_url:'javascript:alert(1)',overview:'<svg onload=alert(1)>'};
 ctx.openMovie(movie);
 assert.ok(!detail.innerHTML.includes('<img src=x'));
 assert.ok(!detail.innerHTML.includes('<svg onload'));
 assert.ok(!detail.innerHTML.includes('href="javascript:'));
 assert.equal(movie.overview,'<svg onload=alert(1)>','rendering must preserve raw stored data');
});
test('event details escape untrusted end dates and reject unsafe image URLs',()=>{
 const html=fs.readFileSync('index.html','utf8'),detail={innerHTML:''};
 const source=html.slice(html.indexOf('function esc(value)'),html.indexOf('function streamServiceColor'));
 const ctx={$:()=>detail,showModal(){},URL,encodeURIComponent,festivalAwardOrg:()=>''};vm.createContext(ctx);vm.runInContext(source,ctx);
 ctx.openMovie({event:'festival',title:'Festival',date:'2026-10-28',end_date:'<svg onload=alert(1)>',visual_url:'https://example.invalid/" onerror="alert(1)'});
 assert.ok(!detail.innerHTML.includes('<svg onload'));
 assert.ok(!detail.innerHTML.includes('" onerror="'));
});
