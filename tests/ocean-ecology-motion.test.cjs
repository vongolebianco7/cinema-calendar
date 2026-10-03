const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const swim=fs.readFileSync('preview/ocean/real-fish/milestone-swim.js','utf8');
const atlas=fs.readFileSync('preview/ocean/real-fish/milestone-atlas.js','utf8');
const ecosystem=fs.readFileSync('preview/ocean/real-fish/ecosystem.html','utf8');
const manifest=JSON.parse(fs.readFileSync('preview/ocean/real-fish/milestone-assets.json','utf8'));

test('megafauna use species-aware vertical habitat bands instead of three fixed lanes',()=>{
  assert.match(swim,/SPECIES_SWIM_BANDS/);
  assert.match(swim,/HABITAT_SWIM_BANDS/);
  assert.match(swim,/bandFor\(/);
  assert.doesNotMatch(swim,/const PASS_THROUGH_LANES=\[-22,0,22\]/);
  for(const key of ['dolphin','orca','humpback-whale','minke-whale'])assert.match(swim,new RegExp(key.replace('-','\\-')+"[^\\n]*surface"));
  assert.match(swim,/dugong[^\n]*(seagrass|lower)/);
  assert.match(swim,/giant-octopus[^\n]*(seabed|bottom)/);
});

test('schooling fish move as cohorts with leader phase and follower lag',()=>{
  assert.match(ecosystem,/schoolMotion/);
  assert.match(ecosystem,/data-school/);
  assert.match(ecosystem,/--school-phase/);
  assert.match(ecosystem,/--school-lag/);
  assert.match(ecosystem,/@keyframes schoolFollow/);
});

test('octopus uses jet propulsion cadence and stays seabed-oriented',()=>{
  assert.equal(manifest.species['giant-octopus'].habitat,'seabed-rock');
  assert.match(swim,/'giant-octopus':\{[^}]*family:'octopus-jet'/);
  assert.match(swim,/octopusJetRoute/);
  assert.match(swim,/octopusJetPulse/);
  assert.match(atlas,/tentacle-wave/);
});

test('manta and turtle use visibly large fin or flipper strokes',()=>{
  const manta=manifest.species['manta-ray'];
  const turtle=manifest.species['sea-turtle'];
  assert.ok(Number(manta.deformation?.amplitude)>=40,'manta wing amplitude should be large');
  assert.ok(Number(turtle.deformation?.amplitude)>=30,'turtle flipper amplitude should be large');
  assert.match(atlas,/wing-flex/);
  assert.match(atlas,/flipper-flex/);
  assert.match(atlas,/phaseOffset/);
});

test('surface-breathing cetaceans include gentle ascent and descent in route keyframes',()=>{
  assert.match(swim,/surfaceRise/);
  assert.match(swim,/surfaceDip/);
  assert.match(swim,/--swim-surface-rise/);
  assert.match(swim,/--swim-surface-dip/);
});
