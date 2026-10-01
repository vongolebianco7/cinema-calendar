const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const source=fs.readFileSync('preview/ocean/real-fish/milestone-vector-lighting.js','utf8');
const largeSpecies=['manta-ray','dolphin','hammerhead-shark','large-shark','dugong','minke-whale','orca','humpback-whale','whale-shark','blue-whale'];

test('large milestone vectors use species-specific illustrated lighting and anatomy',()=>{
  assert.match(source,/const LIGHTING_PROFILES=/);
  assert.match(source,/const DETAIL_MARKUP=/);
  assert.match(source,/createElementNS\(SVG_NS,'linearGradient'\)/);
  assert.match(source,/data-ocean-highlight/);
  assert.match(source,/data-ocean-details/);
  assert.match(source,/dataset\.renderQuality='illustrated-vector-v2'/);
  for(const key of largeSpecies){
    assert.ok(source.includes(`'${key}':{light:`),key);
    assert.ok(source.includes(`'${key}':'<g data-ocean-details=`),key+' details');
  }
});

test('illustrated vector path avoids blur and drop-shadow effects on moving milestone animals',()=>{
  assert.doesNotMatch(source,/feGaussianBlur|feDropShadow|drop-shadow\(/);
});
