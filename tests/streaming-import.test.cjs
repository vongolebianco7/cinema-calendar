'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const {validateImport}=require('../scripts/import-streaming-availability.cjs');
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
test('accepts only a complete, audited, rights-cleared feed for all 8 services',()=>{
 assert.equal(validateImport(feed(),now).ok,true);
});
test('blocks missing licenses and missing coverage audit',()=>{
 const a=feed();delete a.license;assert.equal(validateImport(a,now).ok,false);
 const b=feed();delete b.coverage_audit;assert.equal(validateImport(b,now).ok,false);
});
test('blocks even one missing provider or partial provider catalog',()=>{
 const a=feed();delete a.services.WOWOW;assert.equal(validateImport(a,now).ok,false);
 const b=feed();b.services.Netflix.coverage='partial';assert.equal(validateImport(b,now).ok,false);
});
