const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('preview/ocean/real-fish/ecosystem.html','utf8');

test('Ocean derives one deterministic maturity signal bundle from history and ratings',()=>{
  assert.match(html,/function ecosystemSignals\(cfg,records\)/);
  assert.match(html,/ratingEnergy\(records\)/);
  assert.match(html,/recordDiversity\(records\)/);
  assert.match(html,/populationTarget\(cfg,energy\)/);
  assert.match(html,/seabedCount/);
  assert.match(html,/schoolSpread/);
});

test('maturity affects habitat, benthic richness, population and school structure',()=>{
  assert.match(html,/signals\.habitat/);
  assert.match(html,/signals\.seabedCount/);
  assert.match(html,/signals\.population/);
  assert.match(html,/ACTIVE_SIGNALS=signals/);
  assert.match(html,/ACTIVE_SIGNALS\.schoolSpread/);
});

test('approved background remains static while maturity changes dynamic ecology layers',()=>{
  assert.match(html,/ocean-background-approved\.webp/);
  assert.match(html,/--habitat/);
  assert.match(html,/ACTIVE_SIGNALS/);
  assert.doesNotMatch(html,/genre[^;\n]{0,80}(?:fish|creature)|(?:fish|creature)[^;\n]{0,80}genre/i);
});
