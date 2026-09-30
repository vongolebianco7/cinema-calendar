const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
test('hero reward lane does not alter habitat classification data',()=>{
 assert.match(src,/const reef=o\.niche==='reef',deep=o\.niche==='benthic'\|\|o\.niche==='drifter',hero=/);
 assert.match(src,/y=hero\?2\.8:\(HABITAT_Y\[o\.niche\]/);
});
