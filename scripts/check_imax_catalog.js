const fs=require('fs');
const assert=require('assert');
const {validateCatalog,matchCatalogRecord}=require('./imax-catalog.js');
const {generateReport,detectConflicts,preserveLastKnownGood}=require('./report_imax_catalog.js');
const {canFetchSource,planRefresh,refreshCatalog}=require('./refresh_imax_catalog.js');
const catalog=JSON.parse(fs.readFileSync('data/imax_catalog.json','utf8'));
const evidence=JSON.parse(fs.readFileSync('data/screening_format_evidence.json','utf8'));
const allowlist=JSON.parse(fs.readFileSync('data/imax_source_allowlist.json','utf8'));

(async()=>{
let v=validateCatalog(catalog);assert.equal(v.valid,true,v.errors.join('\n'));assert.ok(catalog.records.length>=6,'benchmark catalog must contain at least six records');
const bad=JSON.parse(JSON.stringify(catalog));bad.records[0].evidence=[];assert.equal(validateCatalog(bad).valid,false,'official facts require provenance');
const empty={version:1,records:[]};assert.equal(validateCatalog(empty).valid,false,'empty proposed catalog must fail');
const unknown=JSON.parse(JSON.stringify(catalog));unknown.records[0].imax_specific_sound='unknown';assert.equal(validateCatalog(unknown).valid,true,'unknown is a valid explicit state');
const dup=JSON.parse(JSON.stringify(catalog));dup.records.push(JSON.parse(JSON.stringify(dup.records[0])));assert.equal(validateCatalog(dup).valid,false,'duplicate stable identity must fail');
const opp=catalog.records.find(r=>r.title==='Oppenheimer');assert.equal(matchCatalogRecord({id:872585,title:'anything',year:2023},catalog),opp,'TMDb ID wins');assert.equal(matchCatalogRecord({original_title:'Oppenheimer',title:'オッペンハイマー',year:2023},catalog),opp,'original title + year matches');assert.equal(matchCatalogRecord({title:'オッペンハイマー',year:2023},catalog),opp,'alias + year matches');assert.equal(matchCatalogRecord({title:'Oppenheimer'},catalog),null,'title alone must not match');assert.equal(matchCatalogRecord({title:'Oppenheimer',year:1999},catalog),null,'wrong year must not match');

const preserved=preserveLastKnownGood(catalog,empty);assert.equal(preserved.accepted,false);assert.strictEqual(preserved.catalog,catalog,'invalid proposal preserves last-known-good object');
const stale=JSON.parse(JSON.stringify(catalog));stale.records[0].last_verified_at='2025-01-01';let report=generateReport(stale,evidence,[],'2026-09-26');assert.ok(report.stale_records.some(x=>x.title==='Oppenheimer'),'stale records are marked, not deleted');assert.ok(report.unresolved_records.some(x=>x.title==='The Odyssey'),'records without a resolved stable ID are reported');
const conflicting=JSON.parse(JSON.stringify(evidence));conflicting.films=Object.assign({},conflicting.films,{'872585':Object.assign({},conflicting.films?.['872585'],{filmed_for_imax:false})});assert.ok(detectConflicts(catalog,conflicting).some(x=>x.title==='Oppenheimer'&&x.field==='filmed_for_imax'),'contradictory local facts are reported');

const source={url:'https://www.imax.com/movie/example'};assert.equal(canFetchSource(source,allowlist),false,'disabled allowlist never permits fetching');
const approved=JSON.parse(JSON.stringify(allowlist));approved.collection_enabled=true;approved.sources[0].approved_for_automated_fetch=true;approved.sources[0].fetch_mode='automated';assert.equal(canFetchSource(source,approved),true,'explicitly approved source can pass boundary');
const planned=planRefresh([source,source,source],approved,{maxRequests:2});assert.equal(planned.concurrency,1,'collector concurrency is hard-limited to one');assert.equal(planned.requests.length,2,'request budget is enforced');
let fetchCalls=0;const failed=await refreshCatalog({currentCatalog:catalog,sources:[source],allowlist:approved,maxRequests:1,fetcher:async()=>{fetchCalls++;throw Error('simulated failure')},parser:async()=>empty});assert.equal(fetchCalls,1);assert.equal(failed.updated,false);assert.strictEqual(failed.catalog,catalog,'fetch failure cannot replace committed catalog');
const invalid=await refreshCatalog({currentCatalog:catalog,sources:[source],allowlist:approved,maxRequests:1,fetcher:async()=>({}),parser:async()=>empty});assert.equal(invalid.updated,false);assert.strictEqual(invalid.catalog,catalog,'invalid parse result cannot replace committed catalog');

console.log('IMAX catalog validation, reporting and refresh-boundary suite passed');
})().catch(e=>{console.error(e);process.exit(1)});
