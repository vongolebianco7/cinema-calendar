const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const manifest=JSON.parse(fs.readFileSync('preview/ocean/real-fish/milestone-assets.json','utf8'));
const atlas=fs.readFileSync('preview/ocean/real-fish/milestone-atlas.js','utf8');

test('manta, dolphin and dugong use articulated layers',()=>{
  for(const key of ['manta-ray','dolphin','dugong']){
    const spec=manifest.species[key];
    assert.ok(spec.asset,key+' needs direct asset');
    assert.ok(spec.articulation,key+' needs articulation');
    assert.ok(spec.articulation.bodyClip,key+' body must be a fixed layer');
    assert.ok(Array.isArray(spec.articulation.parts)&&spec.articulation.parts.length>0,key+' needs moving appendage layers');
  }
});

test('articulation moves appendages without body bending transforms',()=>{
  assert.match(atlas,/createArticulatedCreature/);
  assert.match(atlas,/milestoneArticulatedBody/);
  assert.match(atlas,/milestoneArticulatedPart/);
  assert.match(atlas,/transformOrigin/);
  assert.doesNotMatch(atlas,/skew\(|scaleX\(|scaleY\(|perspective\(|rotateX\(|rotateY\(/i);
});

test('manta wings stay nearly straight and cetacean tails use small amplitudes',()=>{
  assert.match(atlas,/oceanMantaLeft.*?rotate\(-4deg\)/s);
  assert.match(atlas,/oceanMantaRight.*?rotate\(4deg\)/s);
  assert.match(atlas,/oceanTailVertical.*?rotate\(-5deg\)/s);
  assert.match(atlas,/oceanTailVerticalSlow.*?rotate\(-4deg\)/s);
});
