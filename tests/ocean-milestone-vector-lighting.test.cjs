const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const source=fs.readFileSync('preview/ocean/real-fish/milestone-vector-lighting.js','utf8');
const largeSpecies=['manta-ray','dolphin','hammerhead-shark','large-shark','dugong','minke-whale','orca','humpback-whale','whale-shark','blue-whale'];

test('large milestone creatures use natural atlas v3 texture while keeping SVG fallback',()=>{
  assert.match(source,/const NATURAL_ATLAS='optimized\/milestone-creatures-v3\.webp'/);
  assert.match(source,/const NATURAL_CROPS=/);
  assert.match(source,/texture\.className='milestoneNaturalTexture'/);
  assert.match(source,/img\.src=NATURAL_ATLAS/);
  assert.match(source,/svg\.style\.opacity='0'/);
  assert.match(source,/dataset\.renderQuality='natural-atlas-v3'/);
  for(const key of largeSpecies){
    assert.ok(source.includes(`'${key}':{light:`),key);
    assert.ok(source.includes(`'${key}':[`)||source.includes(`'${key}': [`),key+' crop');
  }
});

test('natural texture path keeps lightweight vector fallback and avoids blur/drop-shadow effects',()=>{
  assert.match(source,/function addVectorFallback\(/);
  assert.match(source,/createElementNS\(SVG_NS,'linearGradient'\)/);
  assert.doesNotMatch(source,/feGaussianBlur|feDropShadow|drop-shadow\(/);
});
