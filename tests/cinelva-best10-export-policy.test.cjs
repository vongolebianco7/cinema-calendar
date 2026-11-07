const fs=require('node:fs'),vm=require('node:vm'),test=require('node:test'),assert=require('node:assert/strict');
function renderer(){
 const calls={images:[],draws:[],text:[],fonts:[]};
 const ctx=new Proxy({save(){},restore(){},createLinearGradient(){return {addColorStop(){}}},measureText(s){return {width:String(s).length*22}},fillText(s){calls.text.push(String(s))},drawImage(img){calls.draws.push(img.src)}},{get(o,k){return k in o?o[k]:(()=>{})},set(o,k,v){if(k==='font')calls.fonts.push(String(v));o[k]=v;return true}});
 const canvas={getContext:()=>ctx,setAttribute(){},toBlob(cb){cb({})}};
 const elements={artCanvas:canvas,share:{},save:{},saveToPhotos:{},format:{value:'portrait'},layout:{value:'double'},theme:{value:'minimal'},fontSize:{value:'medium'},fontStyle:{value:'modern'},title:{value:'My Best 10'},sub:{value:''},cinemaBackground:{value:'none'},showMyRating:{checked:false}};
 class Image{constructor(){this.complete=false;calls.images.push(this)}set src(v){this._src=v}get src(){return this._src}}
 const context={document:{getElementById:id=>elements[id]||null},window:{addEventListener(){}},Image,File:function(){},URL:{},setTimeout(){return 1},clearTimeout(){},requestAnimationFrame(){return 1},picks:[]};context.window=context;context.addEventListener=()=>{};
 vm.createContext(context);vm.runInContext(fs.readFileSync('js/my-cinemap-art.js','utf8'),context);vm.runInContext(fs.readFileSync('js/my-cinemap-cinema-templates.js','utf8'),context);
 return {calls,elements,context,load(){for(const img of calls.images){img.complete=true;img.naturalWidth=600;img.naturalHeight=900;img.onload?.()}}};
}
test('the three font choices use visibly distinct Japanese font fallbacks',()=>{
 const r=renderer(),movie={title:'千と千尋の神隠し'};
 const fonts=new Map();
 for(const choice of ['modern','clean','classic']){r.elements.fontStyle.value=choice;r.calls.fonts=[];r.context.drawArtwork([movie]);assert.ok(r.calls.fonts.length>0,`${choice} font must render`);fonts.set(choice,r.calls.fonts.join('\n'))}
 assert.match(fonts.get('modern'),/Baskerville/);assert.match(fonts.get('clean'),/Avenir Next/);assert.match(fonts.get('classic'),/Hiragino Maru Gothic ProN/);assert.doesNotMatch(fonts.get('classic'),/Baskerville|Hiragino Mincho/);assert.notEqual(fonts.get('modern'),fonts.get('classic'),'the first and third font choices must differ');
});
test('My Best 10 cache-busts the updated typography renderer',()=>{
 const html=fs.readFileSync('my-best10.html','utf8');
 assert.ok(html.includes("js/my-cinemap-art.js?v=20261107-my-rating"));
 assert.ok(html.includes("my-best10-rating-import.js?v=20261107-my-rating"));
});
test('MY Rating visibility toggle adds or removes each movie rating from the export',()=>{
 const r=renderer(),movie={id:'42',title:'千と千尋の神隠し'};
 r.context.CinelvaLibraryRecords={all:()=>[{id:'42',title:movie.title,rating:4.6,watched:true}]};
 r.context.drawArtwork([movie]);
 assert.ok(!r.calls.text.includes('MY評価 4.6'),'ratings are hidden by default');
 r.elements.showMyRating.checked=true;r.calls.text=[];r.context.drawArtwork([movie]);
 assert.ok(r.calls.text.includes('MY評価 4.6'),'the checked toggle adds the current personal rating');
});
test('rating import filters release decades, keeps all-time mode, and removes duplicate works',()=>{
 const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/my-best10-rating-import.js','utf8'),scope);
 const records=[
  {id:'1',title:'New A',year:'2024',rating:4.7,watched:true},
  {id:'2',title:'New B',year:'2021',rating:4.9,watched:true},
  {id:'3',title:'Old A',year:'2010',rating:5,watched:true},
  {id:'4',title:'Old B',year:'1989',rating:4.6,watched:true},
  {id:'1',title:'New A duplicate',year:'2024',rating:4.5,watched:true},
  {id:'5',title:'Unwatched',year:'2023',rating:5,watched:false},
  {id:'6',title:'Unknown year',rating:5,watched:true},
  {id:'7',title:'Before 1950',year:'1947',rating:4.4,watched:true}
 ];
 const api=scope.window.CinelvaBest10RatingImport;
 assert.equal(api.filterCandidates(records,'2020').map(x=>x.id).join(','),'2,1');
 assert.equal(api.filterCandidates(records,'pre1950').map(x=>x.id).join(','),'7');
 assert.equal(api.filterCandidates(records,'all').map(x=>x.id).join(','),'3,6,2,1,4,7');
 assert.equal(api.periodLabel('all'),'オールタイムベスト');
});
test('My Best 10 exposes decade selection and an image-rating toggle',()=>{
 const html=fs.readFileSync('my-best10.html','utf8');
 assert.match(html,/id="topRatingsPeriod"/);assert.match(html,/value="2020">2020年代/);assert.match(html,/value="all">オールタイムベスト/);
 assert.match(html,/id="showMyRating"/);
});
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
test('all ten posters from supported TMDB URL variants are painted in the export',()=>{
 const r=renderer();
 const movies=Array.from({length:10},(_,i)=>({
  title:'Film '+i,
  poster:i%3===0?'//image.tmdb.org/t/p/original/p'+i+'.jpg':i%3===1?'w500/p'+i+'.jpg':'',
  poster_path:'/p'+i+'.jpg'
 }));
 r.context.drawArtwork(movies);r.load();
 r.calls.draws=[];r.context.drawArtwork(movies);
 for(let i=0;i<10;i++)assert.ok(r.calls.draws.some(url=>url.endsWith('/p'+i+'.jpg')),'poster '+i);
});
