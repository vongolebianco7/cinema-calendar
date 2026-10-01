const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const source=fs.readFileSync('preview/ocean/real-fish/milestone-vector-lighting.js','utf8');
const largeSpecies=['manta-ray','dolphin','hammerhead-shark','large-shark','dugong','minke-whale','orca','humpback-whale','whale-shark','blue-whale'];
const anatomyOverrideSpecies=['manta-ray','dolphin','hammerhead-shark','large-shark','dugong'];

test('large milestone vectors use soft countershaded illustrated anatomy',()=>{
  assert.match(source,/const LIGHTING_PROFILES=/);
  assert.match(source,/const DETAIL_MARKUP=/);
  assert.match(source,/data-ocean-lighting','countershade'/);
  assert.match(source,/addStop\(gradient,'0%',profile\.shadow\)/);
  assert.match(source,/addStop\(gradient,'100%',profile\.light\)/);
  assert.match(source,/primary\.setAttribute\('stroke-opacity','\.34'\)/);
  assert.match(source,/highlight\.setAttribute\('opacity','\.22'\)/);
  assert.match(source,/data-ocean-details/);
  assert.match(source,/dataset\.renderQuality='illustrated-vector-v4'/);
  for(const key of largeSpecies){
    assert.ok(source.includes(`'${key}':{light:`),key);
    assert.ok(source.includes(`'${key}':'<g data-ocean-details=`),key+' details');
  }
});

test('weakest milestone silhouettes have species-specific anatomy overrides',()=>{
  assert.match(source,/const ANATOMY_OVERRIDES=/);
  assert.match(source,/function applyAnatomyOverride\(svg,key\)/);
  for(const key of anatomyOverrideSpecies) assert.ok(source.includes(`'${key}':{viewBox:`),key);
});

test('illustrated vector path avoids blur and drop-shadow effects on moving milestone animals',()=>{
  assert.doesNotMatch(source,/feGaussianBlur|feDropShadow|drop-shadow\(/);
});
