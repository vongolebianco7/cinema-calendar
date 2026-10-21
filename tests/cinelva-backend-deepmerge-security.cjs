// Runs after locked backend installation; not a replacement for Prisma compilation.
const assert=require('node:assert/strict'),path=require('node:path');
const backendRequire=require('node:module').createRequire(path.resolve('backend/package.json'));
const {deepmerge}=backendRequire('deepmerge-ts');
const left={},right={};left.self=left;right.self=right;
try{const merged=deepmerge(left,right);assert.ok(merged&&typeof merged==='object');}
catch(error){assert.notEqual(error.name,'RangeError','Recursive input must not exhaust the stack (GHSA-ggr8-5vv4-36mx)');assert.match(error.message,/cycl|circul|recurs/i);}
assert.deepEqual(deepmerge({datasource:{url:'old'},migrations:{path:'prisma/migrations'}},{datasource:{url:'new'}}),{datasource:{url:'new'},migrations:{path:'prisma/migrations'}});
console.log('Installed deepmerge handles cyclic graphs without stack exhaustion and preserves ordinary Prisma configuration merges.');
