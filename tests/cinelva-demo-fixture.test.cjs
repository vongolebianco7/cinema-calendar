const {test}=require('node:test');
const assert=require('node:assert/strict');
const {buildDemoRecords,summary}=require('../scripts/cinelva-demo-fixture.cjs');

test('demo records use 1200 unique real catalogue identities with consistent synthetic dates and ratings',()=>{
  const demo=buildDemoRecords({root:process.cwd(),today:'2026-10-30'});
  assert.equal(demo.records.length,1200);
  assert.equal(new Set(demo.records.map(r=>String(r.id))).size,1200);
  assert.ok(demo.records.every(r=>Number.isSafeInteger(Number(r.id))&&r.id>0&&r.tmdbId===Number(r.id)&&r.title));
  assert.ok(demo.records.every(r=>r.watched===true&&typeof r.watchedAt==='string'&&/^20(?:1[7-9]|2[0-6])-\d{2}-\d{2}$/.test(r.watchedAt)&&Number.isFinite(r.rating)&&r.rating>=0&&r.rating<=5));
  assert.equal(summary(demo.records,'2026').year,80);
  assert.ok(demo.records.filter(r=>r.watchedAt.startsWith('2026-')).every(r=>r.watchedAt<='2026-10-30'));
  assert.ok(demo.records.some(r=>r.director));
  assert.ok(demo.records.some(r=>r.genres.length));
  assert.ok(demo.records.some(r=>r.countries.length));
  assert.ok(demo.awardMatchCount>0,'sample records should include actual locally catalogued award winners');
});
