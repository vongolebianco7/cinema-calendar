const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const catalog=JSON.parse(fs.readFileSync(path.join(ROOT,'preview/ocean/real-fish/creature-catalog.json'),'utf8'));

test('distinct-photo assets use unique files and silhouettes',()=>{
  const ready=catalog.creatures.filter(c=>c.assetStatus==='ready-distinct-photo');
  assert.ok(ready.length>=2,'expected at least two accepted distinct-photo creatures');
  assert.equal(new Set(ready.map(c=>c.asset)).size,ready.length,'accepted creatures must not reuse the same photo asset');
  assert.equal(new Set(ready.map(c=>c.silhouette)).size,ready.length,'accepted creatures must have distinct silhouette classes');
  for(const c of ready){
    const p=path.join(ROOT,'preview/ocean/real-fish',c.asset);
    assert.ok(fs.existsSync(p),`missing asset for ${c.id}: ${c.asset}`);
    assert.ok(fs.statSync(p).size>1024,`asset too small for ${c.id}`);
    assert.match(c.asset,/\.webp$/,'accepted asset must be WebP');
  }
});
