const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function render({ records, works, movies = works, name = 'Steven Spielberg', profile = {} }) {
  function element() {
    const node = { dataset:{},attributes:{},options:[],style:{setProperty(){}}, prepend(...children){this.children.unshift(...children)}, children: [], className: '', innerHTML: '', listeners: {},
      replaceChildren() { this.children = []; },
      append(...children) { for(const child of children){this.children=this.children.filter(x=>x!==child);this.children.push(child);} },
      setAttribute(name,value) {this.attributes[name]=value;},
      insertAdjacentElement() {},
      addEventListener(type, listener) { this.listeners[type] = listener; },
      querySelectorAll() { return this.children; },
    };
    node.classList = {
      contains: value => node.className.split(' ').includes(value),
      toggle(value, enabled) { node.className = enabled ? value : ''; },
      remove() { node.className = ''; },
    };
    return node;
  }
  const elements = { directorTimeline: element(), directorWorks: element() };
  const context = {URLSearchParams,
    state: { records, movies, directors: { one: { name, works, ...profile } } },
    recordMovies: () => records,
    enriched: movie => movie,
    escapeHTML: value => String(value ?? ''),
    posterHTML: () => '',
    $: id => elements[id],
    document: { createElement: element },
  };
  const source = fs.readFileSync('js/cinelva-records-page.js', 'utf8');
  const directorView = source.slice(source.indexOf('  const normalizeName ='), source.indexOf('  function drawWorld()'));
  const ratedMovies = source.match(/  const ratedMovies = [^\n]+/)[0];
  const shared=source.match(/^  const filmIdentity=[^\n]+/m)[0]+'\n'+source.match(/^  function detailURL[^\n]+/m)[0];
  vm.runInNewContext(shared+'\n'+ratedMovies + '\n' + directorView + '\nrenderDirectors();', context);
  const picker=elements.directorTimeline.children.find(x=>x.className==='director-picker'),detail=elements.directorTimeline.children.find(x=>x.className==='director-filmography');
  return { row: picker?.children[0], detail, host: elements.directorTimeline };
}

test('director picker and filmography exclude watched shorts from the same counts', () => {
  const feature = { id: 1, title: '長編作品', director: 'Steven Spielberg', year: 1975, runtime: 120, rating: 4 };
  const short = { id: 2, title: '短編作品', director: 'Steven Spielberg', year: 1974, runtime: 10, rating: 3 };
  const unseen = { id: 3, title: '未鑑賞の長編', director: 'Steven Spielberg', year: 1976, runtime: 110 };
  const { row, detail } = render({ records: [feature, short], works: [feature, short, unseen] });
  assert.match(row.attributes['aria-label'], /レビュー済み1本、監督作品総数2本/);
  row.listeners.click();
  assert.match(detail.innerHTML, /1 \/ 2本 採点済み/);
  assert.doesNotMatch(detail.innerHTML, /短編作品/);
});

test('director picker retains authoritative catalog credits over generic metadata', () => {
  const feature = { id: 1, title: '長編作品', director: 'Steven Spielberg', year: 1975, runtime: 120, rating: 4 };
  const rawWork = { id: 2, title: '形式未確認の作品', director: 'Steven Spielberg', year: 1976 };
  const { row, detail } = render({ records: [feature], works: [feature, rawWork], movies: [feature, { ...rawWork, runtime: 15 }] });
  assert.match(row.attributes['aria-label'], /レビュー済み1本、監督作品総数2本/);
  row.listeners.click();
  assert.match(detail.innerHTML, /1 \/ 2本 採点済み/);
  assert.match(detail.innerHTML, /形式未確認の作品/);
});

test('a different director film named Duel with an unknown year keeps the view operable', () => {
  const film = { id: 7, title: 'Duel', director: 'Other Director', runtime: 100, rating: 4 };
  const { row, detail } = render({ records: [film], works: [film], name: 'Other Director' });
  assert.doesNotThrow(() => row.listeners.click());
  assert.match(detail.innerHTML, /年不明/);
});

test('catalog-only directors stay hidden until one of their films is reviewed', () => {
  const film = { id: 8, title: '未鑑賞作品', director: 'Other Director', year: 2020 };
  const { row, host } = render({ records: [], works: [film], name: 'Other Director' });
  assert.equal(row, undefined);
  assert.match(host.innerHTML, /監督情報がある鑑賞記録はまだありません/);
});


test('unreviewed saved films do not add a director selection', () => {
  const film = { id: 9, title: '未レビュー作品', director: 'Other Director', year: 2020, rating: null };
  const { row } = render({ records: [film], works: [film], name: 'Other Director' });
  assert.equal(row, undefined);
});

test('filmography excludes missing and conflicting director credits', () => {
  const film = { id: 10, title: '監督作品', director: 'Other Director', year: 2020, rating: 4 };
  const works = [film,
    { id: 11, title: '担当不明の作品', year: 2021 },
    { id: 12, title: '出演のみの作品', year: 2022, job: 'Actor' },
    { id: 13, title: '別監督の作品', year: 2023, director: 'Someone Else' },
  ];
  const { row, detail } = render({ records: [film], works, name: 'Other Director' });
  assert.match(row.attributes['aria-label'], /レビュー済み1本、監督作品総数1本/);
  row.listeners.click();
  assert.doesNotMatch(detail.innerHTML, /担当不明|出演のみ|別監督/);
});


test('zero-score films do not expose a director under the current reviewed-only rule', () => {
  const film = { id: 14, title: '採点なしの鑑賞作品', director: 'Other Director', year: 2020, runtime: 120, rating: 0 };
  const { row, host } = render({ records: [film], works: [film], name: 'Other Director' });
  assert.equal(row, undefined);
  assert.match(host.innerHTML, /監督情報がある鑑賞記録はまだありません/);
});

test('a reviewed director includes every watched feature in progress', () => {
  const reviewed = { id: 20, title: 'レビュー済み', director: 'Other Director', year: 2020, runtime: 120, rating: 4 };
  const unrated = { id: 21, title: '鑑賞済み評価なし', director: 'Other Director', year: 2021, runtime: 120, rating: 0 };
  const unseen = { id: 22, title: '未鑑賞', director: 'Other Director', year: 2022, runtime: 120 };
  const { row, detail } = render({ records: [reviewed, unrated], works: [reviewed, unrated, unseen], name: 'Other Director' });
  assert.match(row.attributes['aria-label'], /レビュー済み2本、監督作品総数3本/);
  row.listeners.click();
  assert.match(detail.innerHTML, /2 \/ 3本 採点済み/);
});

test('Japanese aliases connect original-name records to sourced profile and full credits', () => {
  const film = { id: 30, title: '監督作品', director: 'Example Director', year: 2020, rating: 4 };
  const profile = { nameJa: 'エグザンプル・ディレクター', original_name: 'Example Director', also_known_as: ['Example D.'], name_status: 'transliterated', profile_path: '/director.jpg', birthday: '1970-01-02', biography_ja: '日本語の紹介', source_url: 'https://www.themoviedb.org/person/1', coverage: { truncated: false } };
  const { row, detail } = render({ records: [film], works: [film], name: 'エグザンプル・ディレクター', profile });
  assert.match(row.innerHTML, /エグザンプル・ディレクター/);
  row.listeners.click();
  assert.match(detail.innerHTML, /https:\/\/image.tmdb.org\/t\/p\/w185\/director.jpg/);
  assert.match(detail.innerHTML, /1970-01-02/);
  assert.match(detail.innerHTML, /日本語の紹介/);
  assert.match(detail.innerHTML, /<details class="director-biography"><summary>経歴を読む<\/summary>/);
  assert.match(detail.innerHTML, /原名：Example Director/);
  assert.match(detail.innerHTML, /原名からのカタカナ表記/);
  assert.match(detail.innerHTML, /本数による切り捨てなし/);
  assert.match(detail.innerHTML, /監督の出典情報/);
});

test('an imported local ID and its TMDB film count as one watched director work', () => {
  const film = { id: 42, title: '同じ監督作品', director: 'Other Director', year: 2020, runtime: 120 };
  const imported = { ...film, id: 900001, tmdbId: 42, rating: 4.2 };
  const before = JSON.stringify(imported);
  const { row, detail } = render({ records: [imported], works: [film], name: 'Other Director' });
  assert.match(row.attributes['aria-label'], /レビュー済み1本、監督作品総数1本/);
  row.listeners.click();
  assert.equal((detail.innerHTML.match(/class="director-film-tile /g) || []).length, 1);
  assert.match(detail.innerHTML, /search\.html\?id=42"/);
  assert.match(detail.innerHTML, /★ 4\.2/);
  assert.equal(JSON.stringify(imported), before, 'rendering must not migrate stored IDs');
});

test('an explicit TMDB ID does not mark a conflicting local-ID film watched', () => {
  const film = { id: 42, title: '未鑑賞の別作品', director: 'Other Director', year: 2020, runtime: 120 };
  const imported = { id: 42, tmdbId: 99, title: '実際の鑑賞作品', director: 'Other Director', year: 2021, runtime: 100, rating: 4 };
  const { row, detail } = render({ records: [imported], works: [film], name: 'Other Director' });
  assert.match(row.attributes['aria-label'], /レビュー済み1本、監督作品総数2本/);
  row.listeners.click();
  assert.match(detail.innerHTML, /is-unwatched[^]*?未鑑賞の別作品/);
  assert.match(detail.innerHTML, /search\.html\?id=99"/);
});


test('duplicate imported aliases of one director film do not inflate the counter', () => {
  const film = { id: 42, title: '同一作品', director: 'Other Director', year: 2020, runtime: 120 };
  const { row } = render({ records: [{ ...film, rating: 4 }, { ...film, id: 900001, tmdb_id: 42, rating: 3 }], works: [film], name: 'Other Director' });
  assert.match(row.attributes['aria-label'], /レビュー済み1本、監督作品総数1本/);
});


test('missing director catalog never presents saved records as the filmography total', () => {
  const film = { id: 1, title: '鑑賞作品', director: 'Clint Eastwood', rating: 4 };
  const { row, detail } = render({ records: [film], works: [], name: 'Other Director' });
  assert.match(row.attributes['aria-label'], /レビュー済み1本、監督作品総数未確認/);
  assert.doesNotMatch(row.innerHTML, /1\/1本/);
  row.listeners.click();
  assert.match(detail.innerHTML, /作品の一覧は未取得/);
  assert.doesNotMatch(detail.innerHTML, /director-progress-track|1 \/ 1本|収録作品 1本/);
});

test('ヴ and ブ spelling variants resolve to one sourced director identity', () => {
  const film = { id: 501, title: '監督作品', director: 'スティーヴン・スピルバーグ', year: 2001, runtime: 120, rating: 4 };
  const { row, detail } = render({
    records: [film],
    works: [{ ...film, director: 'スティーブン・スピルバーグ', rating: undefined }],
    name: 'スティーブン・スピルバーグ',
    profile: { id: 190, nameJa: 'スティーブン・スピルバーグ', original_name: 'Steven Spielberg', also_known_as: ['スティーヴン・スピルバーグ'] },
  });
  assert.match(row.attributes['aria-label'], /レビュー済み1本、監督作品総数1本/);
  row.listeners.click();
  assert.match(detail.innerHTML, /1 \/ 1本 採点済み/);
});

test('one-character name difference does not merge distinct unsourced people', () => {
  const first = { id: 601, title: '作品A', director: '山田太郎', runtime: 120, rating: 4 };
  const second = { id: 602, title: '作品B', director: '山田次郎', runtime: 120, rating: 4 };
  const { host } = render({ records: [first, second], works: [first], name: '山田太郎' });
  assert.equal(host.children.find(x=>x.className==='director-picker').children.length, 2);
});

test('incomplete Spielberg catalog never reports a false 1/1 total', () => {
  const film = { id: 901, title: '監督作', director: 'Steven Spielberg', runtime: 120, rating: 4 };
  const { row, detail } = render({ records: [film], works: [film], profile: { id: 488, coverage:{truncated:true} } });
  assert.match(row.attributes['aria-label'], /監督作品総数未確認/);
  assert.doesNotMatch(row.innerHTML, /1\/1本/);
  row.listeners.click();
  assert.doesNotMatch(detail.innerHTML, /1 \/ 1本 採点済み/);
});

test('complete Spielberg catalog can show a sourced denominator', () => {
  const films = Array.from({ length: 12 }, (_, n) => ({
    id: 1000 + n, title: '監督作' + n, director: 'Steven Spielberg', runtime: 120, year: 1980+n
  }));
  const { row } = render({ records: [{ ...films[0], rating: 4 }], works: films, profile: { id: 488, coverage: { truncated: false } } });
  assert.match(row.attributes['aria-label'], /レビュー済み1本、監督作品総数12本/);
});

test('kana variants in sourced credit names retain every directed film', () => {
  const rated = { id: 90001, title: '鑑賞作', director: 'スティーヴン・スピルバーグ', runtime: 120, rating: 4 };
  const works = Array.from({length:12}, (_,i) => ({
    id:90001+i, title:'映画'+i, director:'スティーブン・スピルバーグ',
    job:'Director', is_director:true, runtime:120, year:2000+i
  }));
  const {row,detail}=render({records:[rated], works, name:'スティーブン・スピルバーグ', profile:{
    id:488, nameJa:'スティーブン・スピルバーグ', original_name:'Steven Spielberg',
    also_known_as:['スティーヴン・スピルバーグ'], coverage:{truncated:false}
  }});
  assert.match(row.attributes['aria-label'], /レビュー済み1本、監督作品総数12本/);
  row.listeners.click();
  assert.match(detail.innerHTML,/1 \/ 12本 採点済み/);
});

test('TMDB runtime-unverified shorts do not leak into director feature count', () => {
  const long = { id: 7100, title:'長編', director:'Other Director', source:'tmdb', job:'Director', runtime:110, rating:4 };
  const unknown = { id: 7101, title:'短編らしい作品', director:'Other Director', source:'tmdb', job:'Director' };
  const short = { id: 7102, title:'短編', director:'Other Director', source:'tmdb', job:'Director', runtime:19 };
  const {row,detail}=render({records:[long],works:[long,unknown,short],name:'Other Director'});
  assert.match(row.attributes['aria-label'], /レビュー済み1本、監督作品総数1本/);
  row.listeners.click();
  assert.doesNotMatch(detail.innerHTML,/短編らしい作品|短編/);
});

test('verified TMDB feature and unknown-runtime directing credits remain distinct', () => {
  const watched={id:7110,title:'鑑賞した長編',director:'Other Director',rating:4,runtime:125};
  const known={...watched,source:'tmdb',job:'Director'};
  const unknown={id:7111,title:'未確認作品',source:'tmdb',director:'Other Director',job:'Director'};
  const {row}=render({records:[watched],works:[known,unknown],name:'Other Director'});
  assert.match(row.attributes['aria-label'], /レビュー済み1本、監督作品総数2本/);
});

test('30-minute films remain, while 29-minute films are excluded', () => {
  const rated = { id: 8300, title: '30分作品', director: 'Other Director', runtime: 30, rating: 4 };
  const under = { id: 8301, title: '29分作品', director: 'Other Director', runtime: 29 };
  const fortyFive = { id: 8302, title: '45分作品', director: 'Other Director', runtime: 45 };
  const { row, detail } = render({ records: [rated], works: [rated, under, fortyFive], name: 'Other Director' });
  assert.match(row.attributes['aria-label'], /レビュー済み1本、監督作品総数2本/);
  row.listeners.click();
  assert.match(detail.innerHTML, /30分作品/);
  assert.match(detail.innerHTML, /45分作品/);
  assert.doesNotMatch(detail.innerHTML, /29分作品/);
});

test('Paul Thomas Anderson partial TMDB catalog never reports a false 1/1 total', () => {
  const film={id:7345,title:'ゼア・ウィル・ビー・ブラッド',director:'Paul Thomas Anderson',runtime:158,rating:4.5,source:'tmdb',job:'Director'};
  const {row,detail}=render({records:[film],works:[film],name:'Paul Thomas Anderson',profile:{id:4762,original_name:'Paul Thomas Anderson',coverage:{truncated:true}}});
  assert.match(row.attributes['aria-label'], /監督作品総数未確認/);
  assert.doesNotMatch(row.innerHTML,/1\/1本/);
  row.listeners.click();
  assert.doesNotMatch(detail.innerHTML,/1 \/ 1本 採点済み/);
});

test('Paul Thomas Anderson shows real denominator after 8 verified features', () => {
  const works=Array.from({length:9},(_,i)=>({id:85000+i,title:'長編'+i,director:'Paul Thomas Anderson',runtime:100+i,source:'tmdb',job:'Director',is_director:true,year:2000+i}));
  const {row}=render({records:[{...works[0],rating:4}],works,name:'Paul Thomas Anderson',profile:{id:4762,original_name:'Paul Thomas Anderson',coverage:{truncated:false,runtime_unverified:0}}});
  assert.match(row.attributes['aria-label'], /レビュー済み1本、監督作品総数9本/);
});

test('sourced PTA films are not vetoed by conflicting generic movie metadata', () => {
  const works=Array.from({length:12},(_,i)=>({id:95000+i,title:'PTA作品'+i,director:'ポール・トーマス・アンダーソン',runtime:110+i,source:'tmdb',job:'Director',is_director:true}));
  const record={...works[0],rating:4};
  const movies=works.map((work,i)=>({...work,director:i===0?work.director:'別名の監督',runtime:i===0?work.runtime:undefined,job:i===0?'Director':'Producer'}));
  const {row}=render({records:[record],works,movies,name:'ポール・トーマス・アンダーソン',profile:{id:4762,nameJa:'ポール・トーマス・アンダーソン',coverage:{truncated:false}}});
  assert.match(row.attributes['aria-label'],/監督作品総数12本/);
});

test('legacy director spelling resolves a unique TMDB person from rated movie credit', () => {
  const works=Array.from({length:12},(_,i)=>({id:97000+i,title:'長編'+i,director:'ポール・トーマス・アンダーソン',director_id:4762,job:'Director',is_director:true,runtime:110+i,source:'tmdb'}));
  const reviewed={id:97000,title:'長編0',director:'Paul T Anderson',director_id:4762,rating:4,runtime:110};
  const {row}=render({records:[reviewed],works,name:'ポール・トーマス・アンダーソン',profile:{id:4762,coverage:{truncated:false}}});
  assert.match(row.innerHTML,/12/);
  assert.doesNotMatch(row.innerHTML,/監督作品総数<\/small><\/span><span><b>—/);
});

test('a unique source movie credit resolves old spellings without explicit person id', () => {
  const works=Array.from({length:9},(_,i)=>({id:98000+i,title:'作品'+i,director:'サム・ハーグレイヴ',job:'Director',is_director:true,runtime:100,source:'tmdb'}));
  const reviewed={id:98000,title:'作品0',director:'Sam Hargreave',rating:4,runtime:100};
  const {row}=render({records:[reviewed],works,name:'サム・ハーグレイヴ',profile:{id:1120883,coverage:{truncated:false}}});
  assert.match(row.innerHTML,/9/);
});
