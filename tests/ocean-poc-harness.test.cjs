const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const main=fs.readFileSync(path.resolve(__dirname,'../preview/ocean/poc/poc-main.js'),'utf8');const html=fs.readFileSync(path.resolve(__dirname,'../preview/ocean/poc/index.html'),'utf8');
test('PoC exposes A-E and deterministic maturity navigation',()=>{assert.match(main,/POC_MODES/);assert.match(main,/POC_STATES/);assert.match(main,/scenarioFromSearch/);assert.match(html,/viewport-fit=cover/)});
test('PoC records readiness, frame time-derived FPS and long frames',()=>{assert.match(main,/performance\.now/);assert.match(main,/FPS median/);assert.match(main,/longFrames/);assert.match(main,/__OCEAN_POC__/)});
test('WebGPU candidate fails explicitly instead of pretending to be supported',()=>{assert.match(main,/gpu' in navigator/);assert.match(main,/WebGPU unavailable/)});
