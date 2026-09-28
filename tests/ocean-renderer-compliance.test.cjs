const assert=require('assert');
const fs=require('fs');
const path=require('path');
const ROOT=path.join(__dirname,'..');
const renderer=path.join(ROOT,'preview/ocean/renderer');
const required=['package.json','src/main.js','src/runtime-policy.js','THIRD_PARTY_NOTICES.md'];
for(const rel of required) assert.ok(fs.existsSync(path.join(renderer,rel)),`${rel} exists`);
const pkg=JSON.parse(fs.readFileSync(path.join(renderer,'package.json'),'utf8'));
assert.ok(pkg.dependencies&&pkg.dependencies.three,'Three.js is an explicit local build dependency');
const files=['src/main.js','src/runtime-policy.js'];
for(const rel of files){
  const text=fs.readFileSync(path.join(renderer,rel),'utf8');
  assert.ok(!/https?:\/\//i.test(text),`${rel} has no runtime remote URL`);
  assert.ok(!/posthog|segment|amplitude|google-analytics|gtag\(/i.test(text),`${rel} has no tracker SDK`);
  assert.ok(!/unpkg|jsdelivr|esm\.sh|skypack/i.test(text),`${rel} has no CDN import`);
}
const notices=fs.readFileSync(path.join(renderer,'THIRD_PARTY_NOTICES.md'),'utf8');
assert.match(notices,/Three\.js[\s\S]*MIT/i);
assert.match(notices,/forbiddenlink\/ocean-simulator[\s\S]*MIT/i);
console.log('Ocean renderer compliance tests passed');
