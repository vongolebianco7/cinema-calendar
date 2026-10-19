const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('my-cinelva/index.html', 'utf8');
const records = fs.readFileSync('js/cinelva-records-page.js', 'utf8');
const quickRate = fs.readFileSync('js/cinelva-quick-rate.js', 'utf8');

test('award navigation uses natural Japanese wording', () => {
  assert.match(html, /映画賞ランキングを見る/);
  assert.doesNotMatch(html, /映画賞ランキングへ/);
});

test('inline rating stores zero as a real score and offers only cinema or streaming', () => {
  assert.match(quickRate, /Records\.save\(\{\.\.\.movie,\.\.\.latest,id:String\(latest\?\.id\?\?id\),tmdbId:id,title:[^;]+\},score,latest\?\.watchedAt\?\?null\)/);
  assert.match(quickRate, /<option value="映画館">映画館<\/option><option value="配信">配信<\/option>/);
  assert.doesNotMatch(quickRate, /<option value="TV">|<option value="その他">/);
});

test('quick-rate source has no next-film action', () => {
  assert.doesNotMatch(quickRate, /function nextMovie\s*\(/);
  assert.doesNotMatch(quickRate, /保存して次へ/);
});

test('annual history keeps the agreed 3 by 4 calendar, medal reward, and active tab', () => {
  assert.match(html, /#summaryView #yearHeatmap\.cinelva-annual-calendar[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(records, /const achieved=count>=5;/);
  assert.match(records, /const medal='<span class="cy-medal" aria-label="金メダル"><svg/);
  assert.match(records, /<circle cx="12" cy="7" r="4"/);
  assert.doesNotMatch(records + html, /👑|習慣/);
  assert.match(records, /sessionStorage\.setItem\(TAB_STORAGE_KEY, tab\)/);
  assert.match(records, /const savedTab = sessionStorage\.getItem\(TAB_STORAGE_KEY\)/);
});

test('award heatmap cells still show watched and unwatched films', () => {
  assert.match(records, /data-award-cell=/);
  assert.match(records, /is-watched/);
  assert.match(records, /is-unwatched/);
  assert.match(records, /data-film-controls=/);
});

test('director and award selections return to the searchable list', () => {
  assert.match(records, /location\.href='\.\.\/search\.html\?'\+new URLSearchParams\(\{search:title\}\)/);
  assert.doesNotMatch(records, /function openKnownMovie\([^]*?CinelvaQuickRate\.open/);
});
