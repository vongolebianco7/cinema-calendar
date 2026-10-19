const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function page(seed){
 const values=new Map(Object.entries(seed||{})),listeners=new Map();
 const node=()=>({children:[],append(...n){this.children.push(...n)},replaceChildren(){this.children=[]},querySelectorAll(){return []}});
 const list=node(),document={getElementById:id=>id==='wantWatchList'?list:null,querySelectorAll:()=>[],createElement:node};
 const window={document,localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},addEventListener:(k,fn)=>{if(!listeners.has(k))listeners.set(k,[]);listeners.get(k).push(fn)},dispatchEvent:e=>{for(const fn of listeners.get(e.type)||[])fn(e)},CinelvaQuickRate:{mountInline(slot,movie){slot.movie=movie}}};
 const context={window,document,URLSearchParams,CustomEvent:class{constructor(type,o){this.type=type;this.detail=o.detail}}};
 vm.runInNewContext(fs.readFileSync('js/cinelva-bookmarks.js','utf8'),context);
 vm.runInNewContext(fs.readFileSync('js/cinelva-watchlist.js','utf8'),context);
 return {list,window,values};
}
test('existing wanted films appear only inside their dedicated tab with shared movie controls',()=>{
 const p=page({'cinelva-want-to-watch-v1':JSON.stringify({42:{id:42,title:'保存済み',custom:9}})});
 assert.equal(p.list.children[0].children[0].textContent,'保存済み');
 assert.match(p.list.children[0].children[0].href,/search.html\?id=42/);
 assert.equal(p.list.children[0].children[1].movie.custom,9);
 const html=fs.readFileSync('my-cinelva/index.html','utf8');
 assert.match(html,/data-tab="watchlist">見たい映画/);
 assert.ok(html.indexOf('id="watchlistView"')>html.indexOf('id="summaryView"'));
 assert.doesNotMatch(html,/<details[^>]*want-watch|wantToWatchSection/);
});
test('adding and removing synchronize the dedicated list without switching the dashboard',()=>{
 const p=page();p.window.CinelvaBookmarks.toggle({id:42,title:'作品'});
 assert.equal(p.list.children[0].children[0].textContent,'作品');
 p.window.CinelvaBookmarks.toggle({id:42});assert.match(p.list.children[0].textContent,/まだありません/);
});
test('legacy imported bookmarks survive and display the canonical detail URL',()=>{
 const raw=JSON.stringify({900:{id:900,title:'旧作品',extra:'keep'}});
 const p=page({'cinelva-want-to-watch-v1':raw,'cinelva-library-records-v2':JSON.stringify({900:{id:900,tmdbId:42,title:'旧作品',rating:4}})});
 assert.match(p.list.children[0].children[0].href,/id=42/);assert.equal(p.values.get('cinelva-want-to-watch-v1'),raw);
});
