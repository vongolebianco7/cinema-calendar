const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const world=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
const rewards=fs.readFileSync('preview/ocean/renderer/src/milestone-rewards.js','utf8');

test('renderer keeps movie count as logical creature count instead of quality-capping population',()=>{
  assert.match(world,/logicalCount\s*=\s*Math\.max\(0,state\.watched\)/);
  assert.match(world,/primaryCount\s*=\s*Math\.min\(logicalCount,max\)/);
  assert.match(world,/overflowCount\s*=\s*Math\.max\(0,logicalCount-primaryCount\)/);
  assert.match(world,/createOverflowSchool\(overflowCount\)/);
  assert.doesNotMatch(world,/const count=Math\.min\(max,Math\.max\(12,Math\.round\(8\+state\.watched\*\.55/);
});

test('ordinary 3D fish retain readable native color rather than darkening toward black',()=>{
  assert.match(world,/ORDINARY_COLOR_LIFT/);
  assert.match(world,/OVERFLOW_COLORS/);
  assert.match(world,/m\.color\.lerp\(lift/);
  assert.match(world,/m\.emissive\.copy\(m\.color\)/);
  assert.match(world,/m\.emissiveIntensity\s*=\s*\.08/);
});

test('renderer milestone table follows approved 100-1000 cadence and omits rejected seahorse',()=>{
  const expected=[
    [25,'clownfish'],[50,'seaTurtle'],[100,'sunfish'],[150,'giantOctopus'],[200,'manta'],[250,'dolphin'],
    [300,'hammerhead'],[350,'largeShark'],[400,'dugong'],[450,'minkeWhale'],[500,'orca'],[550,'manta'],
    [600,'humpbackWhale'],[650,'seaTurtle'],[700,'whaleShark'],[750,'sunfish'],[800,'dolphin'],
    [850,'hammerhead'],[900,'minkeWhale'],[950,'orca'],[1000,'blueWhale']
  ];
  for(const [at,key] of expected){
    assert.match(rewards,new RegExp(`at:${at},key:'${key}'`),`${at} should map to ${key}`);
  }
  assert.doesNotMatch(rewards,/seahorse/i);
});

test('75 remains an explicit empty content slot rather than silently restoring seahorse',()=>{
  assert.match(rewards,/75 intentionally stays empty/);
  assert.doesNotMatch(rewards,/at:75/);
});
