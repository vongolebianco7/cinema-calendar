const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const immersive=fs.readFileSync('preview/ocean/js/ocean-immersive.js','utf8');
const renderer=fs.readFileSync('preview/ocean/renderer/src/main.js','utf8');
const environment=fs.readFileSync('preview/ocean/renderer/src/environment.js','utf8');

test('dashboard immersive Ocean mounts the approved backdrop behind WebGL',()=>{
  assert.match(immersive,/class=\\?"ocean3dBackdrop\\?"/);
  assert.match(immersive,/real-fish\/optimized\/ocean-background-approved\.webp/);
  assert.match(immersive,/class=\\?"ocean3dCanvas\\?"/);
});

test('WebGL canvas preserves DOM backdrop transparency',()=>{
  assert.match(renderer,/WebGLRenderer\(\{canvas,antialias:true,alpha:true/);
  assert.doesNotMatch(renderer,/scene\.background=new THREE\.Color/);
  assert.match(renderer,/scene\.background=null/);
});

test('water atmosphere is translucent rather than an opaque backdrop replacement',()=>{
  assert.match(environment,/ShaderMaterial\(\{transparent:true/);
  assert.match(environment,/gl_FragColor=vec4\(c,\.18\)/);
});
