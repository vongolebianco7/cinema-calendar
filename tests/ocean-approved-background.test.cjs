const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('preview/ocean/real-fish/ecosystem.html','utf8');
const provenance=fs.readFileSync('preview/ocean/real-fish/BACKGROUND_PROVENANCE.md','utf8');
const terrain=JSON.parse(fs.readFileSync('preview/ocean/real-fish/terrain-map.json','utf8'));

test('photo Ocean uses the explicitly approved local turquoise-cobalt background',()=>{
  assert.match(html,/src="optimized\/ocean-background-approved\.webp"/);
  assert.doesNotMatch(html,/background:[^;}]*scene-seabed\.webp/);
  assert.ok(fs.statSync('preview/ocean/real-fish/optimized/ocean-background-approved.webp').size>10000);
});

test('approved composition is a dedicated full-stage backdrop instead of a CSS crop',()=>{
  assert.match(html,/<img class="oceanBackdrop" id="oceanBackdrop" src="optimized\/ocean-background-approved\.webp"/);
  assert.match(html,/\.oceanBackdrop\{[^}]*width:100%;height:100%;object-fit:fill;z-index:0/);
  assert.match(html,/\.stage\{[^}]*background:#087fc3;/);
  assert.doesNotMatch(html,/ocean-background-approved\.webp[^;}]*cover/);
});

test('creatures are layered independently and never baked into the scenery contract',()=>{
  assert.match(html,/className='fishWrap '/);
  assert.match(html,/className='seabedCreature'/);
  assert.doesNotMatch(html,/background:[^;}]*(fish|octopus|turtle|stingray)/i);
});

test('legacy seabed art is not layered over the approved composition',()=>{
  assert.doesNotMatch(html,/background-image:url\(['"]optimized\/scene-seabed\.webp/);
});

test('background remains visual-only while behavior uses the independent terrain map',()=>{
  assert.equal(terrain.backgroundIndependent,true);
  assert.match(html,/terrain-map\.json/);
});

test('approved generated asset has explicit provenance and no runtime AI dependency',()=>{
  assert.match(provenance,/explicitly approved/);
  assert.match(provenance,/no generative-AI API/i);
  assert.match(provenance,/no paid API/i);
});
