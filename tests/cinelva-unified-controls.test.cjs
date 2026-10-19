const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('record cards use module-scope canonical identity for imported IDs',()=>{
 const source=fs.readFileSync('js/cinelva-records-page.js','utf8');
 const helper=source.slice(0,source.indexOf('  function renderDirectors')).match(/^  const filmIdentity=[^\n]+/m)?.[0]||'';
 const functions=source.slice(source.indexOf('  function detailURL'),source.indexOf('  function showReviewDetail'));
 const html=vm.runInNewContext(helper+'\n'+functions+'\ncard({id:900,tmdbId:42,title:"film",rating:4})',{URLSearchParams,escapeHTML:String,posterHTML:()=>'<div class="poster"></div>',formatDate:()=>'',dateOf:()=>''});
 assert.match(html,/search.html\?id=42/);assert.match(html,/data-record-card="900"/);assert.match(html,/data-film-controls="42"/);
});
test('inline rating from an old bookmark preserves the latest review and unknown record fields',()=>{
 const values=new Map();const context={localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)}};
 vm.createContext(context);vm.runInContext(fs.readFileSync('js/cinelva-library-records.js','utf8'),context);
 const Records=context.CinelvaLibraryRecords;
 Records.save({id:900,tmdbId:42,title:'film',comment:'updated review',viewingMethod:'配信',unknown:'latest'},4,'2025-01');
 const source=fs.readFileSync('js/cinelva-quick-rate.js','utf8'),start=source.indexOf(' input.onchange=e=>'),end=source.indexOf(' const track=',start);
 const input={value:'4.5',dataset:{},setCustomValidity(message){throw Error(message)},reportValidity(){}};
 vm.runInNewContext(source.slice(start,end)+'\ninput.onchange({stopPropagation(){}})',{input,Records,id:42,movie:{id:42,title:'film',comment:'old review',viewingMethod:'映画館',unknown:'old'},existing:Records.all()[0],sync(){},prompt:{},root:{dispatchEvent(){}},CustomEvent:class{},open(){}});
 const record=Records.all()[0];assert.equal(record.comment,'updated review');assert.equal(record.viewingMethod,'配信');assert.equal(record.unknown,'latest');assert.equal(record.rating,4.5);assert.equal(String(record.id),'900');assert.equal(record.watchedAt,'2025-01');
});
