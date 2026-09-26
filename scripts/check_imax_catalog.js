const fs=require('fs');
const assert=require('assert');
const {validateCatalog,matchCatalogRecord}=require('./imax-catalog.js');
const catalog=JSON.parse(fs.readFileSync('data/imax_catalog.json','utf8'));

let v=validateCatalog(catalog);
assert.equal(v.valid,true,v.errors.join('\n'));
assert.ok(catalog.records.length>=6,'benchmark catalog must contain at least six records');

const bad=JSON.parse(JSON.stringify(catalog));
bad.records[0].evidence=[];
assert.equal(validateCatalog(bad).valid,false,'official facts require provenance');

const unknown=JSON.parse(JSON.stringify(catalog));
unknown.records[0].imax_specific_sound='unknown';
assert.equal(validateCatalog(unknown).valid,true,'unknown is a valid explicit state');

const dup=JSON.parse(JSON.stringify(catalog));
dup.records.push(JSON.parse(JSON.stringify(dup.records[0])));
assert.equal(validateCatalog(dup).valid,false,'duplicate stable identity must fail');

const opp=catalog.records.find(r=>r.title==='Oppenheimer');
assert.equal(matchCatalogRecord({id:872585,title:'anything',year:2023},catalog),opp,'TMDb ID wins');
assert.equal(matchCatalogRecord({original_title:'Oppenheimer',title:'オッペンハイマー',year:2023},catalog),opp,'original title + year matches');
assert.equal(matchCatalogRecord({title:'オッペンハイマー',year:2023},catalog),opp,'alias + year matches');
assert.equal(matchCatalogRecord({title:'Oppenheimer'},catalog),null,'title alone must not match');
assert.equal(matchCatalogRecord({title:'Oppenheimer',year:1999},catalog),null,'wrong year must not match');

console.log('IMAX catalog validation/matching suite passed');
