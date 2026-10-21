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

test('zero means unwatched and the shared editor retains viewing method choices', () => {
  assert.match(quickRate, /Number\(\$\('cinelvaRateScore'\)\.value\)===0/);
  assert.match(quickRate, /Records\.remove\(selected\.id\)/);
  assert.match(quickRate, /step="0\.1"/);
  for(const method of ['映画館','配信・サブスク','TV','DVD・Blu-ray','その他']) assert.ok(quickRate.includes('value="'+method+'"'));
});

test('quick-rate source has no next-film action', () => {
  assert.doesNotMatch(quickRate, /function nextMovie\s*\(/);
  assert.doesNotMatch(quickRate, /保存して次へ/);
});

test('annual history keeps the agreed 4 by 3 blue calendar, and active tab', () => {
  assert.match(html, /#summaryView #yearHeatmap\.cinelva-annual-calendar\{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.doesNotMatch(records, /achieved\?'gold-month'/);
  assert.match(records, /count>=4\?'deep-month'/);
  assert.doesNotMatch(records + html, /👑|習慣/);
  assert.match(records, /sessionStorage\.setItem\(TAB_STORAGE_KEY, tab\)/);
  assert.match(records, /const savedTab = sessionStorage\.getItem\(TAB_STORAGE_KEY\)/);
});

test('award heatmap cells still show watched and unwatched films', () => {
  assert.match(records, /data-award-cell=/);
  assert.match(records, /seen\?'鑑賞済み'/);
  assert.match(records, /entryId\?'未鑑賞'/);
  assert.match(records, /data-award-review-id/);
  assert.match(records, /CinelvaQuickRate\.mountInline/);
});

test('director and award selections return to the searchable list', () => {
  assert.match(records, /location\.href='\.\.\/search\.html\?'\+new URLSearchParams\(\{search:title\}\)/);
  assert.doesNotMatch(records, /function openKnownMovie\([^]*?CinelvaQuickRate\.open/);
});
