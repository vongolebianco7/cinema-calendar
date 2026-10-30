const fs=require('node:fs'),vm=require('node:vm'),test=require('node:test'),assert=require('node:assert/strict');
function renderer(){
 const calls={images:[],draws:[],text:[]};
 const ctx=new Proxy({save(){},restore(){},createLinearGradient(){return {addColorStop(){}}},measureText(s){return {width:String(s).length*22}},fillText(s){calls.text.push(String(s))},drawImage(img){calls.draws.push(img.src)}},{get(o,k){return k in o?o[k]:(()=>{})}});
 const canvas={getContext:()=>ctx,setAttribute(){},toBlob(cb){cb({})}};
 const elements={artCanvas:canvas,share:{},save:{},saveToPhotos:{},format:{value:'portrait'},layout:{value:'double'},theme:{value:'minimal'},fontSize:{value:'medium'},fontStyle:{value:'modern'},title:{value:'My Best 10'},sub:{value:''},cinemaBackground:{value:'none'}};
 class Image{constructor(){this.complete=false;calls.images.push(this)}set src(v){this._src=v}get src(){return this._src}}
 const context={document:{getElementById:id=>elements[id]||null},window:{addEventListener(){}},Image,File:function(){},URL:{},setTimeout(){return 1},clearTimeout(){},requestAnimationFrame(){return 1},picks:[]};context.window=context;context.addEventListener=()=>{};
 vm.createContext(context);vm.runInContext(fs.readFileSync('js/my-cinemap-art.js','utf8'),context);vm.runInContext(fs.readFileSync('js/my-cinemap-cinema-templates.js','utf8'),context);
 return {calls,elements,context,load(){for(const img of calls.images){img.complete=true;img.naturalWidth=600;img.naturalHeight=900;img.onload?.()}}};
}
for(const theme of ['minimal','noir','burgundy','cinema-projector','cinema-theater','cinema-archive'])test(`${theme}: posters and official emblem; no year/director, including saved records`,()=>{
 const r=renderer();r.elements.theme.value=theme;
 const movies=[{title:'Film One',year:2024,director:'Director One',poster:'https://image.tmdb.org/t/p/w342/poster.jpg'}];r.context.picks=movies;
 r.context.drawArtwork(movies);r.load();r.calls.text=[];r.calls.draws=[];r.context.drawArtwork(movies);
 assert.ok(r.calls.draws.some(v=>v.includes('/poster.jpg')),'poster must be drawn');
 assert.ok(r.calls.draws.some(v=>v.includes('cinelva_original_colors_transparent.png')),'approved emblem must be drawn');
 assert.ok(r.calls.text.includes('Film One'));assert.ok(!r.calls.text.some(v=>/2024|Director One/.test(v)),'metadata must never return');
 assert.ok(!r.calls.text.includes('C'),'no invented emblem');
});
test('missing or failed posters preserve titles and export; image loads use CORS',()=>{
 const r=renderer();r.context.drawArtwork([{title:'No Poster'},{title:'Failed',poster:'https://image.tmdb.org/t/p/w342/fail.jpg'}]);
 assert.ok(r.calls.text.includes('No Poster'));assert.ok(r.calls.images.every(img=>img.crossOrigin==='anonymous'));
 for(const image of r.calls.images)image.onerror?.();
 r.context.drawArtwork([{title:'No Poster'}]);assert.ok(r.calls.text.includes('No Poster'));
});
