const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('js/cinelva-quick-rate.js','utf8');
function setup(existing=[]){
 const nodes=new Map(),writes=[];
 const node=()=>({value:'',textContent:'',onclick:null,children:[],options:[],
  style:{setProperty(){}},setAttribute(){},replaceWith(){},addEventListener(){},
  append(child){this.children.push(child);this.options.push(child);},
  replaceChildren(){this.children=[];this.options=[];}
 });
 const element=id=>{
  if(!nodes.has(id))nodes.set(id,{...node(),id});
  return nodes.get(id);
 };
 const dialog={...node(),open:false,innerHTML:'',className:'',querySelector:s=>element(s.slice(1)),show(){this.open=true},showModal(){this.open=true},close(){this.open=false}};
 const document={
  head:{append(){}},body:{append(){}},
  querySelector(){return null},
  querySelectorAll(){return []},
  createElement(tag){return tag==='dialog'?dialog:node()},
 };
 const Records={all:()=>existing,validDate:s=>s===null||/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(s),save:(...args)=>{writes.push(args);return args[0]}};
 const window={CinelvaLibraryRecords:Records,dispatchEvent(){},addEventListener(){}};
 vm.runInNewContext(source,{window,document,location:{pathname:'/'},CustomEvent:class{constructor(){}},MutationObserver:class{observe(){}}});
 return {api:window.CinelvaQuickRate,dialog,element,writes};
}
test('middle dot, spaces and Unicode punctuation do not prevent title matching',()=>{
 const {api}=setup();
 assert.equal(api.normalize('スター・ウォーズ'),api.normalize('スターウォーズ'));
 assert.equal(api.normalize('ＳＴＡＲ－ＷＡＲＳ'),api.normalize('star wars'));
 assert.equal(api.normalize('映画：名探偵'),api.normalize('映画名探偵'));
});
test('quick rating opens existing film, defaults to zero and persists comment / method',()=>{
 const {api,dialog,element,writes}=setup();
 assert.equal(api.open({id:123,title:'スター・ウォーズ'}),true);
 assert.equal(dialog.open,true);
 assert.equal(element('cinelvaRateScore').value,0);
 element('cinelvaRateScore').value='4.5';
 element('cinelvaRatePlace').value='映画館';
 element('cinelvaRateComment').value='また観たい';
 element('cinelvaRateDate').value='2026-10';
 element('cinelvaRateSave').onclick();
 assert.equal(writes.length,1);
 assert.equal(writes[0][0].viewingMethod,'映画館');
 assert.equal(writes[0][0].comment,'また観たい');
 assert.equal(writes[0][1],4.5);
 assert.equal(writes[0][2],'2026-10');
 assert.equal(dialog.open,false);
});
test('invalid date does not persist and existing zero rating remains zero',()=>{
 const old={id:'22',title:'作品',rating:0,viewingMethod:'配信',comment:'短評'};
 const {api,element,writes}=setup([old]);
 assert.equal(api.open({id:22,title:'作品',_localRecord:true}),true);
 assert.equal(element('cinelvaRateScore').value,0);
 assert.equal(element('cinelvaRatePlace').value,'配信');
 assert.equal(element('cinelvaRateComment').value,'短評');
 element('cinelvaRateDate').value='not-a-date';
 element('cinelvaRateSave').onclick();
 assert.equal(writes.length,0);
 assert.match(element('cinelvaRateMessage').textContent,/カレンダー/);
});
test('all three existing pages load the shared inline rating workflow',()=>{
 for(const name of ['index.html','rankings.html','search.html']){
  const page=fs.readFileSync(name,'utf8');
  assert.match(page,/js\/cinelva-library-records\.js/);
  assert.match(page,/js\/cinelva-quick-rate\.js/);
 }
 assert.match(fs.readFileSync('search.html','utf8'),/data\/movies\.json/);
 assert.match(fs.readFileSync('my-cinelva/index.html','utf8'),/id="recordComment"/);
 assert.match(fs.readFileSync('my-cinelva/index.html','utf8'),/id="viewingMethod"/);
 assert.doesNotMatch(fs.readFileSync('my-cinelva/index.html','utf8'),/id="unrated"/);
});

test('calendar observer decorates only added movie cards rather than its own rating text',()=>{
 assert.match(source,/for\(const node of record.addedNodes\)/);
 assert.match(source,/if\(cards.length\)decorate\(cards\)/);
 assert.match(source,/if\(card.querySelector/);
});
