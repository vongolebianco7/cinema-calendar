import * as pc from 'playcanvas';

const canvas = document.querySelector('#ocean');
const device = await pc.createGraphicsDevice(canvas, { deviceTypes: ['webgl2'] });
device.maxPixelRatio = Math.min(window.devicePixelRatio || 1, 2);

const options = new pc.AppOptions();
options.graphicsDevice = device;
options.componentSystems = [pc.RenderComponentSystem, pc.CameraComponentSystem, pc.LightComponentSystem];
options.resourceHandlers = [pc.TextureHandler, pc.ContainerHandler];
const app = new pc.AppBase(canvas);
app.init(options);
app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
app.setCanvasResolution(pc.RESOLUTION_AUTO);
app.start();

const ocean = new pc.Color(0.008, 0.105, 0.15);
app.scene.ambientLight = new pc.Color(0.035, 0.16, 0.19);
app.scene.fog.type = pc.FOG_EXP2;
app.scene.fog.color.copy(ocean);
app.scene.fog.density = 0.018;
app.scene.exposure = 1.35;

const material = (diffuse, gloss = 0.35, metalness = 0) => {
  const m = new pc.StandardMaterial();
  m.diffuse = diffuse;
  m.gloss = gloss;
  m.metalness = metalness;
  m.useMetalness = true;
  m.update();
  return m;
};

const sand = material(new pc.Color(0.18, 0.29, 0.27), 0.15);
const rock = material(new pc.Color(0.075, 0.13, 0.13), 0.22);
const kelp = material(new pc.Color(0.035, 0.24, 0.16), 0.18);

const seabed = new pc.Entity('seabed');
seabed.addComponent('render', { type: 'plane', material: sand, castShadows: false, receiveShadows: true });
seabed.setLocalScale(70, 1, 70);
seabed.setPosition(0, -5.4, -14);
app.root.addChild(seabed);

for (let i = 0; i < 22; i++) {
  const r = new pc.Entity(`reef-rock-${i}`);
  r.addComponent('render', { type: 'sphere', material: rock, castShadows: true, receiveShadows: true });
  const x = ((i * 7.13) % 32) - 16;
  const z = -5 - ((i * 11.7) % 38);
  const s = 0.45 + ((i * 1.71) % 1.9);
  r.setLocalScale(s * 1.7, s * 0.72, s * 1.25);
  r.setPosition(x, -5.1 + s * 0.18, z);
  app.root.addChild(r);
}

for (let i = 0; i < 34; i++) {
  const blade = new pc.Entity(`kelp-${i}`);
  blade.addComponent('render', { type: 'capsule', material: kelp, castShadows: false });
  const h = 0.9 + ((i * 0.83) % 2.7);
  blade.setLocalScale(0.06 + (i % 3) * 0.025, h, 0.06 + (i % 2) * 0.02);
  blade.setPosition(((i * 5.9) % 34) - 17, -5.05 + h * 0.48, -7 - ((i * 9.4) % 36));
  blade.setEulerAngles((i % 5) * 2 - 4, 0, (i % 7) * 1.7 - 5);
  app.root.addChild(blade);
}

const camera = new pc.Entity('camera');
camera.addComponent('camera', { clearColor: ocean, farClip: 100, nearClip: 0.1, fov: 54 });
camera.camera.toneMapping = pc.TONEMAP_ACES;
camera.camera.gammaCorrection = pc.GAMMA_SRGB;
camera.setPosition(0, 1.4, 18);
camera.lookAt(0, -1.2, -15);
app.root.addChild(camera);

const sun = new pc.Entity('sun');
sun.addComponent('light', { type: 'directional', color: new pc.Color(0.58, 0.9, 0.92), intensity: 2.15, castShadows: true, shadowDistance: 55, shadowResolution: 1024 });
sun.setEulerAngles(58, 24, -18);
app.root.addChild(sun);

const fill = new pc.Entity('blue-fill');
fill.addComponent('light', { type: 'omni', color: new pc.Color(0.05, 0.38, 0.48), intensity: 1.2, range: 28, castShadows: false });
fill.setPosition(-7, 5, 2);
app.root.addChild(fill);

// God rays: soft translucent shafts without circular sprite effects.
const rayMat = new pc.StandardMaterial();
rayMat.diffuse = new pc.Color(0.18, 0.65, 0.68);
rayMat.emissive = new pc.Color(0.06, 0.26, 0.28);
rayMat.opacity = 0.055;
rayMat.blendType = pc.BLEND_ADDITIVE;
rayMat.depthWrite = false;
rayMat.cull = pc.CULLFACE_NONE;
rayMat.update();
for (let i = 0; i < 7; i++) {
  const ray = new pc.Entity(`god-ray-${i}`);
  ray.addComponent('render', { type: 'cone', material: rayMat, castShadows: false });
  ray.setLocalScale(1.2 + i * 0.25, 18 + i * 1.8, 1.2 + i * 0.25);
  ray.setPosition(-8 + i * 2.7, 8, -18 - i * 1.5);
  ray.setEulerAngles(10 + i * 1.5, 0, -10 + i * 2.5);
  app.root.addChild(ray);
}

const snowMat = material(new pc.Color(0.34, 0.58, 0.58), 0.05);
snowMat.emissive = new pc.Color(0.025, 0.055, 0.055); snowMat.update();
const snow = [];
for (let i = 0; i < 45; i++) {
  const p = new pc.Entity(`marine-snow-${i}`);
  p.addComponent('render', { type: 'sphere', material: snowMat, castShadows: false });
  const s = 0.012 + (i % 5) * 0.006;
  p.setLocalScale(s, s, s);
  p.setPosition(((i * 7.7) % 28) - 14, ((i * 3.3) % 12) - 5, 8 - ((i * 8.9) % 52));
  app.root.addChild(p); snow.push(p);
}

const fishUrl = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BarramundiFish/glTF-Binary/BarramundiFish.glb';
const fishAsset = new pc.Asset('BarramundiFish.glb', 'container', { url: fishUrl });
app.assets.add(fishAsset);
const fishes = [];
fishAsset.on('load', () => {
  const placements = [
    [-1.2, -0.8, -8.5, 2.15, -12],
    [5.8, 0.9, -18, 1.1, 168],
    [-7.4, 1.8, -25, 0.82, -8]
  ];
  for (const [x,y,z,s,ry] of placements) {
    const fish = fishAsset.resource.instantiateRenderEntity();
    fish.setLocalScale(s, s, s);
    fish.setPosition(x,y,z);
    fish.setEulerAngles(0, ry, 0);
    app.root.addChild(fish);
    fishes.push({ entity: fish, baseX:x, baseY:y, baseZ:z, phase:fishes.length * 1.8, speed:0.22 + fishes.length * 0.06 });
  }
  document.body.dataset.ready = 'true';
});
fishAsset.on('error', (err) => { console.error('fish asset failed', err); document.body.dataset.ready = 'error'; });
app.assets.load(fishAsset);

let elapsed = 0;
app.on('update', (dt) => {
  elapsed += dt;
  for (const f of fishes) {
    f.entity.setPosition(f.baseX + Math.sin(elapsed * f.speed + f.phase) * 1.8, f.baseY + Math.sin(elapsed * 0.45 + f.phase) * 0.18, f.baseZ);
    f.entity.rotateLocal(0, Math.sin(elapsed * 0.5 + f.phase) * dt * 1.2, 0);
  }
  for (let i = 0; i < snow.length; i++) {
    const p = snow[i], pos = p.getPosition();
    p.setPosition(pos.x + Math.sin(elapsed * 0.2 + i) * dt * 0.015, pos.y + dt * (0.025 + (i%4)*0.006), pos.z);
    if (pos.y > 6) p.setPosition(pos.x, -5, pos.z);
  }
});

const resize = () => app.resizeCanvas();
window.addEventListener('resize', resize);
