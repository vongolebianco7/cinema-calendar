const test=require('node:test'),assert=require('node:assert/strict');
const search=require('../js/cinelva-global-search.js');
test('director and cast filmographies reject TV movie genres without rejecting animation/drama',()=>{
 for(const role of ['director','cast']){
 const rows=[{id:1414051,title:'グランメゾン東京 スペシャル',genre_ids:[18,10770],job:'Director'},{id:1306061,title:'グランメゾン・パリ',genre_ids:[18],job:'Director'},{id:129,title:'千と千尋の神隠し',genre_ids:[16,10751,14],job:'Director'}];
 assert.deepEqual(search.creditFilms(rows,role,'監督').map(x=>x.id).sort((a,b)=>a-b),[129,1306061]);
 }
});
test('all explicit medium fields independently reject series and episodes',()=>{
 for(const row of [{type:'movie',media_type:'tv'},{format:'TV Series'},{media_type:'episode'},{genres:[{id:10770,name:'テレビ映画'}]},{genres:['TV Movie']},{genre_names:['テレビドラマ']},{is_tv:true},{number_of_episodes:12}])assert.equal(search.creditFilms([{id:1,title:'作品',job:'Director',...row}],'cast').length,0,JSON.stringify(row));
});
test('verified theatrical evidence retains theatrical versions but not episodes',()=>{
 const medium=require('../js/cinelva-film-medium.js');
 const release_dates={results:[{iso_3166_1:'JP',release_dates:[{type:3,release_date:'2025-01-01T00:00:00Z'}]}]};
 assert.equal(medium.isFilmMedium({genre_ids:[10770],release_dates}),true);
 assert.equal(medium.isFilmMedium({genre_ids:[10770],theatrical:true}),false);
 assert.equal(medium.isFilmMedium({media_type:'episode',release_dates}),false);
 assert.equal(medium.isFilmMedium({genre_ids:[16,18]}),true);
});
test('catalog medium classification survives watched metadata merging',()=>{
 const medium=require('../js/cinelva-film-medium.js');
 const merged=medium.mergeFilmMetadata({id:1,genre_ids:[10770],media_type:'tv_movie'},{id:1,genre_ids:[18],media_type:'movie',rating:5});
 assert.equal(merged.rating,5);assert.equal(medium.isFilmMedium(merged),false);
});

test('published index excludes TV specials while retaining theatrical animation and drama',()=>{
 const data=require('../data/directors-mobile.json'),index=require('../data/director-feature-index.json');
 for(const person of Object.values(data.directors))for(const work of person.works||[])if((work.genre_ids||[]).includes(10770)&&!search.filmMedium.hasTheatricalRelease(work))assert.equal(index.directors[person.id]?.ids.includes(work.id),false,work.title);
 assert.ok(index.directors['1561992'].ids.includes(1306061));
 assert.ok(index.directors['608'].ids.includes(129));
});
