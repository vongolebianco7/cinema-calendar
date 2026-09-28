const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const path=require('path');

const source=fs.readFileSync(path.join(__dirname,'..','preview/ocean/js/ocean-3d-primary.js'),'utf8');
const window={};
const context={window,console};
vm.runInNewContext(source,context);
const api=window.CinemapOcean3DPrimary;
assert.equal(typeof api.growthMoment,'function','growthMoment is exposed for deterministic tests');

const previous={stats:{watched:4},milestone:{label:'浅瀬',nextAt:5,nextLabel:'珊瑚礁',remaining:1}};
const grown={stats:{watched:5},milestone:{label:'珊瑚礁',nextAt:10,nextLabel:'群れの海',remaining:5},organisms:[{id:'new-film',rating:4.5}]};
const moment=api.growthMoment(previous,grown);
assert.equal(moment.kind,'milestone');
assert.equal(moment.title,'珊瑚礁へ成長');
assert.ok(moment.detail.includes('5本'));

const ordinary=api.growthMoment({stats:{watched:5},milestone:{label:'珊瑚礁'}},{stats:{watched:6},milestone:{label:'珊瑚礁'},organisms:[{id:'another',rating:4}]});
assert.equal(ordinary.kind,'new-life');
assert.ok(ordinary.title.includes('新しい生命'));

assert.equal(api.growthMoment(grown,grown),null,'reopening the same ecosystem does not replay the moment');
console.log('Ocean growth moment tests passed');
