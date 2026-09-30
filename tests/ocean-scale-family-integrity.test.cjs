const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
test('relative-scale work preserves exact-family-only milestone rendering',()=>{
 assert.match(src,/if\(o\?\.family\)return null/);
 for(const fake of ['whaleshark','hammerhead','tigershark','mantaray','eagleray','stingray','sailfish']) assert.doesNotMatch(src,new RegExp(`${fake}:`));
});
