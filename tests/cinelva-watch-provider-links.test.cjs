const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('search.html','utf8');
const code=html.slice(html.indexOf('function watchProvidersHtml('),html.indexOf('function viewingTimelineHtml('));
const context={URL,encodeURIComponent,E:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))};
vm.runInNewContext(code,context);
const render=(movie,av)=>{assert.equal(typeof context.watchProvidersHtml,'function','shared provider renderer exists');return context.watchProvidersHtml(movie,av)};
test('separates subscriptions, free, rental and purchase and makes provider searches actionable',()=>{
 const out=render({id:157336,title:'インターステラー & 宇宙'},{flatrate:['Netflix','Netflix','Amazon Prime Video'],rent:['Amazon Video'],buy:['Apple TV Store'],free:['YouTube']});
 for(const s of ['見放題','無料','レンタル','購入','JustWatch','netflix.com/search?q=','amazon.co.jp/gp/video/search?phrase=','tv.apple.com/jp/search?term='])assert.ok(out.includes(s),s);
 assert.equal((out.match(/aria-label="Netflixで検索"/g)||[]).length,1);
 assert.ok(out.includes(encodeURIComponent('インターステラー & 宇宙')));
 assert.match(out,/target="_blank" rel="noopener noreferrer"/);
});
test('unknown services use verified source instead of a fabricated provider URL',()=>{
 const out=render({id:42,title:'<script>alert(1)</script>'},{flatrate:['Unknown <Service>'],source_url:'https://www.themoviedb.org/movie/42/watch?locale=JP'});
 assert.ok(out.includes('Unknown &lt;Service&gt;'));assert.ok(out.includes('https://www.themoviedb.org/movie/42/watch?locale=JP'));assert.ok(!out.includes('<script>'));
});
test('rejects injected or wrong-film source URLs and never invents availability',()=>{
 for(const source_url of ['javascript:alert(1)','https://evil.example/','https://www.themoviedb.org/movie/43/watch','https://www.themoviedb.org@evil.example/movie/42/watch']){
 const out=render({id:42,title:'Film'},{source_url});assert.ok(!out.includes(source_url));assert.ok(out.includes('配信情報を確認できていません'));assert.ok(!out.includes('Netflix'));
 }
});
test('provider controls are used by both shared detail routes before long work information',()=>{
 for(const path of ['search.html','cinelva/search.html']){const s=fs.readFileSync(path,'utf8');assert.ok(s.includes("+watchProvidersHtml(m,av)+"),path);assert.ok(s.indexOf('+watchProvidersHtml(m,av)+')<s.indexOf('+screeningRecommendationV3Html(m)'),path);}
});

test('U-NEXT uses the official freeword search route',()=>{const out=render({id:42,title:'短い作品'},{flatrate:['U-NEXT']});assert.ok(out.includes('https://video.unext.jp/freeword?query='));});

test('compact three columns use validated service icons and retain free labels',()=>{const out=render({id:42,title:'作品'},{flatrate:['Netflix'],free:['YouTube'],rent:['Amazon Video'],logos:{Netflix:'/logo.png',YouTube:'https://evil.example/a.png'}});assert.match(out,/>視聴可能なサービス</);assert.equal((out.match(/class="watchProviderGroup"/g)||[]).length,3);assert.match(out,/https:\/\/image.tmdb.org\/t\/p\/w92\/logo.png/);assert.ok(!out.includes('evil.example'));assert.match(out,/<small>無料<\/small>/);assert.match(out,/aria-label="Netflixで検索"/);});
