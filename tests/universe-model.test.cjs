const assert = require('node:assert/strict');
const model = require('../js/universe-model.js');

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
const prefs = model.preferences(records,catalog);
assert.ok(prefs['genre:SF'].score>0);
assert.ok(prefs['genre:ホラー'].score<0,'low ratings must reduce affinity');
const suggestions = model.recommend(records,catalog);
assert.equal(suggestions[0].film.id,3);
assert.equal(suggestions.some(x=>x.film.id===4),false,'negative-affinity film is not recommended');
assert.equal(model.recommend({},catalog).length,0,'do not imply affinity without ratings');
assert.deepEqual(model.position('genre:SF'),model.position('genre:SF'),'positions are stable');
assert.ok(model.position('genre:SF').x>=10&&model.position('genre:SF').x<=90);
console.log('Universe weights, honest metadata, suggestions and stable positions passed');
