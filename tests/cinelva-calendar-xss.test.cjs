const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
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
