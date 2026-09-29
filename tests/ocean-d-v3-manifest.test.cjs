const test=require('node:test');const assert=require('node:assert/strict');const m=require('../preview/ocean/poc/d-v3-asset-manifest.json');
test('all five visual categories have explicit provenance',()=>{for(const c of ['fish','rock','plant','seabed','light']){const a=m.assets.find(x=>x.category===c);assert.ok(a,`missing ${c}`);assert.ok(a.provenance);assert.ok(a.license)}});
test('D-v3 has zero runtime/paid dependency budget',()=>{assert.equal(m.runtimeExternalRequests,0);assert.equal(m.paidDependencies,0)});
test('iPhone performance budget preserves D smoothness',()=>{assert.equal(m.performanceBudget.dprMax,2);assert.ok(m.performanceBudget.medianFpsMinimum>=50);assert.ok(m.performanceBudget.medianFpsPreferred>=55)});
