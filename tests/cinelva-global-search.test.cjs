const test=require('node:test'),assert=require('node:assert/strict');
const model=require('../js/cinelva-global-search.js');
test('person and movie IDs remain distinct and candidate names are encoded',()=>{
 assert.equal(model.candidateKey({kind:'person',id:42,role:'director'}),'person:42:director');
 assert.notEqual(model.candidateKey({kind:'movie',id:42}),model.candidateKey({kind:'person',id:42,role:'cast'}));
 const u=new URL(model.candidateUrl({kind:'person',id:42,role:'cast',name:'名前 & <人>'},'https://example.test/search.html'));
 assert.equal(u.searchParams.get('person'),'42');assert.equal(u.searchParams.get('role'),'cast');assert.equal(u.searchParams.get('search'),'名前 & <人>');
});
test('only directors and cast are person candidates; role selection keeps exact ID',()=>{
 const x=model.peopleCandidates([{id:1,name:'監督',department:'Directing'},{id:2,name:'俳優',department:'Acting'},{id:3,name:'撮影',department:'Camera'}]);
 assert.deepEqual(x.map(p=>[p.id,p.role]),[[1,'director'],[2,'cast']]);
});
test('filmography filters director job and adult content, dedupes and sorts oldest first',()=>{
 const x=model.creditFilms([{id:1,title:'Later',release_date:'2020-01-01',job:'Director'},{id:2,title:'Earlier',release_date:'2000-01-01',job:'Director'},{id:2,title:'duplicate',job:'Director'},{id:3,title:'Writer only',job:'Writer'},{id:4,title:'Adult',adult:true,job:'Director'}],'director');
 assert.deepEqual(x.map(m=>m.id),[2,1]);
 assert.equal(model.creditFilms([{id:5,title:'Actor',character:'役'}],'cast')[0].id,5);
});
test('provider-safe image paths reject injected and external paths',()=>{
 assert.equal(model.imageUrl('/safe_file.jpg'),'https://image.tmdb.org/t/p/w185/safe_file.jpg');
 for(const p of ['https://evil.example/a.png','//evil.example/a.png','/a.svg','/a.jpg" onerror="x'])assert.equal(model.imageUrl(p),'');
});
