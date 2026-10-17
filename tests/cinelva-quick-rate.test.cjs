const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync('js/cinelva-quick-rate.js','utf8');
const library=fs.readFileSync('js/cinelva-library-records.js','utf8');
test('title normalization ignores punctuation, spacing and width',()=>{
  const fn=/const normalize=x=>([^;]+);/.exec(src);
  assert.ok(fn);
  const normalize=vm.runInNewContext('(x)=>'+fn[1]);
  assert.equal(normalize('スター・ウォーズ'),normalize('スターウォーズ'));
  assert.equal(normalize('ＳＴＡＲ　ＷＡＲＳ'),normalize('star wars'));
});
test('quick rating exists on all three current list views',()=>{
  for(const page of ['index.html','rankings.html','search.html']){
    const html=fs.readFileSync(page,'utf8');
    assert.match(html,/js\/cinelva-library-records\.js/);
    assert.match(html,/js\/cinelva-quick-rate\.js/);
  }
  assert.match(src,/cinelva-rate-button/);
  assert.match(src,/保存して次へ/);
  assert.match(src,/cinelvaRateComment/);
  assert.match(src,/cinelvaRatePlace/);
  assert.match(src,/value="0"/);
});
test('movie search locally normalizes aliases and Japanese middle dot',()=>{
  const html=fs.readFileSync('search.html','utf8');
  assert.match(html,/CinelvaQuickRate\.normalize/);
  assert.match(html,/data\/movies\.json/);
  assert.match(html,/m\.aliases\|\|\[\]/);
});
test('record comments and viewing method survive edits without overwriting originals',()=>{
  const data=new Map();
  const ctx={localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}};
  vm.createContext(ctx);vm.runInContext(library,ctx);
  const api=ctx.CinelvaLibraryRecords;
  api.save({id:123,title:'Film',comment:'良かった',viewingMethod:'映画館'},0,'2026');
  api.save({id:123,title:'Film'},4,'2026-10');
  let row=api.all()[0];
  assert.equal(row.comment,'良かった');
  assert.equal(row.viewingMethod,'映画館');
  assert.equal(row.rating,4);
  assert.equal(row.watchedAt,'2026-10');
  assert.throws(()=>api.save({id:124,title:'Bad',comment:'x'.repeat(2001)},1,null),/コメント/);
  assert.throws(()=>api.save({id:124,title:'Bad',viewingMethod:'other'},1,null),/鑑賞方法/);
});

test('saved comment and viewing method appear safely in the existing My CINELVA list',()=>{
 const page=fs.readFileSync('js/cinelva-records-page.js','utf8');
 assert.match(page,/movie\.viewingMethod\?'<small>'\+escapeHTML\(movie\.viewingMethod\)/);
 assert.match(page,/movie\.comment\?'<p class="record-comment">'\+escapeHTML\(movie\.comment\)/);
});
