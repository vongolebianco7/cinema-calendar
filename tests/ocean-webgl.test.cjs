const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
function load(rel, globals = {}) {
  const source = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const sandbox = { console, Math, ...globals };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: rel });
  return sandbox;
}

for (const rel of [
  'preview/ocean/js/ocean-camera.js',
  'preview/ocean/js/ocean-scene.js',
  'preview/ocean/js/ocean-geometry.js',
  'preview/ocean/js/ocean-shaders.js',
  'preview/ocean/js/ocean-webgl.js',
]) {
  assert.ok(fs.existsSync(path.join(ROOT, rel)), `${rel} must exist for v0.5`);
}

const cameraSandbox = load('preview/ocean/js/ocean-camera.js');
assert.ok(cameraSandbox.CinemapOceanCamera, 'camera module exports a browser global');
const state = cameraSandbox.CinemapOceanCamera.createState();
assert.equal(state.mode, 'overview');
assert.ok(state.distance >= 22, 'initial camera is a wide establishing view');
const moved = cameraSandbox.CinemapOceanCamera.applyPan(state, 999, -999);
assert.ok(Math.abs(moved.targetX) <= 18 && Math.abs(moved.targetY) <= 8, 'pan stays inside soft world bounds');
const zoomed = cameraSandbox.CinemapOceanCamera.applyZoom(state, 99);
assert.ok(zoomed.distance <= 34 && zoomed.distance >= 9, 'zoom remains bounded');

const sceneSandbox = load('preview/ocean/js/ocean-scene.js');
const ecosystem = {
  maturity: { creatureCount: 14, schoolCount: 3, reef: 0.7, vegetation: 0.65, light: 0.75, largeCreatureCount: 1 },
  creatures: Array.from({ length: 14 }, (_, i) => ({ id: `film-${i}`, speciesId: `species-${i % 6}`, rating: i === 0 ? 5 : 4, size: 0.8 + (i % 4) * 0.12, depth: i % 3 })),
  schools: [{ id: 'school-a', count: 7 }, { id: 'school-b', count: 5 }, { id: 'school-c', count: 4 }],
};
const a = sceneSandbox.CinemapOceanScene.buildRenderScene(ecosystem);
const b = sceneSandbox.CinemapOceanScene.buildRenderScene(ecosystem);
assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), 'scene placement is deterministic');
assert.ok(a.world.width >= 36 && a.world.depth >= 30, 'world is materially larger than one viewport');
assert.ok(a.fish.length >= 10, 'ecosystem produces inhabitants');
assert.ok(a.habitat.length >= 8, 'growth enriches habitat, not just fish count');
assert.ok(a.fish.filter((fish) => fish.scale >= 1.7).length <= 2, 'large animals remain rare');

const html = fs.readFileSync(path.join(ROOT, 'preview/ocean/ocean-demo.html'), 'utf8');
assert.ok(html.includes('OCEAN v0.5.0'), 'visible version marker is v0.5.0');
for (const asset of ['ocean-camera.js', 'ocean-scene.js', 'ocean-geometry.js', 'ocean-shaders.js', 'ocean-webgl.js', 'ocean-immersive.js']) {
  assert.ok(html.includes(`${asset}?v=5`), `${asset} uses v0.5 cache key`);
}

const immersive = fs.readFileSync(path.join(ROOT, 'preview/ocean/js/ocean-immersive.js'), 'utf8');
assert.ok(immersive.includes('CinemapOceanWebGL'), 'immersive view mounts WebGL renderer');
assert.ok(!immersive.includes('cosmosHalo'), 'v0.5 primary renderer does not build halo DOM');
assert.ok(!immersive.includes('oceanSchool'), 'v0.5 primary renderer does not build sprite schools');

console.log('ocean webgl v0.5 contract tests passed');
