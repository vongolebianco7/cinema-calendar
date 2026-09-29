const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
test('rare milestone species are never silently rendered as a different species',()=>{assert.doesNotMatch(src,/whaleshark\s*:\s*['\"]shark['\"]/);assert.doesNotMatch(src,/hammerhead\s*:\s*['\"]shark['\"]/)});
