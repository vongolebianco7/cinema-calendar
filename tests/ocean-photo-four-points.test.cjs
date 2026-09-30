const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const html=fs.readFileSync('preview/ocean/real-fish/ecosystem.html','utf8');

test('Ocean message is below the sea, never overlaid on it',()=>{
  const closeStage=html.indexOf('</div><div class="hud">');
  assert.ok(closeStage>=0,'HUD should be a sibling after .stage');
  assert.doesNotMatch(html,/\.hud\{position:absolute/);
});

test('Photo Ocean uses the approved high-resolution background without stretching',()=>{
  assert.match(html,/src="ocean-background-approved-hires\.png"/);
  assert.match(html,/\.oceanBackdrop\{[^}]*object-fit:cover/);
});

test('visible creature target equals watched record count exactly',()=>{
  assert.match(html,/function populationTarget\(records\)\{return Object\.keys\(records\|\|\{\}\)\.length\}/);
  assert.match(html,/const target=populationTarget\(records\)/);
  assert.match(html,/const commemorativeCount=Math\.floor\(target\/100\)/);
  assert.match(html,/const ordinaryTarget=target-commemorativeCount/);
});

test('every completed 100 films replaces one ordinary creature with a commemorative creature',()=>{
  assert.match(html,/function renderCommemorative\(/);
  assert.match(html,/for\(let milestone=100;milestone<=target;milestone\+=100\)/);
  assert.match(html,/renderCommemorative\(milestone/);
});
