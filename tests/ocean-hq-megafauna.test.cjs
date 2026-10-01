const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const manifest=JSON.parse(fs.readFileSync('preview/ocean/real-fish/milestone-assets.json','utf8'));
const population=fs.readFileSync('preview/ocean/real-fish/photo-four-points.js','utf8');
const swim=fs.readFileSync('preview/ocean/real-fish/milestone-swim.js','utf8');

const HQ={
  'minke-whale':'assets/milestone-minke-whale-hq.png',
  orca:'assets/milestone-orca-hq.png',
  'humpback-whale':'assets/milestone-humpback-whale-hq.png',
  'whale-shark':'assets/milestone-whale-shark-hq.png',
  'blue-whale':'assets/milestone-blue-whale-hq.png'
};

test('large whales and whale shark use direct high-resolution transparent assets',()=>{
  for(const [key,asset] of Object.entries(HQ)){
    const spec=manifest.species[key];
    assert.equal(spec.asset,asset,key+' must use the HQ direct asset');
    assert.equal(spec.assetAspect,3,key+' HQ asset is a 3:1 transparent sprite');
  }
});

test('articulated manta dolphin and dugong disable whole-wrapper swim animation',()=>{
  assert.match(population,/node\.dataset\.articulated=creature\.dataset\.articulated\|\|'0'/);
  assert.match(swim,/\[data-commemorative\]\[data-articulated="1"\]\{animation:none!important;transform:none!important;will-change:auto!important\}/);
});

test('megafauna keep a strong iPhone size hierarchy',()=>{
  assert.match(population,/'minke-whale':40/);
  assert.match(population,/orca:32/);
  assert.match(population,/'humpback-whale':56/);
  assert.match(population,/'whale-shark':52/);
  assert.match(population,/'blue-whale':64/);
});
