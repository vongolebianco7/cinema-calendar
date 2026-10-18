const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('search.html', 'utf8');
const helpers = html.includes('function movieReleaseYear(')
  ? html.slice(html.indexOf('function movieReleaseYear('), html.indexOf('async function search()')) : '';
const section = (start, end) => html.slice(html.indexOf(start), html.indexOf(end));
const event = {id:157336, title:'インターステラー', date:'2026-09-01', event:'streaming',
  service:'Prime Video', source:'Official announcement', tmdb:'https://www.themoviedb.org/movie/157336'};

test('local official events resolve authoritative film details using their explicit TMDB identity', async () => {
  for (const film of [event, {...event,tmdb:undefined,tmdb_id:157336}, {...event,id:900001,tmdb:'https://www.themoviedb.org/movie/157336'}]) {
    const calls=[], rendered=[], urls=[];
    const context={API:'https://example.invalid',URL,location:{href:'https://example.invalid/search.html'},history:{replaceState:(_a,_b,url)=>urls.push(String(url))},modal:{classList:{add(){}}},detail:{},
      withTimeout:promise=>promise,loadScreeningEvidence:async()=>({}),renderDetail:m=>rendered.push(m),
      fetch:async url=>{calls.push(url);return {ok:true,json:async()=>url.includes('movie-detail')
        ?{movie:{id:157336,year:'2014',date:'2014-11-05',event:'catalog'}}:{guides:[]}};}};
    vm.runInNewContext(helpers+section('function syncTrailUrl(', 'const FORMAT_ORDER=')+section('async function openMovie(', 'function dnaRoleNote('),context);
    await context.openMovie(film);
    assert.ok(calls.some(url=>url.endsWith('/api/movie-detail?id=157336')),'explicit film identity must load details');
    assert.equal(rendered[0].year,'2014');
    assert.equal(new URL(urls[0]).searchParams.get('id'),'157336','refresh must keep the canonical film identity');
    assert.equal(film.date,'2026-09-01','calendar event date is preserved');
  }
});

test('offline review actions target the canonical film rather than a local event ID', () => {
  const detail={};
  const context={E:String,detail,URLSearchParams,location:{search:''},recordEntryUrl:String,
    CinemapCalendarContext:{read:()=>null},screeningRecommendationV3Html:()=>'',renderMovieInformation:()=>'',viewingTimelineHtml:()=>'',
    document:{getElementById:()=>null,querySelectorAll:()=>[]},criticRegistry:()=>Promise.resolve({})};
  vm.runInNewContext(helpers+section('function renderDetail(', 'document.getElementById("close").onclick='),context);
  context.renderDetail({...event,id:900001});
  assert.match(detail.innerHTML,/data-detail-review data-movie-id="157336"/);
  assert.doesNotMatch(detail.innerHTML,/data-movie-id="900001"/);
});

test('search cards do not use a streaming premiere as the original film year', async () => {
  const grid={innerHTML:'',querySelectorAll:()=>[]};
  const context={q:{value:event.title},API:'https://example.invalid',history:{replaceState(){}},status:{},grid,
    E:String,results:[],fetch:async url=>({ok:true,json:async()=>url.includes('/api/')?{movies:[],external:[]}:{movies:[event]}})};
  vm.runInNewContext(helpers+section('async function search()', 'function syncTrailUrl('),context);
  await context.search();
  assert.doesNotMatch(grid.innerHTML, /class="meta">2026/);
  assert.match(grid.innerHTML,/公開年未確認/);
});

test('offline details retain the event date with its actual meaning', () => {
  const context={E:String};
  vm.runInNewContext(helpers+section('function viewingTimelineHtml(', 'function screeningKnown(')
    +section('function renderMovieInformation(', "document.addEventListener('click',event=>"),context);
  const timeline=context.viewingTimelineHtml(event,{}), info=context.renderMovieInformation(event);
  assert.match(timeline,/2026-09-01/);
  assert.match(timeline,/watchTimelineLabel">配信開始</);
  assert.doesNotMatch(info,/<dt>公開日<\/dt><dd>2026-09-01/);
  assert.equal(event.date,'2026-09-01');
});
