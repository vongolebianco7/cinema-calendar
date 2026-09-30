const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const records=fs.readFileSync('preview/ocean/js/my-records.js','utf8');
const immersive=fs.readFileSync('preview/ocean/js/ocean-immersive.js','utf8');

test('dashboard never renders the legacy CinemapOceanView scene',()=>{
  assert.doesNotMatch(records,/CinemapOceanView\?\.render/);
  assert.match(records,/CinemapOceanImmersive\?\.mount/);
});

test('duplicate immersive mounts with unchanged records are ignored',()=>{
  assert.match(immersive,/lastSignature/);
  assert.match(immersive,/if\(signature===lastSignature&&host\.querySelector\('\.ocean3dPrimary'\)\)return/);
});
