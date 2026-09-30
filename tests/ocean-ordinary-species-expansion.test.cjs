const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const catalogPath = path.join(root, 'preview', 'ocean', 'real-fish', 'creature-catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const byId = new Map(catalog.creatures.map((c) => [c.id, c]));

const expected = [
  ['palette-surgeonfish', 'ナンヨウハギ', true, 'midwater', 'small-school-cruise'],
  ['firefish-goby', 'ハタタテハゼ', false, 'reef-bottom', 'hover-dart'],
  ['six-line-wrasse', 'ニセモチノウオ', false, 'reef-lower', 'reef-dart'],
  ['damselfish', 'スズメダイ', true, 'reef-midwater', 'dense-school-cruise'],
  ['lyretail-anthias', 'アカネハナゴイ', true, 'reef-upper', 'loose-school-glide'],
  ['red-seabream', 'マダイ', false, 'midwater', 'heavy-cruise'],
  ['filefish', 'カワハギ', false, 'midwater-lower', 'fin-drift'],
];

test('ordinary Ocean catalog contains the seven approved species with distinct ecology roles', () => {for (const [id,name,schooling,zone,motionProfile] of expected){const creature=byId.get(id);assert.ok(creature,`${id} should exist`);assert.equal(creature.name,name);assert.equal(creature.kind,'fish');assert.equal(creature.schooling,schooling);assert.equal(creature.zone,zone);assert.equal(creature.motionProfile,motionProfile);assert.ok(Number(creature.realLengthCm)>0);assert.ok(Number(creature.displayScale)>0);assert.ok(Number(creature.spawnWeight)>0);assert.ok(Number(creature.unlockAt)<=100,`${id} should join the ordinary ecosystem within the first 100 films`);assert.match(creature.assetStatus||'',/^ready-distinct-/);}});
test('schooling species declare deliberately different group-size envelopes',()=>{assert.deepEqual(byId.get('palette-surgeonfish').schoolSize,[3,7]);assert.deepEqual(byId.get('damselfish').schoolSize,[10,25]);assert.deepEqual(byId.get('lyretail-anthias').schoolSize,[12,28]);});
test('new species use dedicated assets rather than recoloring one shared fish',()=>{const ids=['palette-surgeonfish','firefish-goby','six-line-wrasse','damselfish','lyretail-anthias','filefish'];const assets=ids.map(id=>byId.get(id)?.asset);assert.equal(assets.filter(Boolean).length,ids.length);assert.equal(new Set(assets).size,ids.length);for(const asset of assets)assert.ok(fs.existsSync(path.join(root,'preview','ocean','real-fish',asset)),`${asset} should exist`);});
test('red seabream is promoted from a generic family label to the exact species name',()=>{const madai=byId.get('red-seabream');assert.equal(madai?.name,'マダイ');assert.equal(madai?.realLengthCm,40);assert.equal(madai?.displayScale,1);});
test('ordinary species motion module covers all seven approved motion profiles',()=>{const source=fs.readFileSync(path.join(root,'preview','ocean','real-fish','ordinary-species-motion.js'),'utf8');for(const [,,,,profile] of expected)assert.ok(source.includes(profile),`motion profile ${profile} should be implemented`);});
test('ordinary species QA gallery exists before production sign-off',()=>{const galleryPath=path.join(root,'preview','ocean','real-fish','ordinary-species-gallery.html');assert.ok(fs.existsSync(galleryPath));const html=fs.readFileSync(galleryPath,'utf8');for(const [id,name] of expected){assert.ok(html.includes(id),`${id} should be selectable in gallery`);assert.ok(html.includes(name)||html.includes('creature-catalog.json'),`${name} should be represented through catalog-backed gallery`);}assert.ok(html.includes('ordinary-species-motion.js'));});
