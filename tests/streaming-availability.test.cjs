'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const {validateSnapshot,matchBookmarkIds}=require('../js/streaming-availability.js');
const NOW=Date.parse('2026-10-27T00:00:00Z');
function snapshot(){
 return {schema_version:1,country:'JP',generated_at:'2026-10-26T23:00:00Z',
  license:{provider:'fixture',agreement_reference:'fixture-contract',public_display_authorized:true},
  coverage_audit:{auditor:'fixture',method:'full feed reconciliation',all_supported_services_verified:true},
  services:{Netflix:{coverage:'complete',entitlement:'subscription',
   source:{urls:['https://example.org/evidence']},
   movies:[{tmdb_id:101,title:'Film A',entitlement:'subscription'},
           {tmdb_id:102,title:'Film B',entitlement:'subscription'}]}}};
}
test('accepts fresh explicitly certified complete JP subscription movie snapshots',()=>{
 const result=validateSnapshot(snapshot(),'Netflix',NOW);assert.equal(result.ok,true);
 assert.deepEqual(matchBookmarkIds(result,[101,101,999]).map(x=>x.tmdb_id),[101]);
});
test('fails closed on missing data, partial coverage, stale and wrong region',()=>{
 assert.equal(validateSnapshot(null,'Netflix',NOW).ok,false);
 for(const field of ['partial','unknown']){const copy=snapshot();copy.services.Netflix.coverage=field;assert.equal(validateSnapshot(copy,'Netflix',NOW).ok,false)}
 const other=snapshot();other.country='US';assert.equal(validateSnapshot(other,'Netflix',NOW).ok,false);
 const stale=snapshot();stale.generated_at='2026-10-20T00:00:00Z';assert.equal(validateSnapshot(stale,'Netflix',NOW).ok,false);
});
test('excludes rent-only offers and duplicate identifiers',()=>{
 const rental=snapshot();rental.services.Netflix.movies[0].entitlement='rent';assert.equal(validateSnapshot(rental,'Netflix',NOW).ok,false);
 const duplicate=snapshot();duplicate.services.Netflix.movies[1].tmdb_id=101;assert.equal(validateSnapshot(duplicate,'Netflix',NOW).ok,false);
});
test('does not return misleading bookmark counts from invalid evidence',()=>{
 const bad=validateSnapshot({movies:[{tmdb_id:101}]},'Netflix',NOW);
 assert.equal(matchBookmarkIds(bad,[101]),null);
});

test('gain/loss differences are deduped and unavailable without complete evidence',()=>{
 const first=snapshot();
 const next=snapshot();next.services.Netflix.movies=[
   {tmdb_id:102,title:'Film B',entitlement:'subscription'},
   {tmdb_id:103,title:'Film C',entitlement:'subscription'}];
 const a=validateSnapshot(first,'Netflix',NOW),b=validateSnapshot(next,'Netflix',NOW);
 const comparison=require('../js/streaming-availability.js').compareBookmarkAvailability(a,b,[101,102,103,103]);
 assert.deepEqual(comparison.gained.map(x=>x.tmdb_id),[103]);
 assert.deepEqual(comparison.lost.map(x=>x.tmdb_id),[101]);
 assert.deepEqual(comparison.shared.map(x=>x.tmdb_id),[102]);
 assert.equal(require('../js/streaming-availability.js').compareBookmarkAvailability(a,{ok:false},[101]),null);
});

test('refuses complete-looking snapshots without public display rights and coverage audit',()=>{
 const noLicense=snapshot();delete noLicense.license;
 assert.equal(validateSnapshot(noLicense,'Netflix',NOW).reason,'unlicensed-feed');
 const noAudit=snapshot();delete noAudit.coverage_audit;
 assert.equal(validateSnapshot(noAudit,'Netflix',NOW).reason,'unaudited-coverage');
});
