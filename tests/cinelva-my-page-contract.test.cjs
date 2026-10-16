const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const page = fs.readFileSync('my-cinelva/index.html', 'utf8');
const share = fs.readFileSync('my-cinemap.html', 'utf8');

test('My Cinelva is a real-record page without demo, collection, or Atlas controls', () => {
  assert.match(page, /cinelva-library-records\.js/);
  assert.match(page, /cinelva-records-page\.js/);
  assert.match(page, /映画の世界/);
  assert.match(page, /映画賞ヒートマップ/);
  assert.match(page, /監督のフィルモグラフィー/);
  assert.doesNotMatch(page, /デモ|コレクション|コレクションを作成|アトラス|Atlas/);
});

test('share image is generated only from existing viewing records', () => {
  assert.match(share, /cinelva-library-records\.js/);
  assert.match(share, /実績画像/);
  assert.doesNotMatch(share, /自由に作品を追加|映画棚を作成|コレクション/);
});

test('a rerelease search keeps the original catalog year and refreshes authoritative details', async () => {
  const vm = require('node:vm');
  const source = fs.readFileSync('js/cinelva-records-page.js', 'utf8');
  const choose = source.slice(source.indexOf('  async function chooseMovie('), source.indexOf('  function saveRecord()'));
  const film = {id:27205,title:'インセプション',year:2026,genres:['SF'],countries:['US'],director:'Christopher Nolan'};
  const elements = {movieResults:{_movies:[film]},chosenMovie:{},saveRecord:{},recordDialog:{open:true}};
  let detailCalls=0;
  const context={state:{},metadataFor:()=>({...film,year:2010}),$:id=>elements[id],poster:()=>'',AbortSignal,
    fetch:async()=>{detailCalls++;return {ok:true,json:async()=>({movie:{...film,year:'2010'}})}}};
  await vm.runInNewContext(choose+'; chooseMovie(27205)',context);
  assert.equal(detailCalls,1,'complete search metadata can still contain a rerelease year');
  assert.equal(String(context.state.selected.year),'2010');
  assert.match(elements.chosenMovie.textContent,/2010年/);
  assert.equal(elements.saveRecord.disabled,false);
});
