const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
function n(key){const m=src.match(new RegExp(`${key}:(\\d+(?:\\.\\d+)?)`));assert.ok(m,`missing ${key}`);return Number(m[1]);}
test('relative body lengths keep large animals visibly larger',()=>{
  assert.ok(n('whale')>n('manta'));
  assert.ok(n('manta')>n('shark'));
  assert.ok(n('shark')>n('sword'));
  assert.ok(n('sword')>n('grouper'));
  assert.ok(n('grouper')>n('angler'));
  assert.ok(n('angler')>n('butterfly'));
  assert.ok(n('butterfly')>n('clown'));
});
