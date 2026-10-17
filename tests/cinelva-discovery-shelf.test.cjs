'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { hasMore, visibleItems } = require('../js/cinelva-discovery-shelves.js');

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
