const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const ocean=require('../preview/ocean/js/ocean-ecosystem.js');

function client(entries={}){
  const values=new Map(Object.entries(entries));
  const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  const context=vm.createContext({localStorage:storage,TextEncoder});
  for(const file of ['js/data-backup.js','preview/ocean/js/viewing-records.js']){
    vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
  }
  return {values,storage,backup:context.CinemapBackup,records:context.CinemapRecords};
}

test('all supported keys and unknown record metadata survive backup and remain readable by the original record API',()=>{
  const records=Object.fromEntries(Array.from({length:1000},(_,index)=>{
    const id=String(index+1);
    return [id,{id,title:'映画 '+id,watched:true,rating:3+(index%21)/10,resonated:index%2===0,genres:['ドラマ'],year:2000+index%26,director:'監督',review:'既存レビュー',futureField:{value:index},recordedAt:'2026-01-01T00:00:00Z'}];
  }));
  const entries={
    'cinemap-viewing-records-v1':JSON.stringify(records),
    'cinemap-ocean-demo-records-v1':'{"9000":{"id":"9000","watched":true,"rating":4.5}}',
    'cinemap:ocean:last-shown-growth':'{"stats":{"watched":1000},"milestone":{"label":"シロナガスクジラ"}}',
    'cinemap-my-list':'[{"id":1,"title":"映画 1","movieComment":"大切な一本"}]',
    'cinemap-my-saved-list':'{"picks":[{"id":2}],"title":"保存済み"}',
    'cinemap-my-saved-lists':'[{"picks":[{"id":3}],"title":"別リスト"}]',
    'cinemap-my-candidates':'[{"id":4,"title":"候補"}]',
    'cinemap-my-font-style':'modern',
    'cinemap-my-cinema-theme':'minimal',
    'cinemap-my-cinema-background':'legacy-selection',
    'cinemaNow.mode':'streaming',
    'cinemaNow.active':'Netflix',
    'cinema-theater-prefecture':'神奈川県',
  };
  const old=client(entries),fresh=client();
  const sceneBefore=ocean.build([],old.records.read());
  assert.equal(sceneBefore.stats.watched,1000);
  const result=fresh.backup.restore(fresh.storage,JSON.stringify(old.backup.exportData(old.storage)));
  assert.equal(result.written,13);
  for(const [key,value]of Object.entries(entries))assert.equal(fresh.values.get(key),value,key);
  assert.equal(JSON.stringify(fresh.records.read()),JSON.stringify(records));
  // Each VM represents a different browser and has its own object prototypes.
  assert.equal(JSON.stringify(ocean.build([],fresh.records.read())),JSON.stringify(sceneBefore),'derived Ocean species, growth and state stay identical');
  const newcomer={id:1001,title:'新たな映画',genres:['SF']};
  assert.equal(fresh.records.rate(newcomer,4.5),true);
  assert.equal(fresh.records.get(newcomer).rating,4.5);
  assert.equal(Object.keys(fresh.records.read()).length,1001);
  assert.equal(fresh.records.read()['1'].review,'既存レビュー');
  assert.equal(fresh.records.read()['1'].futureField.value,0);
});
