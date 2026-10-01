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

test('visible articulation has enough amplitude to read on iPhone',()=>{
  assert.match(atlas,/oceanMantaLeft.*?rotate\(-8deg\)/s);
  assert.match(atlas,/oceanMantaRight.*?rotate\(8deg\)/s);
  assert.match(atlas,/oceanTailVertical.*?rotate\(-9deg\)/s);
  assert.match(atlas,/oceanTailVerticalSlow.*?rotate\(-7deg\)/s);
  assert.match(atlas,/dataset\.articulated='1'/);
  assert.doesNotMatch(atlas,/animation:none!important/);
});
