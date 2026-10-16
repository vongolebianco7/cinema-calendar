const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
function boot({saved=null,dark=false,denied=false}={}){
 const listeners={},mediaListeners={},writes=[];
 const control={value:'',addEventListener:(type,fn)=>{listeners['control:'+type]=fn}};
 const label={className:'',innerHTML:'',querySelector:()=>control};
 const drawer={append:el=>{drawer.child=el}};
 const doc={documentElement:{dataset:{},style:{}},readyState:'loading',createElement:()=>label,querySelector:s=>s==='.gDrawer'?drawer:null,addEventListener:(type,fn)=>{listeners[type]=fn}};
 const media={matches:dark,addEventListener:(type,fn)=>{mediaListeners[type]=fn}};
 const storage={getItem:()=>{if(denied)throw Error('denied');return saved},setItem:(key,value)=>{if(denied)throw Error('denied');writes.push([key,value])},removeItem:key=>{if(denied)throw Error('denied');writes.push([key,null])}};
 const win={matchMedia:()=>media,addEventListener:(type,fn)=>{listeners['window:'+type]=fn}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'js/theme.js'),'utf8'),{document:doc,window:win,localStorage:storage});
 return {doc,media,mediaListeners,listeners,control,drawer,writes};
}
test('first paint follows system unless an explicit valid preference exists',()=>{
 assert.equal(boot({dark:false}).doc.documentElement.dataset.theme,'light');
 assert.equal(boot({dark:true}).doc.documentElement.dataset.theme,'dark');
 assert.equal(boot({dark:true,saved:'light'}).doc.documentElement.dataset.theme,'light');
 assert.equal(boot({saved:'invalid',dark:true}).doc.documentElement.dataset.theme,'dark');
});
test('accessible menu control persists override and can return to system',()=>{
 const app=boot({dark:true});app.listeners.DOMContentLoaded();
 assert.ok(app.drawer.child);assert.match(app.drawer.child.innerHTML,/表示テーマ/);
 app.control.value='light';app.listeners['control:change']();
 assert.equal(app.doc.documentElement.dataset.theme,'light');
 assert.deepEqual(app.writes.at(-1),['cinelva-theme-v1','light']);
 app.media.matches=false;app.mediaListeners.change();
 assert.equal(app.doc.documentElement.dataset.theme,'light');
 app.control.value='system';app.listeners['control:change']();
 assert.deepEqual(app.writes.at(-1),['cinelva-theme-v1',null]);
 app.media.matches=true;app.mediaListeners.change();assert.equal(app.doc.documentElement.dataset.theme,'dark');
});
test('storage failures leave theme control usable and other-tab changes synchronize',()=>{
 const app=boot({denied:true});app.listeners.DOMContentLoaded();app.control.value='dark';app.listeners['control:change']();
 assert.equal(app.doc.documentElement.dataset.theme,'dark');
 app.listeners['window:storage']({key:'cinelva-theme-v1',newValue:'light'});
 assert.equal(app.doc.documentElement.dataset.theme,'light');assert.equal(app.control.value,'light');
});
test('every public and isolated page loads the shared theme before rendering',()=>{
 for(const name of fs.readdirSync(root).filter(n=>n.endsWith('.html'))){
  for(const prefix of ['', 'cinelva/']){
   const html=fs.readFileSync(path.join(root,prefix,name),'utf8');
   assert.match(html,/<script src="js\/theme.js"><\/script>/,prefix+name);
   assert.match(html,/<link rel="stylesheet" href="assets\/theme.css">/,prefix+name);
   assert.ok(html.indexOf('js/theme.js')<html.indexOf('<style'),prefix+name+' early theme');
   if(prefix)assert.match(html,/<meta name="robots" content="noindex,nofollow">/);
  }
 }
 const css=fs.readFileSync(path.join(root,'assets/theme.css'),'utf8');assert.doesNotMatch(css,/filter\s*:|\b(?:canvas|img|\.art|\.ocean)\s*[{,]/i);
});
