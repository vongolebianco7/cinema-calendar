const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('search.html', 'utf8');
const start = source.indexOf('function renderMovieInformation(');
assert.ok(start >= 0, '作品情報の描画関数が必要');
const end = source.indexOf('function renderDetail(', start);
const context = {encodeURIComponent, E: value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'), dnaRoleNote: () => '', relatedHtml: () => '<button class="relatedWork" data-r="0">関連作A</button>'};
vm.createContext(context);
vm.runInContext(source.slice(start,end), context);
const movie = {
  id: 42, title:'作品', year:2024, runtime:150, genres:['ドラマ'], countries:['アメリカ'],
  director:'監督A', cast:['俳優A','俳優A','俳優B'],
  dna:{directors:[{id:1,name:'監督A'}],writers:[{id:2,name:'クリストファー・ノーラン'},{id:2,name:'クリストファー・ノーラン'}],cinematography:[{id:3,name:'撮影A'}],music:[{id:4,name:'音楽A'}],editing:[{id:5,name:'編集A'}],production:[{name:'製作会社A'}]}
};
const html=context.renderMovieInformation(movie);
for(const title of ['基本情報','作り手','キャスト','製作情報','関連作品']) assert.ok(html.includes(title), title);
assert.equal((html.match(/クリストファー・ノーラン/g)||[]).length, 1, '同じ脚本家を一度だけ表示');
assert.equal((html.match(/監督A/g)||[]).length, 1, '監督の簡易表示とリンク表示を重複させない');
assert.equal((html.match(/俳優A/g)||[]).length, 1, 'キャストも重複排除');
assert.ok(html.includes('discover.html?person=2&role='), '作り手リンクを維持');
assert.ok(html.includes('撮影A') && html.includes('音楽A') && html.includes('編集A') && html.includes('製作会社A'));
assert.ok(!html.includes('映画DNA'));
const linked=context.renderMovieInformation({...movie, related:[{title:'関連作A'}]});
assert.ok(linked.includes('relatedWork') && linked.includes('関連作A'), '関連作品を作品情報内に保持');
const fallback=context.renderMovieInformation({id:9,director:'監督B',cast:['俳優C'],dna:{},related:[]});
assert.ok(fallback.includes('監督B') && fallback.includes('俳優C'));
assert.ok(!fallback.includes('undefined'));
console.log('movie information rendering: OK');
