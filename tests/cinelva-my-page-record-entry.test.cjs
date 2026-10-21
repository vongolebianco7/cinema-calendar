'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const detail = fs.readFileSync('search.html', 'utf8');
const records = fs.readFileSync('js/cinelva-records-page.js', 'utf8');
const myPage = fs.readFileSync('my-cinelva/index.html', 'utf8');

test('movie detail opens the shared review dialog for the selected movie', () => {
  assert.match(detail, /data-detail-review data-movie-id=/);
  assert.match(detail, /globalThis\.CinelvaQuickRate\?\.open\(\{id,title\}\)/);
  assert.match(detail, /鑑賞・レビューを記録/);
  assert.match(detail, /else location\.href=recordEntryUrl\(id,title\)/);
  assert.match(detail, /location\.pathname\.split\("\/"\)\.includes\("cinelva"\)\?"\.\.\/my-cinelva\/":"my-cinelva\/"/);
  assert.doesNotMatch(detail, /次へ/);
});

test('detail metadata failure keeps a selected movie record action', () => {
  assert.match(detail, /catch\(\(\)=>\{const title=initialParams\.get\("search"\)\|\|"";detail\.innerHTML/);
  assert.ok(detail.includes("data-detail-review data-movie-id=\"'+E(initialId||'')+'\" data-movie-title=\"'+E(title||'')+'\">鑑賞・レビューを記録</button>"));
});

test('empty record list sends new entries to movie search instead of an unapproved record window', () => {
  assert.match(records, /href="\.\.\/search\.html">映画を検索して記録<\/a>/);
  assert.doesNotMatch(records, /data-add-record/);
  assert.doesNotMatch(myPage, /data-add-record/);
  assert.match(records, /location\.replace\('\.\.\/search\.html\?'/);
});
