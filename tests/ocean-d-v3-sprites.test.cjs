const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const main=fs.readFileSync('preview/ocean/poc/poc-main.js','utf8'),assets=fs.readFileSync('preview/ocean/poc/d-v3-assets.js','utf8');
test('D-v3 preloads cached image assets',()=>{assert.match(main,/loadDV3Assets/);assert.match(main,/drawImage\(assets\.fish/);assert.match(main,/drawImage\(assets\.rock/);assert.match(main,/drawImage\(assets\.grass/);assert.match(main,/drawImage\(assets\.caustic/)});
test('fish are no longer generated with canvas primitive paths',()=>{assert.doesNotMatch(main,/drawNaturalFish/);assert.doesNotMatch(main,/bezierCurveTo/);assert.match(assets,/const fish=/)});
test('D-v3 assets are local self-authored data images with no runtime fetch',()=>{assert.match(assets,/data:image\/svg\+xml/);assert.doesNotMatch(assets,/https?:\/\//);assert.doesNotMatch(main,/fetch\(/)});
test('D-v3 retains iPhone performance guardrails',()=>{assert.match(main,/Math\.min\(devicePixelRatio\|\|1,2\)/);assert.match(main,/medianFps/);assert.match(main,/longFrames/)});
