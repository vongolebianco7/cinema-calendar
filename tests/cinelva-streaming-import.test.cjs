'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const test=require('node:test');
const {validateImport,writeValidatedImport}=require('../scripts/import-streaming-availability.cjs');
const {serviceKeys}=require('../js/streaming-availability.js');
const now=Date.parse('2026-10-27T12:00:00Z');
function feed(){
 const services={};
 for(const name of serviceKeys)services[name]={
  coverage:'complete',entitlement:'subscription',
  source:{urls:['https://example.org/licensed-source']},
  movies:[{tmdb_id:101,title:'Fixture',entitlement:'subscription'}]
 };
 return {schema_version:1,country:'JP',generated_at:'2026-10-27T11:00:00Z',
  license:{provider:'fixture',agreement_reference:'fixture-contract',public_display_authorized:true},
  coverage_audit:{auditor:'fixture',method:'complete feed reconciliation',all_supported_services_verified:true},
  services};
}
test('accepts only a complete, audited, rights-cleared feed for all 12 services',()=>{
 assert.equal(validateImport(feed(),now).ok,true);
});
test('blocks missing licenses and missing coverage audit',()=>{
 const a=feed();delete a.license;assert.equal(validateImport(a,now).ok,false);
 const b=feed();delete b.coverage_audit;assert.equal(validateImport(b,now).ok,false);
});
test('blocks even one missing provider or partial provider catalog',()=>{
 const a=feed();delete a.services.ABEMA;assert.equal(validateImport(a,now).ok,false);
 const b=feed();b.services.Netflix.coverage='partial';assert.equal(validateImport(b,now).ok,false);
});

test('invalid feed preserves the last-known-good file and valid feed replaces it atomically',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'cinelva-streaming-import-'));
 const target=path.join(directory,'snapshot.json');
 try{
  fs.writeFileSync(target,'last-known-good\n');
  const invalid=feed();delete invalid.services.WOWOWオンデマンド;
  const rejected=writeValidatedImport(invalid,target,now);
  assert.equal(rejected.ok,false);
  assert.equal(fs.readFileSync(target,'utf8'),'last-known-good\n');
  const accepted=writeValidatedImport(feed(),target,now);
  assert.equal(accepted.ok,true);
  const stored=JSON.parse(fs.readFileSync(target,'utf8'));
  assert.equal(Object.keys(stored.services).length,12);
  assert.equal(stored.services.Netflix.movies[0].tmdb_id,101);
  assert.equal(fs.readdirSync(directory).filter(name=>name.endsWith('.tmp')).length,0);
 }finally{fs.rmSync(directory,{recursive:true,force:true})}
});
