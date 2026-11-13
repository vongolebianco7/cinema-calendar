const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('rankings.html', 'utf8');
const groupedSource = html.slice(html.indexOf('function isGroupedBoxTitle('), html.indexOf('let boxMovieIndexPromise='));
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
for (const title of [
  '仮面ライダーオーズ WONDERFUL 将軍と21のコアメダル 海賊戦隊ゴーカイジャー THE MOVIE',
  '仮面ライダーオーズ THE MOVIE みんなで宇宙キターッ! 特命戦隊ゴーバスターズ THE MOVIE',
  '仮面ライダージオウ Over Quartzer 騎士竜戦隊リュウソウジャー THE MOVIE',
  'ポケモン・ザ・ムービーXY 光輪(リング)の超魔神フーパ ピカチュウとポケモンおんがくたい',
  '「作品A」「作品B」',
  '『作品A』『作品B』',
  '男はつらいよ 寅次郎サラダ記念日/釣りバカ日誌',
  'ドラえもん のび太とアニマル惑星/チンプイ',
  'リング/らせん',
  '仮面ライダー作品/戦隊作品',
  '作品A」/ピカチュウと作品B',
  '劇場版 A/劇場版 B'
]) assert.equal(context.isGroupedBoxTitle(title), true, `grouped source row is blocked from single-title lookup: ${title}`);
for (const title of ['007/ムーンレイカー', 'ケイゾク/映画', '映画 仮面ライダーオーズ WONDERFUL 将軍と21のコアメダル', '映画A/B']) {
  assert.equal(context.isGroupedBoxTitle(title), false, `ordinary single title remains eligible: ${title}`);
}

const card = {
  dataset: { boxFilm: '映画A / 映画B', boxYear: '1980' },
  querySelector: () => { throw new Error('grouped rows must keep their explicit placeholder'); }
};

context.hydrateOneBoxCard(card).then(() => {
  assert.equal(fetchOneCalls, 0, 'grouped rows never request a single-film identity');
  console.log('Grouped box-office rows fail closed without single-film artwork requests.');
}).catch(error => { console.error(error); process.exitCode = 1; });
