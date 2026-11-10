const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('rankings.html', 'utf8');
const groupedSource = html.slice(html.indexOf('const isGroupedBoxTitle='), html.indexOf('let boxMovieIndexPromise='));
const hydrateSource = html.slice(html.indexOf('async function hydrateOneBoxCard('), html.indexOf('function hydrateBoxCardsLazy('));

let fetchOneCalls = 0;
const context = {
  window: { CinelvaMovieIdentity: { fetchOne: async () => { fetchOneCalls += 1; return { tmdbId: 1, poster: '/wrong.jpg' }; } } },
  resolveMovie: async () => { throw new Error('grouped rows must not use fallback resolution'); },
  boxPosterUrl: value => value || ''
};
vm.runInNewContext(`${groupedSource}${hydrateSource};globalThis.isGroupedBoxTitle=isGroupedBoxTitle;globalThis.hydrateOneBoxCard=hydrateOneBoxCard`, context);

assert.equal(context.isGroupedBoxTitle('映画A / 映画B'), true);
assert.equal(context.isGroupedBoxTitle('映画A/B'), false);

const card = {
  dataset: { boxFilm: '映画A / 映画B', boxYear: '1980' },
  querySelector: () => { throw new Error('grouped rows must keep their explicit placeholder'); }
};

context.hydrateOneBoxCard(card).then(() => {
  assert.equal(fetchOneCalls, 0, 'grouped rows never request a single-film identity');
  console.log('Grouped box-office rows fail closed without single-film artwork requests.');
}).catch(error => { console.error(error); process.exitCode = 1; });
