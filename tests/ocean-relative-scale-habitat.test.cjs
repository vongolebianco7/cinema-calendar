const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
test('Ocean keeps one explicit relative-size baseline',()=>{assert.match(src,/DISPLAY_SCALE=1\.2/);assert.match(src,/REAL_LENGTH_M=\{clown:\.11,grouper:\.75,butterfly:\.2,angler:\.45,sword:3,shark:3\.4,manta:4\.5,whale:12\}/);for(const k of ['grouper','clown','butterfly','sword','shark','manta','whale','angler'])assert.match(src,new RegExp(`size:REAL_LENGTH_M\\.${k}\\*DISPLAY_SCALE`));});
test('habitat lanes keep seabed life below reef and pelagic life',()=>{assert.match(src,/HABITAT_Y=\{reef:-2\.1,benthic:-3\.8,drifter:-3\.2,pelagic:\.3\}/);assert.match(src,/HABITAT_Y\[o\.niche\]/);});
test('relative ecology remains local and deterministic',()=>{assert.doesNotMatch(src,/fetch\s*\(/);assert.doesNotMatch(src,/Math\.random/);assert.match(src,/function seeded\(i\)/);});
