'use strict';
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const page = readFileSync('discover.html', 'utf8');
const offers = page.indexOf('<section class="presetShelf" data-official-offers="discover"');
const catalog = page.indexOf('id="catalogPopularGrid"');
const personExplore = page.indexOf('<section class="personExploreIntro"');

test('official on-demand offers follow the standard discovery shelves', () => {
  assert.notEqual(offers, -1, 'official offer module remains available');
  assert.ok(catalog < offers, 'general discovery shelves come first');
  assert.ok(offers < personExplore, 'offer module stays below the general shelves');
});
