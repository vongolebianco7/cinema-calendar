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

for (const rel of ['preview/ocean/js/ocean-camera.js','preview/ocean/js/ocean-scene.js','preview/ocean/js/ocean-geometry.js','preview/ocean/js/ocean-shaders.js','preview/ocean/js/ocean-webgl.js']) assert.ok(fs.existsSync(path.join(ROOT, rel)), `${rel} must exist for v0.5`);

const cameraSandbox = load('preview/ocean/js/ocean-camera.js');
assert.ok(cameraSandbox.CinemapOceanCamera, 'camera module exports a browser global');
const state = cameraSandbox.CinemapOceanCamera.createState();
assert.equal(state.mode, 'overview');
assert.ok(state.distance >= 60, 'portrait iPhone starts far enough back to establish the habitat');
const moved = cameraSandbox.CinemapOceanCamera.applyPan(state, 999, -999);
assert.ok(Math.abs(moved.targetX) <= 18 && Math.abs(moved.targetY) <= 8, 'pan stays inside soft world bounds');
const zoomed = cameraSandbox.CinemapOceanCamera.applyZoom(state, 99);
assert.ok(zoomed.distance <= 78 && zoomed.distance >= 16, 'zoom remains bounded');

const sceneSandbox = load('preview/ocean/js/ocean-scene.js');
const ecosystem = {maturity:{reef:.7,vegetation:.65,light:.75},creatures:Array.from({length:14},(_,i)=>({id:`film-${i}`,speciesId:`species-${i%6}`,rating:i===0?5:4,size:.8+(i%4)*.12})),schools:[{id:'school-a',count:7},{id:'school-b',count:5},{id:'school-c',count:4}]};
const a=sceneSandbox.CinemapOceanScene.buildRenderScene(ecosystem),b=sceneSandbox.CinemapOceanScene.buildRenderScene(ecosystem);
assert.deepStrictEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),'scene placement is deterministic');
assert.ok(a.world.width>=36&&a.world.depth>=30,'world is materially larger than one viewport');
assert.ok(a.fish.length>=10,'ecosystem produces inhabitants');
assert.ok(a.habitat.length>=8,'growth enriches habitat, not just fish count');
assert.ok(a.fish.filter(fish=>fish.scale>=1.7).length<=2,'large animals remain rare');

const immersive=fs.readFileSync(path.join(ROOT,'preview/ocean/js/ocean-immersive.js'),'utf8');
assert.ok(immersive.includes("VERSION='0.5.0'"),'visible/runtime version is v0.5.0');
assert.ok(immersive.includes("CACHE='5'"),'v0.5 renderer modules share an explicit cache key');
for(const asset of ['ocean-camera.js','ocean-scene.js','ocean-geometry.js','ocean-shaders.js','ocean-webgl.js'])assert.ok(immersive.includes(asset),`${asset} is loaded by the v0.5 shell`);
assert.ok(immersive.includes('CinemapOceanWebGL'),'immersive view mounts WebGL renderer');
assert.ok(!immersive.includes('cosmosHalo'),'v0.5 primary renderer does not build halo DOM');
assert.ok(!immersive.includes('oceanSchool'),'v0.5 primary renderer does not build sprite schools');

const renderer=fs.readFileSync(path.join(ROOT,'preview/ocean/js/ocean-webgl.js'),'utf8');
assert.ok(renderer.includes("getContext('webgl2'"),'renderer requests native WebGL2');
assert.ok(renderer.includes('showFallback'),'renderer has a local graceful fallback');
assert.ok(!renderer.includes('fish-atlas'),'primary renderer does not use the old fish sprite atlas');
console.log('ocean webgl v0.5 contract tests passed');
