const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('manifest fixes iPhone and performance budgets',()=>{
 const m=JSON.parse(read('preview/ocean/assets/ocean-assets.manifest.json'));
 assert.deepEqual(m.requiredCategories,['fish','rock','plant','seabed','light']);
 assert.equal(m.viewport.width,390); assert.equal(m.viewport.height,844); assert.equal(m.viewport.maxDpr,2);
 assert.equal(m.budgets.medianFpsTarget,55); assert.equal(m.budgets.medianFpsPass,50); assert.equal(m.budgets.medianFpsFail,45);
});

test('asset inspector enforces provenance, display size and decoded memory',()=>{
 const s=read('scripts/ocean-quality/inspect-assets.mjs');
 for(const token of ['license','sourceUrl','runtimeRemote','nativeSize','displaySize','decodedImageBytesMax']) assert.match(s,new RegExp(token));
});

test('performance evaluator requires all growth states and stability',()=>{
 const s=read('scripts/ocean-quality/evaluate-performance.mjs');
 assert.match(s,/\[0,30,100,300,500\]/);
 for(const token of ['medianFps','readyMs','blank','jsErrors','contextLosses','fpsRegressionPercentMax']) assert.match(s,new RegExp(token));
});

test('ordinary ecosystem does not spawn the dark legacy killifish asset',()=>{
 const catalog=JSON.parse(read('preview/ocean/real-fish/creature-catalog.json'));
 const ordinaryAssets=catalog.creatures.filter(c=>c.kind==='fish').map(c=>c.asset);
 assert.ok(!ordinaryAssets.includes('optimized/fish-real.webp'));
});
