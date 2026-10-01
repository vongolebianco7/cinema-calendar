const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const manifest=JSON.parse(fs.readFileSync('preview/ocean/real-fish/milestone-assets.json','utf8'));
const atlas=fs.readFileSync('preview/ocean/real-fish/milestone-atlas.js','utf8');
const population=fs.readFileSync('preview/ocean/real-fish/photo-four-points.js','utf8');

test('AI-like swimmers use continuous whole-body deformation instead of clipped appendage layers',()=>{
  const expected={
    'manta-ray':'wing-flex',
    dolphin:'tail-flex-left',
    dugong:'tail-flex-right',
    'whale-shark':'tail-flex-left',
    'humpback-whale':'tail-flex-left'
  };
  for(const [key,profile] of Object.entries(expected)){
    const spec=manifest.species[key];
    assert.ok(spec.asset,key+' needs a direct source image');
    assert.equal(spec.deformation?.profile,profile,key+' needs the intended deformation profile');
    assert.ok(Number(spec.deformation?.amplitude)>0,key+' needs visible deformation amplitude');
    assert.ok(Number(spec.deformation?.period)>0,key+' needs a deformation period');
  }
  assert.match(atlas,/createDeformedCreature/);
  assert.match(atlas,/drawImage/);
  assert.match(atlas,/requestAnimationFrame/);
  assert.match(atlas,/spec\.deformation/);
  assert.match(atlas,/if\(spec\.asset&&spec\.deformation\)return createDeformedCreature/);
});

test('dolphin bends at the tail side and removes baked ocean background before deformation',()=>{
  const dolphin=manifest.species.dolphin;
  assert.equal(dolphin.deformation.profile,'tail-flex-left','dolphin tail is on the left side of its source image');
  assert.equal(dolphin.deformation.chromaKey,true,'dolphin background must be keyed out before deformation');
  assert.match(atlas,/createKeyedSource/);
  assert.match(atlas,/getImageData/);
  assert.match(atlas,/putImageData/);
  assert.match(atlas,/chromaKey/);
});

test('deformation uses overlapping vertical slices so the animal stays visually continuous',()=>{
  assert.match(atlas,/const slices=/);
  assert.match(atlas,/overlap=/);
  assert.match(atlas,/sliceW/);
  assert.match(atlas,/tailRamp/);
  assert.doesNotMatch(atlas,/clipPath=.*deformation/i);
});

test('large whales and whale shark keep their direct HQ transparent sprites',()=>{
  const expected={
    'minke-whale':'assets/milestone-minke-whale-hq.webp',
    orca:'assets/milestone-orca-hq.webp',
    'humpback-whale':'assets/milestone-humpback-whale-hq.webp',
    'whale-shark':'assets/milestone-whale-shark-hq.webp',
    'blue-whale':'assets/milestone-blue-whale-hq.webp'
  };
  for(const [key,asset] of Object.entries(expected)){
    assert.equal(manifest.species[key].asset,asset,key+' must keep the HQ direct asset');
    assert.equal(manifest.species[key].assetAspect,3,key+' HQ sprite must preserve 3:1 aspect');
  }
});

test('manta dolphin and dugong have readable iPhone size caps',()=>{
  assert.match(population,/'manta-ray':26/);
  assert.match(population,/dolphin:20/);
  assert.match(population,/dugong:20/);
});
