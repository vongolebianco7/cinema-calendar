const assert = require('node:assert/strict');
const model = require('../js/ocean-model.js');

const catalog = [
  {id:1,title:'Loved Space',genres:['SF'],director:'A',region:'海外映画',year:2020},
  {id:2,title:'Disliked Horror',genres:['ホラー'],director:'B',region:'海外映画',year:2020},
  {id:3,title:'Next Space',genres:['SF'],director:'A',region:'海外映画',year:2021},
  {id:4,title:'Next Horror',genres:['ホラー'],director:'B',region:'海外映画',year:2021},
  {id:5,title:'Unknown',genres:[],year:2021},
];
const records = {
  1:{id:'1',watched:true,rating:5,updatedAt:'2026-09-27T00:00:00Z'},
  2:{id:'2',watched:true,rating:2.5,updatedAt:'2026-09-27T00:00:00Z'},
};
assert.deepEqual(model.features(catalog[4]),{'decade:2020':0.5},'unknown attributes are not invented');
assert.equal(model.ratingWeight(3.5),0);
assert.ok(model.ratingWeight(5)>model.ratingWeight(4.5));
assert.ok(model.ratingWeight(2.5)<model.ratingWeight(3));
assert.ok(model.ratingWeight(4.2)>model.ratingWeight(4));
assert.ok(model.ratingWeight(4.2)<model.ratingWeight(4.5));
assert.equal(model.ratingWeight(0),null,'zero means no viewing rating');
const prefs = model.preferences(records,catalog);
assert.ok(prefs['genre:SF'].score>0);
assert.ok(prefs['genre:ホラー'].score<0,'low ratings must reduce affinity');
const suggestions = model.recommend(records,catalog);
assert.equal(suggestions[0].film.id,3);
assert.equal(suggestions.some(x=>x.film.id===4),false,'negative-affinity film is not recommended');
assert.equal(model.recommend({},catalog).length,0,'do not imply affinity without ratings');
assert.deepEqual(model.position('genre:SF'),model.position('genre:SF'),'positions are stable');
assert.ok(model.position('genre:SF').x>=10&&model.position('genre:SF').x<=90);
const hybrid={id:73,genres:['SF','ドラマ'],genreStrengths:{SF:.8,'ドラマ':.7},director:'Crossing'};
assert.equal('ドラマ' in model.genreCenters,false,'broad drama metadata does not create a galaxy');
const point=model.filmPosition(hybrid), sf=model.centerForGenre('SF');
assert.ok(Math.abs(point.x-sf[0])<5,'drama metadata does not pull a film away from its specific genre');
assert.deepEqual(point,model.filmPosition({...hybrid,rating:5}),'rating cannot move a planet');
assert.deepEqual(model.genreStrengths(hybrid),{SF:.8,'ドラマ':.7});
const mixed={id:75,genres:['SF','スリラー'],genreStrengths:{SF:.8,'スリラー':.7}};
const mixedPoint=model.filmPosition(mixed), thriller=model.centerForGenre('スリラー');
assert.ok(mixedPoint.x>sf[0]&&mixedPoint.x<thriller[0],'specific mixed genres occupy a boundary');
const cross=model.directorPosition('Crossing',[hybrid,{...mixed,director:'Crossing'}]);
assert.ok(cross.x>point.x,'the director system spans its different film genres');
assert.equal(model.species.length,504,'forty-two silhouettes with twelve discoverable colour variants each');
assert.equal(model.speciesFor({...catalog[0],rating:2.5}).id,model.speciesFor(catalog[0]).id,'rating affects appearance, not species');
assert.deepEqual(model.speciesFor(catalog[0]),model.speciesFor({...catalog[0]}),'same film keeps its creature');
assert.ok(model.speciesFor({genres:[]}).familyId,'unknown traits never imply a made-up mood');
assert.ok(new Set(Array.from({length:1000},(_,i)=>model.speciesFor({id:i,genres:['SF']}).id)).size>40,'many works uncover many appearances');
assert.ok(new Set(Array.from({length:70},(_,i)=>model.speciesFor({id:i,genres:['ホラー']}).familyId)).size>12,'one genre never becomes one sea animal');
assert.ok(model.habitatGrowth(10).reef<model.habitatGrowth(50).reef && model.habitatGrowth(50).reef<model.habitatGrowth(100).reef);
assert.equal(model.habitatGrowth(0).fish,0,'an empty ocean has no decorative shoal');
console.log('Ocean weights, honest metadata, suggestions and stable positions passed');
