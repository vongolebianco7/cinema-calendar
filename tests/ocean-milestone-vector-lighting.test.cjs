const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const source=fs.readFileSync('preview/ocean/real-fish/milestone-vector-lighting.js','utf8');
const largeSpecies=['manta-ray','dolphin','hammerhead-shark','large-shark','dugong','minke-whale','orca','humpback-whale','whale-shark','blue-whale'];

test('large milestone vectors use lightweight species-specific body lighting instead of flat single-color bodies',()=>{
  assert.match(source,/const LIGHTING_PROFILES=/);
  assert.match(source,/createElementNS\(SVG_NS,'linearGradient'\)/);
  assert.match(source,/dataset\.renderQuality='lit-vector-v1'/);
  assert.match(source,/primary\.setAttribute\('fill','url\(#'\+gradientId\+'\)'\)/);
  for(const key of largeSpecies) assert.ok(source.includes(`'${key}':{light:`),key);
});

test('vector lighting avoids blur and drop-shadow effects on moving milestone animals',()=>{
  assert.doesNotMatch(source,/feGaussianBlur|feDropShadow|drop-shadow\(/);
});
