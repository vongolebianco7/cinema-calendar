const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const terrain=JSON.parse(fs.readFileSync('preview/ocean/real-fish/terrain-map.json','utf8'));

test('terrain map stays independent from the visual background asset',()=>{
  assert.equal(terrain.backgroundIndependent,true);
  assert.equal(terrain.coordinateSystem,'normalized-percent');
});

test('seabed profile spans the full viewport with plausible normalized heights',()=>{
  assert.equal(terrain.seabedProfile[0].x,0);
  assert.equal(terrain.seabedProfile.at(-1).x,100);
  for(const p of terrain.seabedProfile){assert.ok(p.y>=50&&p.y<=85);}
});

test('terrain exposes connected sand reef coral and open-water habitats',()=>{
  const types=new Set(terrain.zones.map(z=>z.type));
  for(const type of ['sand','reef','coral','open-water'])assert.ok(types.has(type),type);
  assert.ok(terrain.zones.some(z=>z.habitat.includes('octopus')));
  assert.ok(terrain.zones.some(z=>z.habitat.includes('horse-mackerel')));
});

test('raised reef/coral structures provide deterministic avoidance obstacles for school reactions',()=>{
  assert.ok(terrain.obstacles.length>=3);
  for(const o of terrain.obstacles){
    assert.equal(o.shape,'ellipse');
    assert.ok(o.strength>0&&o.strength<=1);
    for(const key of ['cx','cy','rx','ry'])assert.ok(Number.isFinite(o[key]),key);
  }
});
