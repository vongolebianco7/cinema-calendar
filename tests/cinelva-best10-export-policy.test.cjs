const fs=require('node:fs'),vm=require('node:vm'),test=require('node:test'),assert=require('node:assert/strict');
function renderer(){
 const calls={images:[],draws:[],text:[],fonts:[],fetches:[]};const recovery={poster:'https://image.tmdb.org/t/p/w342/seven-recovered.jpg'};
 const ctx=new Proxy({save(){},restore(){},createLinearGradient(){return {addColorStop(){}}},measureText(s){return {width:String(s).length*22}},fillText(s){calls.text.push(String(s))},drawImage(img){calls.draws.push(img.src)}},{get(o,k){return k in o?o[k]:(()=>{})},set(o,k,v){if(k==='font')calls.fonts.push(String(v));o[k]=v;return true}});
 const canvas={getContext:()=>ctx,setAttribute(name,value){if(name==='aria-label')this.ariaLabel=value},toBlob(cb){cb({})}};
 const elements={artCanvas:canvas,share:{},save:{},saveToPhotos:{},format:{value:'portrait'},layout:{value:'double'},theme:{value:'minimal'},fontSize:{value:'medium'},fontStyle:{value:'modern'},title:{value:'My Best 10'},sub:{value:''},cinemaBackground:{value:'none'},artworkTitleMode:{value:'japanese'},showMyRating:{checked:false}};
 class Image{constructor(){this.complete=false;calls.images.push(this)}set src(v){this._src=v}get src(){return this._src}}
 const context={document:{getElementById:id=>elements[id]||null},window:{addEventListener(){}},Image,File:function(){},URL:{},fetch:async url=>{calls.fetches.push(String(url));return {ok:true,json:async()=>({movie:{poster:recovery.poster}})}},setTimeout(){return 1},clearTimeout(){},requestAnimationFrame(){return 1},picks:[]};context.window=context;context.addEventListener=()=>{};
 vm.createContext(context);vm.runInContext(fs.readFileSync('js/my-cinemap-art.js','utf8'),context);vm.runInContext(fs.readFileSync('js/my-cinemap-cinema-templates.js','utf8'),context);
 return {calls,elements,context,recovery,load(){for(const img of calls.images){img.complete=true;img.naturalWidth=600;img.naturalHeight=900;img.onload?.()}}};
}
test('the three font choices use visibly distinct Japanese font fallbacks',()=>{
 const r=renderer(),movie={title:'千と千尋の神隠し'};
 const fonts=new Map();
 for(const choice of ['modern','clean','classic']){r.elements.fontStyle.value=choice;r.calls.fonts=[];r.context.drawArtwork([movie]);assert.ok(r.calls.fonts.length>0,`${choice} font must render`);fonts.set(choice,r.calls.fonts.join('\n'))}
 assert.match(fonts.get('modern'),/Baskerville/);assert.match(fonts.get('clean'),/Avenir Next/);assert.match(fonts.get('classic'),/Hiragino Maru Gothic ProN/);assert.doesNotMatch(fonts.get('classic'),/Baskerville|Hiragino Mincho/);assert.notEqual(fonts.get('modern'),fonts.get('classic'),'the first and third font choices must differ');
});
test('My Best 10 cache-busts the updated typography renderer',()=>{
 const html=fs.readFileSync('my-best10.html','utf8');
 assert.match(html,/js\/my-cinemap-art\.js\?v=20261114-rank-stars-logo/);
});
test('cinema ranking uses larger numbers, clipped star shapes, and the original black emblem',()=>{
 const art=fs.readFileSync('js/my-cinemap-art.js','utf8'),templates=fs.readFileSync('js/my-cinemap-cinema-templates.js','utf8');
 assert.match(art,/ctx\.save\(\);ctx\.clip\(\);ctx\.globalAlpha=1;ctx\.fillRect\(/,'rating fills stay clipped to the star outline');
 assert.doesNotMatch(art,/beginPath\(\);ctx\.rect\(cx-starSize/,'rating fill does not replace the star path with a square');
 assert.match(art,/ctx\.drawImage\(image,x,y,tile,tile\)/,'the emblem is drawn intact, including its black tile');
 assert.doesNotMatch(art,/getImageData|drawTransparentEmblem/,'the icon background is not keyed to transparency');
 assert.match(templates,/44px \$\{artNumber\}/,'top three rank numerals are enlarged');
 assert.match(templates,/columns===2\?46:46/,'remaining rank numerals are enlarged');
});
test('MY Rating visibility toggle shows a star row and score in the export',()=>{
 const r=renderer(),movie={id:'42',title:'千と千尋の神隠し'};
 r.context.CinelvaLibraryRecords={all:()=>[{id:'42',title:movie.title,rating:4.6,watched:true}]};
 r.context.drawArtwork([movie]);
 assert.ok(!r.calls.text.includes('4.6'),'ratings are hidden by default');
 r.elements.showMyRating.checked=true;r.calls.text=[];r.context.drawArtwork([movie]);
 assert.ok(r.calls.text.includes('4.6'),'the checked toggle adds the personal rating score beside the stars');
 r.context.CinelvaLibraryRecords={all:()=>[{id:'42',title:movie.title,rating:null,watched:true}]};r.calls.text=[];r.context.drawArtwork([{...movie,rating:4.8}]);
 assert.ok(!r.calls.text.includes('4.8'),'a cleared rating does not fall back to a stale imported score');
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
 assert.match(html,/id="showMyRating"/);assert.ok(html.includes('my-best10-rating-import.js?v=20261107-title-rating'));
});

test('Japanese/original title mode is honored by standard and cinema export templates',()=>{
 const r=renderer(),movie={title:'日本語タイトル',original_title:'Original Title'};
 r.elements.artworkTitleMode.value='original';r.context.drawArtwork([movie]);
 assert.match(r.elements.artCanvas.ariaLabel,/Original Title/);
 r.elements.theme.value='cinema-theater';r.context.drawArtwork([movie]);
 assert.match(r.elements.artCanvas.ariaLabel,/Original Title/);
 assert.doesNotMatch(r.elements.artCanvas.ariaLabel,/日本語タイトル/);
});

test('legacy square or landscape settings still render portrait PNGs in every export template',()=>{
 const r=renderer(),movie={title:'Film One',poster:'https://image.tmdb.org/t/p/w342/poster.jpg'};
 r.elements.format.value='landscape';r.context.drawArtwork([movie]);
 assert.deepEqual([r.elements.artCanvas.width,r.elements.artCanvas.height],[1600,2000]);
 r.elements.theme.value='cinema-theater';r.elements.format.value='square';r.context.drawArtwork([movie]);
 assert.deepEqual([r.elements.artCanvas.width,r.elements.artCanvas.height],[1600,2000]);
 const html=fs.readFileSync('my-best10.html','utf8');
 assert.match(html,/exportAspectLabel[^>]*>画像サイズ <strong>縦長 · 4:5<\/strong>/);
 assert.doesNotMatch(html,/<select id="format"/);
});

test('My Best 10 candidate cards fit a horizontal mobile scroller',()=>{
 const html=fs.readFileSync('my-best10.html','utf8');
 const css=html.match(/<style id="best10-horizontal-candidates">([\s\S]*?)<\/style>/)?.[1]||'';
 assert.match(css,/#list\{[^}]*display:flex/);
 assert.match(css,/#list\{[^}]*overflow-x:auto/);
 assert.match(css,/#list>\.item\{[^}]*flex:0 0/);
 assert.match(css,/#list>\.item \.move\{[^}]*display:flex/);
 assert.match(css,/@media\(max-width:600px\)/);
 assert.match(css,/\.results\{max-height:min\(62vh,560px\)\}/);
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
test('a missing poster URL triggers one identity-based TMDB recovery for Best 10',async()=>{
 const r=renderer(),movie={id:807,tmdbId:807,source:'tmdb',title:'セブン'};
 r.context.drawArtwork([movie]);await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(r.calls.fetches.length,1,'missing artwork performs one backend lookup');assert.match(r.calls.fetches[0],/movie-detail\?id=807/);assert.equal(movie.poster,r.recovery.poster);
 r.load();r.context.drawArtwork([movie]);r.load();assert.ok(r.calls.draws.some(url=>url.endsWith('/seven-recovered.jpg')),'recovered poster is painted');assert.equal(r.calls.fetches.length,1,'redraws do not repeatedly request a known-missing poster');
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

test('poster recovery never overwrites canonical viewing records in localStorage',()=>{
 const source=fs.readFileSync(require('node:path').join(__dirname,'../js/my-cinemap-art.js'),'utf8');
 const recovery=source.slice(source.indexOf('async function recoverPoster('),source.indexOf('function posterArtworkUrl('));
 assert.ok(recovery.includes('movie.poster=poster'),'poster recovery must remain available');
 assert.doesNotMatch(recovery,/localStorage\.(?:setItem|removeItem|clear)\s*\(/,'image recovery must not mutate saved viewing records');
});
