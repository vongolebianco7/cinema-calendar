const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
const block=src.match(/HABITAT_Y\s*=\s*\{([^}]+)\}/);test('habitat bands put seabed life below reef and pelagic life',()=>{
  assert.ok(block);
  const value=k=>Number(block[1].match(new RegExp(`${k}:(-?\\d+(?:\\.\\d+)?)`))[1]);
  assert.ok(value('benthic')<value('reef'));
  assert.ok(value('drifter')<value('reef'));
  assert.ok(value('reef')<value('pelagic'));
});
