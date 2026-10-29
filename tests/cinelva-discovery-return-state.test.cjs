const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('discover.html','utf8');
function app(saved){
 const start=html.indexOf('function saveDiscoveryState()'),end=html.indexOf('function focusPersonField(');
 assert.ok(start>=0,'discovery must preserve its history-entry state');
 const nodes=Object.fromEntries(['conditionResults','personResultTools','heading','status','director','filterMode','conciergeMode'].map(id=>[id,{hidden:false,textContent:'',value:'',checked:false}]));
 let rendered=0,scrolled;
 const ctx={URL,history:{state:{cinelvaDiscovery:saved},replaceState(state){this.state=state}},location:{href:'https://example.test/discover.html'},document:{getElementById:id=>nodes[id],querySelectorAll:()=>[]},window:{scrollY:850,scrollTo:(x,y)=>{scrolled=y}},requestAnimationFrame:fn=>fn(),$:selector=>nodes[selector.slice(1)],render:()=>{rendered++},renderPersonProfile(){},genreUI(){}};
 vm.createContext(ctx);vm.runInContext(html.slice(start,end),ctx);
 return {ctx,nodes,restore:()=>ctx.restoreDiscoveryState(),rendered:()=>rendered,scroll:()=>scrolled};
}
test('discovery reload restores list, filter values, person constraint and scroll from the same entry',()=>{
 const a=app({url:'https://example.test/discover.html',items:[{tmdbId:42,title:'映画'}],page:2,totalPages:5,genre:'18',preset:'classic',directorId:'525',castId:'',currentPersonId:'525',currentPersonName:'ノーラン',currentPersonKind:'director',personDecade:'2000',currentCrewRole:'director',scrollY:850,heading:'ノーランの監督作品',status:'1作品',resultsVisible:true,controls:[{id:'director',value:'ノーラン'}]});
 assert.equal(a.restore(),true);assert.equal(a.ctx.items[0].tmdbId,42);assert.equal(a.ctx.page,2);assert.equal(a.ctx.directorId,'525');assert.equal(a.nodes.director.value,'ノーラン');assert.equal(a.nodes.conditionResults.hidden,false);assert.equal(a.rendered(),1);assert.equal(a.scroll(),undefined,'shelves must settle before scroll restoration');a.ctx.restoreDiscoveryScroll();assert.equal(a.scroll(),850);
});
test('saved filters include ID-less providers and shelf selection state',()=>{
 const a=app(null),provider={value:'999',checked:true,closest:()=>({textContent:'追加サービス'})};
 a.ctx.document.querySelectorAll=query=>query==='#providerChecks input:checked'?[provider]:[];
 Object.assign(a.ctx,{items:[],page:1,totalPages:1,genre:'18',preset:'classic',directorId:'',castId:'',currentPersonId:'',currentPersonName:'',currentPersonKind:'',personDecade:'',currentCrewRole:'director',availabilityFilter:'available',discoverShelfExpanded:{catalog:true,theatrical:false}});
 a.ctx.saveDiscoveryState();const saved=a.ctx.history.state.cinelvaDiscovery;
 assert.equal(saved.providers[0].id,'999');assert.equal(saved.availabilityFilter,'available');assert.equal(saved.shelfExpanded.catalog,true);
});
test('popular shelf navigation participates in discovery state capture',()=>{
 assert.match(html,/closest\('[^']*\.presetCard\[data-popular-id\]/);
});
test('an unrelated history entry never restores old film results',()=>{
 const a=app({url:'https://example.test/another.html',items:[{tmdbId:42}]});assert.equal(a.restore(),false);assert.equal(a.rendered(),0);
});
test('initial mode selection retains the history snapshot before restoration',()=>{
 const saved={url:'https://example.test/discover.html',items:[]},a=app(saved);
 const start=html.indexOf('function setExploreMode('),end=html.indexOf('\ndocument.querySelectorAll(',start);
 vm.runInContext(html.slice(start,end),a.ctx);a.ctx.setExploreMode('filter');assert.equal(a.ctx.history.state?.cinelvaDiscovery,saved);
});
