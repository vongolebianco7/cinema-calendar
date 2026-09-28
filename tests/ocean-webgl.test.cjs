const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const immersive = fs.readFileSync(path.join(ROOT, 'preview/ocean/js/ocean-immersive.js'), 'utf8');

assert.ok(immersive.includes("VERSION='0.6.1'"), 'visible/runtime version is v0.6.1');
assert.ok(immersive.includes("CACHE='7'"), 'v0.6.1 renderer uses a fresh cache key');
assert.ok(immersive.includes('ocean-cinematic.js'), 'v0.6.1 loads the cinematic renderer');
assert.ok(immersive.includes('CinemapOceanCinematic'), 'immersive view mounts the cinematic renderer');
assert.ok(!immersive.includes('ocean-webgl.js'), 'failed low-poly WebGL renderer is no longer loaded');
assert.ok(!immersive.includes('ocean-geometry.js'), 'low-poly geometry is not part of the primary experience');

const rendererPath = path.join(ROOT, 'preview/ocean/js/ocean-cinematic.js');
assert.ok(fs.existsSync(rendererPath), 'cinematic renderer exists');
const renderer = fs.readFileSync(rendererPath, 'utf8');
for (const token of ['water','distantReef','seabed','rock','coral','kelp','creature','schools','particulate','foreground']) {
  assert.ok(renderer.includes(`function ${token}`), `renderer includes ${token}`);
}
for (const token of ['whale','ray','turtle','jelly','fishBody']) {
  assert.ok(renderer.includes(`function ${token}`), `renderer includes distinct ${token} treatment`);
}
assert.ok(renderer.includes('createLinearGradient'), 'water and animals use continuous shading rather than flat primitives');
assert.ok(renderer.includes('createRadialGradient'), 'atmosphere and organisms use radial shading');
assert.ok(renderer.includes('bezierCurveTo'), 'organic silhouettes use curved paths rather than triangle-only geometry');
assert.ok(renderer.includes('globalCompositeOperation'), 'light and translucent life use compositing');
assert.ok(renderer.includes('requestAnimationFrame'), 'ecosystem remains alive in real time');
assert.ok(renderer.includes('pointermove'), 'one-finger exploration remains supported');
assert.ok(renderer.includes('camera.min'), 'wide overview and zoom bounds remain explicit');
assert.ok(renderer.includes('touch-action:none'), 'mobile gestures stay inside the Ocean viewport');
assert.ok(!renderer.includes('cosmosHalo'), 'no attached halo/bubble treatment');
assert.ok(!renderer.includes('fish-atlas'), 'failed sprite-atlas treatment is not used');
assert.ok(!renderer.includes("getContext('webgl2'"), 'v0.6.1 does not reuse the rejected low-poly WebGL path');
console.log('ocean cinematic v0.6.1 contract tests passed');
