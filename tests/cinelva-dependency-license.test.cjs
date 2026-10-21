const test=require('node:test'),assert=require('node:assert/strict');
const check=()=>require('../scripts/check_dependency_licenses.cjs').audit;
const manifest={dependencies:{demo:'^1.0.0'},devDependencies:{}};
function fixture(){return {lockfileVersion:3,packages:{'':manifest,'node_modules/demo':{version:'1.0.1',resolved:'https://registry.npmjs.org/demo/-/demo-1.0.1.tgz',integrity:'sha512-example',license:'MIT'}}};}
test('exact lock metadata produces a versioned license inventory',()=>{const r=check()(fixture(),manifest);assert.deepEqual(r.errors,[]);assert.equal(r.packages[0].version,'1.0.1');assert.equal(r.packages[0].license,'MIT');});
test('missing license and untrusted package provenance fail closed',()=>{const lock=fixture();delete lock.packages['node_modules/demo'].license;lock.packages['node_modules/demo'].resolved='file:../other';assert.ok(check()(lock,manifest).errors.length>=2);});
test('manifest drift cannot silently reuse an old inventory',()=>{assert.ok(check()(fixture(),{dependencies:{demo:'^2.0.0'}}).errors.some(x=>x.includes('manifest')));});
test('complex license metadata stays flagged for review rather than being called cleared',()=>{const lock=fixture();lock.packages['node_modules/demo'].license='LGPL-3.0-or-later';const r=check()(lock,manifest);assert.equal(r.manual_review_packages.length,1);assert.equal(r.legal_clearance,false);});
