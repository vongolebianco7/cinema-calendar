'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const detail = fs.readFileSync('search.html', 'utf8');
const records = fs.readFileSync('js/cinelva-records-page.js', 'utf8');

test('movie detail links the selected film to the shared CINELVA record form', () => {
  assert.match(detail, /my-cinelva\/\?/);
  assert.match(detail, /record:String\(m\.tmdbId\|\|m\.id\|\|""\)/);
  assert.match(detail, /鑑賞を記録/);
});

test('the shared record page opens the existing record or preloads the selected movie search', () => {
  assert.match(records, /new URLSearchParams\(location\.search\),requestedId=params\.get\('record'\)/);
  assert.match(records, /existing\|\|byId\.has\(String\(requestedId\)\)\)openKnownMovie\(requestedId\)/);
  assert.match(records, /openDialog\(\);\$\('movieQuery'\)\.value=requestedTitle;searchMovies\(requestedTitle\)/);
});
