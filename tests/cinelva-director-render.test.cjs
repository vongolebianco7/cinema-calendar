const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function render({ records, works, movies = works, name = 'Steven Spielberg' }) {
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
    state: { records, movies, directors: { one: { name, works } } },
    recordMovies: () => records,
    enriched: movie => movie,
    escapeHTML: value => String(value ?? ''),
    posterHTML: () => '',
    $: id => elements[id],
    document: { createElement: element },
  };
  const source = fs.readFileSync('js/cinelva-records-page.js', 'utf8');
  const directorView = source.slice(source.indexOf('  const normalizeName ='), source.indexOf('  function drawWorld()'));
  const ratedMovies = source.match(/  const ratedMovies =[^\n]+/)[0];
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
  const rawWork = { id: 2, title: '形式未確認の作品', year: 1976 };
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

test('watched but unreviewed directors stay hidden', () => {
  for (const rating of [null, 0]) {
    const film = { id: 9, title: '未レビューの鑑賞作品', director: 'Other Director', year: 2020, runtime: 120, rating };
    const { row, host } = render({ records: [film], works: [film], name: 'Other Director' });
    assert.equal(row, undefined);
    assert.match(host.innerHTML, /監督情報がある鑑賞記録はまだありません/);
  }
});
