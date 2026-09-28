const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const file = path.join(__dirname, '..', 'preview/ocean/js/ocean-renderer-contract.js');
assert.ok(fs.existsSync(file), 'renderer contract module exists');
const source = fs.readFileSync(file, 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox);
const contract = sandbox.window.CinemapOceanRendererContract;
assert.ok(contract && typeof contract.chooseRenderer === 'function', 'chooseRenderer is exposed');

assert.equal(contract.chooseRenderer({ webgl: true, reducedMotion: false, query: '' }), 'webgl');
assert.equal(contract.chooseRenderer({ webgl: false, reducedMotion: false, query: '' }), 'dom');
assert.equal(contract.chooseRenderer({ webgl: true, reducedMotion: true, query: '' }), 'dom');
assert.equal(contract.chooseRenderer({ webgl: true, reducedMotion: false, query: '?renderer=dom' }), 'dom');
assert.equal(contract.chooseRenderer({ webgl: true, reducedMotion: false, query: '?renderer=webgl' }), 'webgl');
assert.equal(contract.chooseRenderer({ webgl: false, reducedMotion: false, query: '?renderer=webgl' }), 'dom');
assert.equal(contract.chooseRenderer({ webgl: true, reducedMotion: false, query: '?renderer=unknown' }), 'webgl');
console.log('Ocean renderer contract tests passed');
