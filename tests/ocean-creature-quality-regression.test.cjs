const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const root='preview/ocean/real-fish';
const manifest=JSON.parse(fs.readFileSync(`${root}/milestone-assets.json`,'utf8'));
const catalog=JSON.parse(fs.readFileSync(`${root}/creature-catalog.json`,'utf8'));
const swim=fs.readFileSync(`${root}/milestone-swim.js`,'utf8');
const atlas=fs.readFileSync(`${root}/milestone-atlas.js`,'utf8');
const population=fs.readFileSync(`${root}/photo-four-points.js`,'utf8');

test('special-creature propulsion pulses are about one tenth of the current step size',()=>{
  const m=swim.match(/const PULSE_STEPS=(\d+)/);
  assert.ok(m,'PULSE_STEPS must be explicit');
  assert.ok(Number(m[1])>=800,`expected at least 800 pulse steps, got ${m[1]}`);
  const f=swim.match(/const PULSE_ROUTE_DURATION_FACTOR=(\d+)/);
  assert.ok(f&&Number(f[1])>=40,'route duration must grow so short strokes do not become frantic');
});

test('commemorative animals are always fully opaque',()=>{
  assert.match(population,/renderCommemorative[\s\S]*node\.style\.opacity=['\"]1['\"]/);
});

test('dolphin and dugong move in the direction their heads face',()=>{
  assert.match(swim,/dolphin:\{[^}]*direction:'reverse'/);
  assert.match(swim,/dugong:\{[^}]*direction:'reverse'/);
});

test('hammerhead and large shark use direct high-quality assets with animated tails',()=>{
  for(const key of ['hammerhead-shark','large-shark']){
    const spec=manifest.species[key];
    assert.ok(spec.asset,`${key} needs a direct asset instead of the old atlas crop`);
    assert.ok(spec.deformation,`${key} needs tail deformation`);
    assert.match(spec.deformation.profile,/tail-flex-/);
    assert.ok(Number(spec.deformation.flexSpan)>0&&Number(spec.deformation.flexSpan)<=.4);
  }
});

test('sea turtle uses a direct photo asset and moving flipper profile',()=>{
  const spec=manifest.species['sea-turtle'];
  assert.ok(spec.asset,'sea turtle needs direct photo asset');
  assert.equal(spec.deformation?.profile,'flipper-flex');
});

test('giant octopus is a direct visible asset with tentacle motion',()=>{
  const spec=manifest.species['giant-octopus'];
  assert.ok(spec.asset,'giant octopus needs direct asset');
  assert.equal(spec.deformation?.profile,'tentacle-wave');
  assert.ok(Number(spec.presentationScale)>=2);
  assert.match(atlas,/tentacle-wave/);
});

test('ordinary spawn pool excludes vector or render-style fish',()=>{
  const fish=catalog.creatures.filter(c=>c.kind==='fish');
  const low=fish.filter(c=>String(c.asset||'').endsWith('.svg')||String(c.assetStatus||'').includes('vector')||String(c.assetStatus||'').includes('render'));
  assert.ok(low.length>0,'fixture must contain low-quality vector/render species so filter matters');
  assert.match(population,/ordinaryFishCatalog[\s\S]*!String\(c\.asset\|\|'"'"''"'"'\)\.endsWith\(['\"]\.svg['\"]\)/);
  assert.match(population,/ordinaryFishCatalog[\s\S]*!String\(c\.assetStatus\|\|'"'"''"'"'\)\.includes\(['\"]vector['\"]\)/);
  assert.match(population,/ordinaryFishCatalog[\s\S]*!String\(c\.assetStatus\|\|'"'"''"'"'\)\.includes\(['\"]render['\"]\)/);
});

test('deformation renderer can keep keyed animals opaque after background removal',()=>{
  assert.match(atlas,/opaqueBody/);
  assert.match(atlas,/data\[i\+3\]=data\[i\+3\]>\d+\?255:0/);
});
