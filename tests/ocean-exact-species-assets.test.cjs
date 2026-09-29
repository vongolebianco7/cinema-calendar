const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');

test('species without exact local models are never aliased to a different animal',()=>{
  for(const family of ['whaleshark','hammerhead','tigershark','mantaray','eagleray','stingray','sailfish']){
    assert.doesNotMatch(src,new RegExp(`${family}\\s*:\\s*['\"]`),`${family} must wait for an exact local model`);
  }
});

test('known exact local models keep explicit family mappings',()=>{
  for(const [family,key] of [['whale','whale'],['manta','manta'],['swordfish','sword'],['clownfish','clown'],['angler','angler'],['grouper','grouper']]){
    assert.match(src,new RegExp(`${family}\\s*:\\s*['\"]${key}['\"]`));
  }
});
