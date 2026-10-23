const {test}=require('node:test'),assert=require('node:assert/strict');
const {unchangedConfiguration}=require('../scripts/verify-production-release.cjs');
test('Vercel JSON formatting and object key order preserve the exact configuration meaning',()=>{assert.equal(unchangedConfiguration('vercel.json','{"buildCommand":"node scripts/build-static.cjs","headers":[{"source":"/","headers":[]}]}','{\n "headers": [{"headers": [], "source": "/"}],\n "buildCommand": "node scripts/build-static.cjs"\n}'),true);});
test('backend Vercel formatting also preserves configuration meaning',()=>{assert.equal(unchangedConfiguration('backend/vercel.json','{"installCommand":"npm ci","version":2}','{ "version": 2, "installCommand": "npm ci" }'),true);});
test('actual commands, types, array ordering and new keys remain protected',()=>{for(const current of ['{"buildCommand":"false","routes":["a","b"]}','{"buildCommand":1,"routes":["a","b"]}','{"buildCommand":"node build","routes":["b","a"]}','{"buildCommand":"node build","routes":["a","b"],"env":{}}'])assert.equal(unchangedConfiguration('vercel.json','{"buildCommand":"node build","routes":["a","b"]}',current),false);});
test('normalization cannot exempt other source or invalid configuration',()=>{for(const name of ['js/app.js','data/backend.json','other/vercel.json'])assert.equal(unchangedConfiguration(name,'{}','{}'),false);for(const value of ['invalid','null','[]','42'])assert.equal(unchangedConfiguration('vercel.json',value,value),false);});
const fs=require('node:fs'),path=require('node:path');
const frontend=fs.readFileSync(path.join(__dirname,'../vercel.json'),'utf8');
const backend=fs.readFileSync(path.join(__dirname,'../backend/vercel.json'),'utf8');
test('Vercel backend build may materialize only its exact committed project config at the repository root',()=>{
 assert.equal(unchangedConfiguration('vercel.json',frontend,backend,{vercel:true,appDirectory:'backend',backendConfiguration:backend}),true);
});
test('backend config materialization cannot exempt frontend builds, local edits, other paths or changed values',()=>{
 const context={vercel:true,appDirectory:'backend',backendConfiguration:backend};
 for(const override of [{vercel:false},{appDirectory:''},{appDirectory:'backend/nested'},{backendConfiguration:null}])assert.equal(unchangedConfiguration('vercel.json',frontend,backend,{...context,...override}),false);
 for(const name of ['backend/vercel.json','data/backend.json'])assert.equal(unchangedConfiguration(name,frontend,backend,context),false);
 const changed=JSON.stringify({...JSON.parse(backend),installCommand:'echo changed'});
 assert.equal(unchangedConfiguration('vercel.json',frontend,changed,context),false);
});
