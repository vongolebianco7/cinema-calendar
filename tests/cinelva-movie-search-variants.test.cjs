const test = require('node:test');
const assert = require('node:assert/strict');
const { searchMovies } = require('../backend/lib/movie-search.cjs');
const film = (id,title,original_title=title)=>({id,title,original_title});
test('recovers punctuation variants from catalog titles and collects every result page', async()=>{
 const calls=[];
 const result=await searchMovies({query:'スターウォーズ',titles:[film(9,'スター・ウォーズ／新作','New film')],fetchPage:async(q,page)=>{
  calls.push([q,page]);
  if(q==='スター・ウォーズ') return {total_pages:2,results:page===1?[film(1,'スター・ウォーズ','Star Wars')]:[film(2,'スター・ウォーズ 帝国の逆襲','The Empire Strikes Back')]};
  return {total_pages:1,results:[]};
 }});
 assert.deepEqual(result.results.map(m=>m.id),[1,2]);
 assert.ok(calls.some(([q,p])=>q==='スター・ウォーズ'&&p===2));
 assert.equal(result.truncated,false);
});
test('handles full width letters, spacing and exact bilingual title evidence without hardcoded franchises',async()=>{
 const calls=[];
 await searchMovies({query:'ＡＢＣ映画',titles:[film(1,'ABC 映画','Example Movie')],fetchPage:async(q)=>{calls.push(q);return {total_pages:1,results:[]};}});
 assert.ok(calls.includes('ABC 映画'));
 assert.ok(calls.includes('Example Movie'));
});
test('deduplicates movies and queries and reports bounded pagination truncation',async()=>{
 let calls=0;
 const result=await searchMovies({query:'Example',titles:[],maxRequests:3,fetchPage:async()=>{calls++;return {total_pages:20,results:[film(1,'Example')]};}});
 assert.equal(calls,3); assert.equal(result.results.length,1); assert.equal(result.truncated,true);
});
test('preserves successful results and reports upstream failures as incomplete',async()=>{
 const result=await searchMovies({query:'Example',titles:[],fetchPage:async(q,page)=>{if(page===2)throw Error('offline');return {total_pages:2,results:[film(1,'Example')]};}});
 assert.equal(result.results.length,1); assert.equal(result.incomplete,true);
});
test('discovers unseeded Japanese spellings with one filtered prefix probe',async()=>{
 const calls=[];
 const result=await searchMovies({query:'ハリーポッター',titles:[],fetchPage:async(q,page)=>{
  calls.push([q,page]);
  if(q==='ハリ')return {total_pages:100,results:[film(1,'ハリー・ポッターと賢者の石','Harry Potter and the Philosopher’s Stone'),film(90,'ハリウッド') ]};
  if(q==='ハリー・ポッター')return {total_pages:1,results:[film(1,'ハリー・ポッターと賢者の石'),film(2,'ハリー・ポッターと秘密の部屋')]};
  return {total_pages:1,results:[]};
 }});
 assert.deepEqual(result.results.map(m=>m.id),[1,2]);
 assert.deepEqual(calls,[['ハリーポッター',1],['ハリ',1],['ハリー・ポッター',1]]);
 assert.equal(result.truncated,false);
});
test('does not probe short or non-Japanese queries or already discovered spellings',async()=>{
 for(const query of ['ハリ','StarWars']){
  const calls=[];
  await searchMovies({query,titles:[],fetchPage:async(q)=>{calls.push(q);return {total_pages:1,results:[]};}});
  assert.deepEqual(calls,[query]);
 }
});
