'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { hasMore, visibleItems, isTrueStoryCandidate } = require('../js/cinelva-discovery-shelves.js');
const { readFileSync } = require('node:fs');
const page = readFileSync('discover.html', 'utf8');

test('shelf counts show full access only when more than the initial 16 cards exist', () => {
  for (const count of [0, 1, 16]) assert.equal(hasMore(Array.from({ length: count })), false);
  for (const count of [17, 100]) assert.equal(hasMore(Array.from({ length: count })), true);
});

test('expanded shelves expose every filtered result while collapsed shelves stay compact', () => {
  for (const count of [0, 1, 100]) {
    const items = Array.from({ length: count }, (_, i) => i);
    assert.deepEqual(visibleItems(items, false), items.slice(0, 16));
    assert.deepEqual(visibleItems(items, true), items);
  }
});

test('true-story discovery excludes historical fiction and keeps explicit factual markers', () => {
  assert.equal(isTrueStoryCandidate({
    title: 'ズートピア2',
    overview: '街の過去の歴史にまつわる謎を追う。'
  }), false);
  assert.equal(isTrueStoryCandidate({
    title: '幕末の冒険',
    overview: 'A historical fantasy about an imagined time traveler.'
  }), false);
  assert.equal(isTrueStoryCandidate({ overview: '実話をもとにした物語。' }), true);
  assert.equal(isTrueStoryCandidate({ overview: 'Based on a true story.' }), true);
  assert.equal(isTrueStoryCandidate({ genres: ['ドキュメンタリー'] }), false);
});

test('every visible recommendation preset maps to a named result axis', () => {
  const presets = [...page.matchAll(/data-p="([^"]+)"/g)].map(match => match[1]);
  const branches = [...page.matchAll(/axis==="([^"]+)"/g)].map(match => match[1]);
  const labels = page.match(/const names=\{([^}]+)\}/)?.[1] || '';
  assert.ok(presets.length > 0, 'recommendation controls are present');
  for (const preset of presets) {
    assert.ok(branches.includes(preset), `${preset} has filtering and ranking behavior`);
    assert.match(labels, new RegExp(`(?:^|,)${preset}:`), `${preset} has a visible section label`);
  }
});

test('discovery tabs and availability filters are connected to visible result state', () => {
  assert.match(page, /document\.querySelectorAll\("\[data-explore-mode\]"\)\.forEach\(b=>b\.onclick=\(\)=>setExploreMode\(b\.dataset\.exploreMode\)\)/);
  assert.match(page, /function setExploreMode\(mode\).*?\$\("#filterMode"\)\.hidden=concierge;\$\("#conciergeMode"\)\.hidden=!concierge/s);
  assert.match(page, /function currentCatalogList\(\)\{return catalogPopular\.filter\(m=>availabilityFilter==="all"\|\|\(availabilityFilter==="available"\?hasFreshStreaming\(m\):!hasFreshStreaming\(m\)\)\)\}/);
  assert.match(page, /b\.onclick=\(\)=>\{availabilityFilter=b\.dataset\.availability;renderPopularShelves\(\)\}/);
  assert.match(page, /\$\("#apply"\)\.onclick=\(\)=>\{.*?load\(true\)\}/);
});
