const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
test('legacy independent creature base sizes are removed',()=>{
 for(const old of ['size:1.05','size:.72','size:.82','size:1.8','size:3.1','size:3.8','size:7.2']) assert.doesNotMatch(src,new RegExp(old.replace('.','\\.')));
});
