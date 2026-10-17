'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const detail = fs.readFileSync('search.html', 'utf8');
const records = fs.readFileSync('js/cinelva-records-page.js', 'utf8');

test('movie detail links the selected film to the shared CINELVA record form on root and preview paths', () => {
  assert.ok(detail.includes('recordEntryUrl(id,title)'));
  assert.ok(detail.includes('location.pathname.split("/").includes("cinelva")?"../my-cinelva/":"my-cinelva/"'));
  assert.match(detail, /recordEntryUrl\(m\.tmdbId\|\|m\.id\|\|""/);
  assert.match(detail, /鑑賞を記録/);
});

test('detail metadata failure keeps a selected movie record action', () => {
  assert.match(detail, /catch\(\(\)=>\{const title=initialParams\.get\("search"\)\|\|"";detail\.innerHTML/);
  assert.match(detail, /recordEntryUrl\(initialId,title\)/);
});

test('the shared record page opens the existing record or preloads the selected movie search', () => {
  assert.match(records, /new URLSearchParams\(location\.search\),requestedId=params\.get\('record'\)/);
  assert.match(records, /existing\|\|byId\.has\(String\(requestedId\)\)\)openKnownMovie\(requestedId\)/);
  assert.match(records, /openDialog\(\);\$\('movieQuery'\)\.value=requestedTitle;searchMovies\(requestedTitle\)/);
});
