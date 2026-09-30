const fs=require('node:fs');
const vm=require('node:vm');
const test=require('node:test');
const assert=require('node:assert/strict');

function load(){
  const source=fs.readFileSync('preview/ocean/real-fish/milestone-swim.js','utf8');
  const context={window:{}};
  vm.runInNewContext(source,context);
  return context.window.CinemapOceanMilestoneSwim;
}

test('every milestone species has an explicit swim profile',()=>{
  const api=load();
  const keys=['clownfish','sea-turtle','seahorse','ocean-sunfish','giant-octopus','manta-ray','dolphin','hammerhead-shark','large-shark','dugong','minke-whale','orca','humpback-whale','whale-shark','blue-whale'];
  for(const key of keys){
    const profile=api.profileFor(key);
    assert.equal(profile.key,key,`${key} should not fall back`);
    assert.ok(profile.duration>=8,`${key} should move slowly enough for natural swimming`);
  }
});

test('swim families match anatomy instead of one generic slide',()=>{
  const api=load();
  assert.equal(api.profileFor('manta-ray').family,'ray-glide');
  assert.equal(api.profileFor('sea-turtle').family,'turtle-stroke');
  assert.equal(api.profileFor('giant-octopus').family,'octopus-drift');
  assert.equal(api.profileFor('minke-whale').family,'cetacean-cruise');
  assert.equal(api.profileFor('hammerhead-shark').family,'shark-cruise');
  assert.equal(api.profileFor('seahorse').family,'seahorse-hover');
});

test('large animals cruise more slowly than small reef animals',()=>{
  const api=load();
  assert.ok(api.profileFor('blue-whale').duration>api.profileFor('clownfish').duration);
  assert.ok(api.profileFor('whale-shark').duration>api.profileFor('dolphin').duration);
});
