'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const html=fs.readFileSync('theaters.html','utf8');
const source=html.match(/async function boot\(\)\{[^\n]+/)[0];
for(const format of ['IMAX',''])test(`late schedule completion preserves active directory renderer: ${format||'all'}`,async()=>{
 let release,ready;
 const loaded=new Promise(resolve=>{ready=resolve});
 const calls=[];
 const context=vm.createContext({selectedFormat:format,formatData:{},backend:async()=>'',fetch:async()=>({ok:true,json:async()=>({screens:[]})}),loadDirectory:async()=>{},loadSchedules:async()=>{ready();await new Promise(resolve=>{release=resolve})},renderDirectory:()=>calls.push('comparison'),renderFormatDirectory:()=>calls.push('legacy')});
 vm.runInContext(source,context);
 const pending=context.boot();await loaded;
 // User selects filters while a real asynchronous load is pending.
 assert.deepEqual(calls,[]);release();await pending;
 assert.deepEqual(calls,['comparison'],'boot completion must use the active renderer, which owns equipment and prefecture state');
});
