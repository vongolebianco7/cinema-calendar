const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function render({ records, works, movies = works, name = 'Steven Spielberg', profile = {} }) {
  function element() {
    const node = { children: [], className: '', innerHTML: '', listeners: {},
      replaceChildren() { this.children = []; },
      append(...children) { this.children.push(...children); },
      setAttribute() {},
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
  const context = {
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
  vm.runInNewContext(ratedMovies + '\n' + directorView + '\nrenderDirectors();', context);
  const [picker, detail] = elements.directorTimeline.children;
  return { row: picker?.children[0], detail, host: elements.directorTimeline };
}

test('director picker and filmography exclude watched shorts from the same counts', () => {
  const feature = { id: 1, title: '長編作品', director: 'Steven Spielberg', year: 1975, runtime: 120, rating: 4 };
  const short = { id: 2, title: '短編作品', director: 'Steven Spielberg', year: 1974, runtime: 10, rating: 3 };
  const unseen = { id: 3, title: '未鑑賞の長編', director: 'Steven Spielberg', year: 1976, runtime: 110 };
  const { row, detail } = render({ records: [feature, short], works: [feature, short, unseen] });
  assert.match(row.innerHTML, /<strong>1\/2本<\/strong>/);
  row.listeners.click();
  assert.match(detail.innerHTML, /1 \/ 2本 鑑賞済み/);
  assert.doesNotMatch(detail.innerHTML, /短編作品/);
});

test('director picker applies enriched metadata exclusions to its denominator', () => {
  const feature = { id: 1, title: '長編作品', director: 'Steven Spielberg', year: 1975, runtime: 120, rating: 4 };
  const rawWork = { id: 2, title: '形式未確認の作品', director: 'Steven Spielberg', year: 1976 };
  const { row, detail } = render({ records: [feature], works: [feature, rawWork], movies: [feature, { ...rawWork, runtime: 15 }] });
  assert.match(row.innerHTML, /<strong>1\/1本<\/strong>/);
  row.listeners.click();
  assert.match(detail.innerHTML, /1 \/ 1本 鑑賞済み/);
  assert.doesNotMatch(detail.innerHTML, /形式未確認の作品/);
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
  assert.match(row.innerHTML, /<strong>1\/1本<\/strong>/);
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
  assert.match(row.innerHTML, /<strong>2\/3本<\/strong>/);
  row.listeners.click();
  assert.match(detail.innerHTML, /2 \/ 3本 鑑賞済み/);
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
  assert.match(row.innerHTML, /<strong>1\/1本<\/strong>/);
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
  assert.match(row.innerHTML, /<strong>1\/2本<\/strong>/);
  row.listeners.click();
  assert.match(detail.innerHTML, /is-unwatched[^]*?未鑑賞の別作品/);
  assert.match(detail.innerHTML, /search\.html\?id=99"/);
});


test('duplicate imported aliases of one director film do not inflate the counter', () => {
  const film = { id: 42, title: '同一作品', director: 'Other Director', year: 2020, runtime: 120 };
  const { row } = render({ records: [{ ...film, rating: 4 }, { ...film, id: 900001, tmdb_id: 42, rating: 3 }], works: [film], name: 'Other Director' });
  assert.match(row.innerHTML, /<strong>1\/1本<\/strong>/);
});


test('missing director catalog never presents saved records as the filmography total', () => {
  const film = { id: 1, title: '鑑賞作品', director: 'Clint Eastwood', rating: 4 };
  const { row, detail } = render({ records: [film], works: [], name: 'Other Director' });
  assert.match(row.innerHTML, /鑑賞1本.*総数未取得/);
  assert.doesNotMatch(row.innerHTML, /1\/1本/);
  row.listeners.click();
  assert.match(detail.innerHTML, /総数未取得/);
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
  assert.match(row.innerHTML, /1\\/1本/);
  row.listeners.click();
  assert.match(detail.innerHTML, /1 \\/ 1本 鑑賞済み/);
});

test('one-character name difference does not merge distinct unsourced people', () => {
  const first = { id: 601, title: '作品A', director: '山田太郎', runtime: 120, rating: 4 };
  const second = { id: 602, title: '作品B', director: '山田次郎', runtime: 120, rating: 4 };
  const { host } = render({ records: [first, second], works: [first], name: '山田太郎' });
  assert.equal(host.children[0].children.length, 2);
});

test('incomplete Spielberg catalog never reports a false 1/1 total', () => {
  const film = { id: 901, title: '監督作', director: 'Steven Spielberg', runtime: 120, rating: 4 };
  const { row, detail } = render({ records: [film], works: [film], profile: { id: 488 } });
  assert.match(row.innerHTML, /総数未取得/);
  assert.doesNotMatch(row.innerHTML, /1\\/1本/);
  row.listeners.click();
  assert.doesNotMatch(detail.innerHTML, /1 \\/ 1本 鑑賞済み/);
});

test('complete Spielberg catalog can show a sourced denominator', () => {
  const films = Array.from({ length: 12 }, (_, n) => ({
    id: 1000 + n, title: '監督作' + n, director: 'Steven Spielberg', runtime: 120, year: 1980+n
  }));
  const { row } = render({ records: [{ ...films[0], rating: 4 }], works: films, profile: { id: 488, coverage: { truncated: false } } });
  assert.match(row.innerHTML, /1\\/12本/);
});
