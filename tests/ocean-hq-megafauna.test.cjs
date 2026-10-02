const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const assert=require('node:assert/strict');

const root='preview/ocean/real-fish';
const manifest=JSON.parse(fs.readFileSync(path.join(root,'milestone-assets.json'),'utf8'));
const population=fs.readFileSync(path.join(root,'photo-four-points.js'),'utf8');
const swim=fs.readFileSync(path.join(root,'milestone-swim.js'),'utf8');

const HQ={
  'minke-whale':'assets/milestone-minke-whale-hq.webp',
  orca:'assets/milestone-orca-hq.webp',
  'humpback-whale':'assets/milestone-humpback-whale-hq.webp',
  'whale-shark':'assets/milestone-whale-shark-hq.webp',
  'blue-whale':'assets/milestone-blue-whale-hq.webp'
};

test('large whales and whale shark use direct HQ transparent assets that really exist',()=>{
  for(const [key,asset] of Object.entries(HQ)){
    const spec=manifest.species[key];
    assert.equal(spec.asset,asset,key+' must use the HQ direct asset');
    assert.equal(spec.assetAspect,3,key+' HQ asset is a 3:1 transparent sprite');
    const file=path.join(root,asset);
    assert.ok(fs.existsSync(file),asset+' must exist in the repository');
    assert.ok(fs.statSync(file).size>3000,asset+' must contain a real sprite, not a placeholder');
  }
});

test('large swimmers use directional pulse-glide traversal without conveyor motion',()=>{
  assert.match(swim,/@keyframes milestoneForwardNatural/);
  assert.match(swim,/@keyframes milestoneReverseNatural/);
  assert.match(swim,/data-swim-direction="forward"/);
  assert.match(swim,/data-swim-direction="reverse"/);
  assert.match(swim,/data-swim-cadence="pulse-glide"/);
  assert.match(swim,/var\(--swim-lane-y\)/);
  assert.match(swim,/var\(--swim-wave\)/);
  assert.match(swim,/18%\{transform:translate3d\(-50vw/);
  assert.match(swim,/25%\{transform:translate3d\(-50vw/);
  assert.match(swim,/46%\{transform:translate3d\(-8vw/);
  assert.match(swim,/55%\{transform:translate3d\(-8vw/);
  assert.doesNotMatch(swim,/animation-timing-function:linear!important/);
});

test('megafauna keep a strong iPhone size hierarchy',()=>{
  assert.match(population,/'minke-whale':40/);
  assert.match(population,/orca:32/);
  assert.match(population,/'humpback-whale':56/);
  assert.match(population,/'whale-shark':52/);
  assert.match(population,/'blue-whale':64/);
});
