'use strict';
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const page = readFileSync('discover.html', 'utf8');
const offers = page.indexOf('<section class="presetShelf" data-official-offers="discover"');
const catalog = page.indexOf('id="catalogPopularGrid"');
const personExplore = page.indexOf('<section class="personExploreIntro"');

test('standalone promotional offer blocks are retired from discovery', () => {
  assert.equal(offers, -1, 'standalone offer blocks remain absent');
  assert.notEqual(catalog, -1, 'general discovery shelves remain available');
  assert.notEqual(personExplore, -1, 'person discovery remains available');
});
