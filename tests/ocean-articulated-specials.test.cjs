const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const manifest=JSON.parse(fs.readFileSync('preview/ocean/real-fish/milestone-assets.json','utf8'));
const atlas=fs.readFileSync('preview/ocean/real-fish/milestone-atlas.js','utf8');
const population=fs.readFileSync('preview/ocean/real-fish/photo-four-points.js','utf8');
const swim=fs.readFileSync('preview/ocean/real-fish/milestone-swim.js','utf8');

test('manta, dolphin and dugong use isolated moving appendage layers',()=>{
  for(const key of ['manta-ray','dolphin','dugong']){
    const spec=manifest.species[key];
    assert.ok(spec.asset,key+' needs direct asset');
    assert.ok(spec.articulation,key+' needs articulation');
    assert.ok(spec.articulation.bodyClip,key+' body must be a fixed layer');
    assert.ok(Array.isArray(spec.articulation.parts)&&spec.articulation.parts.length>0,key+' needs moving appendage layers');
    for(const part of spec.articulation.parts){
      assert.ok(Array.isArray(part.box)&&part.box.length===4,key+' moving part needs explicit box');
      assert.ok(typeof part.clipPath==='string'&&part.clipPath.length>0,key+' moving part needs a fin/tail-only clip path');
    }
  }
  for(const part of manifest.species['manta-ray'].articulation.parts)assert.ok(part.box[2]<=42,'manta moving layer must not include half the body');
  assert.ok(manifest.species.dolphin.articulation.parts[0].box[2]<=18,'dolphin moving layer must isolate the tail');
  assert.ok(manifest.species.dugong.articulation.parts[0].box[2]<=18,'dugong moving layer must isolate the tail');
});

test('articulation clips moving layers and never transforms the fixed body',()=>{
  assert.match(atlas,/createArticulatedCreature/);
  assert.match(atlas,/createPartLayer/);
  assert.match(atlas,/milestoneArticulatedBody/);
  assert.match(atlas,/milestoneArticulatedPart/);
  assert.match(atlas,/transformOrigin/);
  assert.match(atlas,/part\.clipPath/);
  assert.doesNotMatch(atlas,/milestoneArticulatedBody[^\n]*animation:/i);
  assert.doesNotMatch(atlas,/skew\(|scaleX\(|scaleY\(|perspective\(|rotateX\(|rotateY\(/i);
});

test('visible articulation reads as fin or tail movement on iPhone',()=>{
  assert.match(atlas,/oceanMantaLeft.*?rotate\(-10deg\)/s);
  assert.match(atlas,/oceanMantaRight.*?rotate\(10deg\)/s);
  assert.match(atlas,/oceanTailVertical.*?rotate\(-11deg\).*?rotate\(11deg\)/s);
  assert.match(atlas,/oceanTailVerticalSlow.*?rotate\(-8deg\).*?rotate\(8deg\)/s);
  assert.match(atlas,/dataset\.articulated='1'/);
});

test('articulated specials can translate through the ocean but never rock as a whole',()=>{
  assert.match(swim,/articulatedPassRoute/);
  for(const key of ['manta-ray','dolphin','dugong'])assert.match(swim,new RegExp('data-swim-key="'+key+'"\\]\\[data-swim-active="1"\\]\\{animation-name:articulatedPassRoute!important'));
  const route=(swim.match(/@keyframes articulatedPassRoute\{([^}]|}(?!\n))*?\}\n/)||[''])[0];
  assert.ok(route,'articulated route keyframes must exist');
  assert.doesNotMatch(route,/rotate|skew|scale/);
});

test('large whales and whale shark use direct HQ transparent sprites',()=>{
  const expected={
    'minke-whale':'assets/milestone-minke-whale-hq.webp',
    orca:'assets/milestone-orca-hq.webp',
    'humpback-whale':'assets/milestone-humpback-whale-hq.webp',
    'whale-shark':'assets/milestone-whale-shark-hq.webp',
    'blue-whale':'assets/milestone-blue-whale-hq.webp'
  };
  for(const [key,asset] of Object.entries(expected)){
    assert.equal(manifest.species[key].asset,asset,key+' must use HQ direct asset');
    assert.equal(manifest.species[key].assetAspect,3,key+' HQ sprite must preserve 3:1 aspect');
  }
});

test('manta dolphin and dugong have readable iPhone size caps',()=>{
  assert.match(population,/'manta-ray':26/);
  assert.match(population,/dolphin:20/);
  assert.match(population,/dugong:20/);
});
