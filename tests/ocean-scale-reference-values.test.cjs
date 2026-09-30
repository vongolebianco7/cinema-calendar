const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
test('reference lengths remain explicit and reviewable',()=>{
 for(const [k,v] of [['clown','.11'],['grouper','.75'],['butterfly','.2'],['angler','.45'],['sword','3'],['shark','3.4'],['manta','4.5'],['whale','12']]) assert.match(src,new RegExp(`${k}:${v.replace('.','\\.')}(?:[,}])`));
});
