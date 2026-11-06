'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const readJson = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));

test('streaming provider observations are not described as complete premiere coverage', () => {
  const sources = readJson('data/streaming_sources.json');
  const feeds = readJson('data/streaming-official-feeds.json');
  const registry = readJson('quality/external-data-registry.json');
  const availability = registry.categories.find((item) => item.id === 'streaming-availability');
  const premieres = registry.categories.find((item) => item.id === 'streaming-premieres');

  assert.ok(sources.services.length > 0, 'provider inventory remains explicit');
  assert.ok(sources.services.every((service) => service.official_url), 'each listed service retains an official reference');
  assert.ok(
    sources.services.every((service) => service.auto_premiere_discovery === false),
    'do not claim automated premiere discovery without a verified feed',
  );
  assert.deepEqual(feeds.feeds, [], 'only confirmed official feed endpoints may be configured');
  assert.match(availability.coverage, /not a complete provider catalogue/i);
  assert.equal(premieres.status, 'manual', 'official premiere announcements remain manually reviewed');
  assert.match(premieres.acquisition, /手動/);
});

test('unavailable theater schedules and nationwide television are not reported as automated', () => {
  const registry = readJson('quality/external-data-registry.json');
  const get = (id) => registry.categories.find((item) => item.id === id);
  const theaters = get('theater-showtimes');
  const television = get('television-schedules');
  const animeBroadcasts = get('anime-film-tv-broadcasts');

  assert.equal(theaters.status, 'disabled-pending-permission');
  assert.match(theaters.coverage, /stale rows are hidden/i);
  assert.equal(television.status, 'manual');
  assert.match(television.coverage, /全国.*網羅を保証しない/);
  assert.equal(animeBroadcasts.status, 'automated');
  assert.match(animeBroadcasts.coverage, /全国/);
  assert.match(animeBroadcasts.coverage, /網羅ではありません/);
});
