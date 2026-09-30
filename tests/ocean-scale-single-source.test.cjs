const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
test('creature base sizes are derived from one relative-length table',()=>{
 const specs=src.match(/const SPECS=\{([\s\S]*?)\};const cache/);assert.ok(specs);
 for(const key of ['grouper','clown','butterfly','sword','shark','manta','whale','angler']) assert.match(specs[1],new RegExp(`${key}:\\{[^}]*size:REAL_LENGTH_M\\.${key}\\*DISPLAY_SCALE`));
});
