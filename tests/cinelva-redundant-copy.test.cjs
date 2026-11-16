const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');

test('circled explanatory copy is removed while page titles and actions remain',()=>{
 const calendars=['index.html','cinelva/index.html'];
 for(const file of calendars){
  const html=read(file);
  assert.match(html,/<h1>映画カレンダー<\/h1>/);
  assert.doesNotMatch(html,/劇場公開、配信開始、TV放映、映画祭(?:・イベント)?をひとつに。気になる作品から上映館や作品情報まで辿れます。/);
  assert.match(html,/data-mode="theatrical"/);
 }
 for(const file of ['discover.html','cinelva/discover.html']){
  const html=read(file);
  assert.match(html,/<h1>見る映画を探す<\/h1>/);
  assert.doesNotMatch(html,/タイトルが決まっていなくても、気分・年代・評価・上映時間・テーマから映画を掘る。/);
  assert.doesNotMatch(html,/TMDBが日本向けに掲載している上映中作品/);
  assert.doesNotMatch(html,/情報提供：TMDB|data-now-observed/);
  assert.match(html,/data-now-status role="status" aria-live="polite"/);
 }
 const theaters=read('theaters.html');
 assert.match(theaters,/<h1>映画館を探す<\/h1>/);
 assert.doesNotMatch(theaters,/地域や映画館名から探せます。|選んだ地域・時間帯の安い料金を表示します。|大人1名・通常2Dの税込料金です。/);
 assert.match(theaters,/id="discounts"/);
 const discounts=read('js/cinelva-cinema-discounts-ui.js');
 assert.doesNotMatch(discounts,/選んだ地域・時間帯の安い料金を表示します。|大人1名・通常2Dの税込料金です。/);
 assert.match(discounts,/id="discountPrefOpen"/);
 assert.match(discounts,/id="discountCalendar"/);
 const rankings=read('rankings.html');
 assert.match(rankings,/<h1>ランキング<\/h1>/);
 assert.doesNotMatch(rankings,/ユーザー評価、興行収入、受賞歴から映画を横断して見る。/);
 const specials=read('specials.html');
 assert.match(specials,/<h1 id="pageTitle">特集・診断<\/h1>/);
 assert.doesNotMatch(specials,/映画を、いつもと違う角度から。|非公式ファン企画です。TBSテレビとは関係ありません。/);
 assert.match(specials,/vivant-diagnosis\.html/);
 const best10=read('my-best10.html');
 assert.match(best10,/<h1>My Cinelva Best 10<\/h1>/);
 assert.doesNotMatch(best10,/好きな映画を、美しく残す。あなただけのランキングを一枚に。|途中へ挿入すると、それ以降の順位が1つずつ下がります。/);
 assert.match(best10,/id="insertAt"/);
 assert.match(best10,/id="applyTopRatings"/);
 const tools=read('js/my-cinemap-tools.js');
 assert.match(tools,/shelf\.hidden=candidates\.length===0/);
 assert.doesNotMatch(tools,/迷っている作品をここへ置けます。/);
});
