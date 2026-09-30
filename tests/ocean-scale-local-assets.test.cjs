const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
test('renderer continues loading only repository-local creature and habitat assets',()=>{
 assert.match(src,/new URL\(`\.\.\/assets\/\$\{kind\}\/\$\{name\}\.glb`,import\.meta\.url\)/);
});
