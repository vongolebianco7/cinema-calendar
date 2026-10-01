const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const manifest=JSON.parse(fs.readFileSync('preview/ocean/real-fish/milestone-assets.json','utf8'));
const population=fs.readFileSync('preview/ocean/real-fish/photo-four-points.js','utf8');
const swim=fs.readFileSync('preview/ocean/real-fish/milestone-swim.js','utf8');

const HQ={
  'minke-whale':'assets/milestone-minke-whale-hq.webp',
  orca:'assets/milestone-orca-hq.webp',
  'humpback-whale':'assets/milestone-humpback-whale-hq.webp',
  'whale-shark':'assets/milestone-whale-shark-hq.webp',
  'blue-whale':'assets/milestone-blue-whale-hq.webp'
};

test('large whales and whale shark use direct high-resolution transparent assets',()=>{
  for(const [key,asset] of Object.entries(HQ)){
    const spec=manifest.species[key];
    assert.equal(spec.asset,asset,key+' must use the HQ direct asset');
    assert.equal(spec.assetAspect,3,key+' HQ asset is a 3:1 transparent sprite');
  }
});

test('articulated manta dolphin and dugong disable whole-wrapper swim animation',()=>{
  for(const key of ['manta-ray','dolphin','dugong'])assert.match(swim,new RegExp('data-swim-key="'+key+'"[^}]*animation:none!important;transform:none!important;will-change:auto!important'));
});

test('megafauna keep a strong iPhone size hierarchy',()=>{
  assert.match(population,/'minke-whale':40/);
  assert.match(population,/orca:32/);
  assert.match(population,/'humpback-whale':56/);
  assert.match(population,/'whale-shark':52/);
  assert.match(population,/'blue-whale':64/);
});
