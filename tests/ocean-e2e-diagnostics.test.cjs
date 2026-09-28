const assert = require('assert');
const path = require('path');

const diagnostics = require(path.join(__dirname, '..', 'preview/ocean/js/ocean-e2e-diagnostics.js'));

const healthy = {
  delivery:{index:true,bundle:true,assets:true,bundleReal:true},
  renderer:{booted:true,ready:true,organisms:1},
  persistence:{written:true,restored:true},
  model:{valid:true,organisms:1},
  visual:{valid:true},
  harness:{valid:true}
};
const classify = patch => diagnostics.classify({...healthy,...patch});

assert.equal(classify({delivery:{...healthy.delivery,bundle:false}}).code,'DELIVERY_FAIL');
assert.equal(classify({renderer:{...healthy.renderer,booted:false,ready:false}}).code,'RENDERER_BOOT_FAIL');
assert.equal(classify({persistence:{written:false,restored:false}}).code,'PERSISTENCE_WRITE_FAIL');
assert.equal(classify({persistence:{written:true,restored:false}}).code,'PERSISTENCE_RESTORE_FAIL');
assert.equal(classify({model:{valid:false,organisms:0}}).code,'MODEL_FAIL');
assert.equal(classify({renderer:{...healthy.renderer,organisms:0}}).code,'ADAPTER_FAIL');
assert.equal(classify({visual:{valid:false}}).code,'RENDERER_VISUAL_FAIL');
assert.equal(classify({harness:{valid:false}}).code,'E2E_HARNESS_FAIL');
assert.equal(diagnostics.classify(healthy).code,'PASS');

const report=diagnostics.report({...healthy,model:{valid:true,organisms:2},renderer:{...healthy.renderer,organisms:0}},{step:'record-grow',movieId:'test-film-a'});
assert.equal(report.classification,'ADAPTER_FAIL');
assert.equal(report.step,'record-grow');
assert.equal(report.movieId,'test-film-a');
assert.equal(report.expectedOrganisms,2);
assert.equal(report.actualOrganisms,0);
console.log('Ocean E2E diagnostic contract tests passed');
