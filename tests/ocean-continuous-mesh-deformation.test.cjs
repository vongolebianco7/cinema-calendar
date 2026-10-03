const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const atlas=fs.readFileSync('preview/ocean/real-fish/milestone-atlas.js','utf8');
const manifest=JSON.parse(fs.readFileSync('preview/ocean/real-fish/milestone-assets.json','utf8'));

test('megafauna deformation uses a continuous WebGL texture mesh instead of vertical image slices',()=>{
  assert.match(atlas,/webgl2|webgl/);
  assert.match(atlas,/createMesh|meshVertices|vertexShader/i);
  assert.match(atlas,/drawElements|drawArrays/);
  assert.match(atlas,/texImage2D/);
  assert.doesNotMatch(atlas,/function sliceCountForWidth/);
  assert.doesNotMatch(atlas,/const slices=sliceCountForWidth/);
  assert.doesNotMatch(atlas,/sliceW=source\.width\/slices/);
  assert.doesNotMatch(atlas,/ctx\.drawImage\(source,sx,0,sliceW/);
});

test('mesh has enough subdivisions for curved fins while deformation stays GPU-side',()=>{
  const cols=Number(atlas.match(/MESH_COLS=(\d+)/)?.[1]||0);
  const rows=Number(atlas.match(/MESH_ROWS=(\d+)/)?.[1]||0);
  assert.ok(cols>=20,`mesh needs >=20 columns, got ${cols}`);
  assert.ok(rows>=8,`mesh needs >=8 rows, got ${rows}`);
  assert.match(atlas,/uniform.*time|uTime/i);
  assert.match(atlas,/requestAnimationFrame/);
});

test('fin and tail wave propagates from root to tip instead of rotating the whole appendage as one rigid piece',()=>{
  assert.match(atlas,/phaseLag|wavePhase|propagation/i);
  assert.match(atlas,/root|hinge|flexSpan/i);
  for(const key of ['manta-ray','sea-turtle','dolphin','dugong','minke-whale','orca','humpback-whale','whale-shark','blue-whale']){
    const spec=manifest.species[key];
    assert.ok(spec?.deformation,`${key} needs deformation metadata`);
  }
});

test('continuous deformation keeps shared scheduling and an iPhone-safe resolution cap',()=>{
  assert.match(atlas,/deformationRegistry/);
  assert.match(atlas,/DEFORMATION_DPR_CAP=1\.25/);
  assert.match(atlas,/DEFORMATION_WIDTH_CAP=520/);
  const rafCalls=(atlas.match(/requestAnimationFrame\(/g)||[]).length;
  assert.ok(rafCalls<=2,`deformation should share RAF scheduling, got ${rafCalls}`);
});
