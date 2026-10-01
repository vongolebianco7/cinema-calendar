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

test('articulated manta dolphin and dugong move through an unrotated translation route',()=>{
  assert.match(swim,/@keyframes articulatedPassRoute/);
  for(const key of ['manta-ray','dolphin','dugong'])assert.match(swim,new RegExp('data-swim-key="'+key+'"\\]\\[data-swim-active="1"\\]\\{animation-name:articulatedPassRoute!important'));
});

test('megafauna keep a strong iPhone size hierarchy',()=>{
  assert.match(population,/'minke-whale':40/);
  assert.match(population,/orca:32/);
  assert.match(population,/'humpback-whale':56/);
  assert.match(population,/'whale-shark':52/);
  assert.match(population,/'blue-whale':64/);
});
