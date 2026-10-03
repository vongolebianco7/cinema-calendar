const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const swim=fs.readFileSync('preview/ocean/real-fish/milestone-swim.js','utf8');

test('ordinary species are not collapsed into unrelated shared photos',()=>{
  const block=swim.match(/const ORDINARY_ASSET_UPGRADES=\{([\s\S]*?)\};/);
  assert.ok(block,'asset upgrade map must exist');
  const mapText=block[1];
  for(const distinctVector of [
    'species-blue-tang.svg',
    'species-damselfish.svg',
    'species-firefish.svg',
    'species-lyretail-anthias.svg',
    'species-sixline-wrasse.svg',
    'species-filefish.svg'
  ]){
    assert.doesNotMatch(mapText,new RegExp(distinctVector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),`${distinctVector} must remain distinct until a species-correct photo exists`);
  }
});

test('known low-quality stingray render is still upgraded',()=>{
  assert.match(swim,/'optimized\/species-stingray\.webp':'assets\/milestone-manta-ray-v2\.webp'/);
});
