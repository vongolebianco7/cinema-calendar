const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const manifest=JSON.parse(fs.readFileSync('preview/ocean/real-fish/milestone-assets.json','utf8'));
const atlas=fs.readFileSync('preview/ocean/real-fish/milestone-atlas.js','utf8');
const population=fs.readFileSync('preview/ocean/real-fish/photo-four-points.js','utf8');

test('manta, dolphin and dugong use articulated boxed layers',()=>{
  for(const key of ['manta-ray','dolphin','dugong']){
    const spec=manifest.species[key];
    assert.ok(spec.asset,key+' needs direct asset');
    assert.ok(spec.articulation,key+' needs articulation');
    assert.ok(spec.articulation.bodyClip,key+' body must be a fixed layer');
    assert.ok(Array.isArray(spec.articulation.parts)&&spec.articulation.parts.length>0,key+' needs moving appendage layers');
    for(const part of spec.articulation.parts)assert.ok(Array.isArray(part.box)&&part.box.length===4,key+' moving part needs explicit box');
  }
});

test('articulation moves appendages without body bending transforms',()=>{
  assert.match(atlas,/createArticulatedCreature/);
  assert.match(atlas,/createPartLayer/);
  assert.match(atlas,/milestoneArticulatedBody/);
  assert.match(atlas,/milestoneArticulatedPart/);
  assert.match(atlas,/transformOrigin/);
  assert.doesNotMatch(atlas,/skew\(|scaleX\(|scaleY\(|perspective\(|rotateX\(|rotateY\(/i);
});

test('visible articulation has enough amplitude and travel to read on iPhone',()=>{
  assert.match(atlas,/oceanMantaLeft.*?translateY\(-7%\).*?rotate\(-12deg\)/s);
  assert.match(atlas,/oceanMantaRight.*?translateY\(7%\).*?rotate\(12deg\)/s);
  assert.match(atlas,/oceanTailVertical.*?translateY\(-6%\).*?rotate\(-12deg\)/s);
  assert.match(atlas,/oceanTailVerticalSlow.*?translateY\(-5%\).*?rotate\(-10deg\)/s);
  assert.match(atlas,/dataset\.articulated='1'/);
  assert.doesNotMatch(atlas,/animation:none!important/);
});

test('manta dolphin and dugong have readable iPhone size caps',()=>{
  assert.match(population,/'manta-ray':26/);
  assert.match(population,/dolphin:20/);
  assert.match(population,/dugong:20/);
});
