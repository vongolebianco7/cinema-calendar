'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const detail = fs.readFileSync('search.html', 'utf8');
const records = fs.readFileSync('js/cinelva-records-page.js', 'utf8');
const myPage = fs.readFileSync('my-cinelva/index.html', 'utf8');

test('movie detail sends the selected title to the existing searchable listing', () => {
  assert.ok(detail.includes('recordEntryUrl(id,title)'));
  assert.ok(detail.includes('location.pathname.split("/").includes("cinelva")?"../search.html":"search.html"'));
  assert.match(detail, /recordEntryUrl\(m\.tmdbId\|\|m\.id\|\|""/);
  assert.match(detail, /一覧で評価する/);
  assert.doesNotMatch(detail, /my-cinelva\/\?record=/);
});

test('detail metadata failure keeps a selected movie record action', () => {
  assert.match(detail, /catch\(\(\)=>\{const title=initialParams\.get\("search"\)\|\|"";detail\.innerHTML/);
  assert.match(detail, /recordEntryUrl\(initialId,title\)/);
});

test('empty record list sends new entries to movie search instead of an unapproved record window', () => {
  assert.match(records, /href="\.\.\/search\.html">映画を検索して記録<\/a>/);
  assert.doesNotMatch(records, /data-add-record/);
  assert.match(myPage, /id="addRecord" href="\.\.\/search\.html"/);
  assert.match(records, /location\.replace\('\.\.\/search\.html\?'/);
});
