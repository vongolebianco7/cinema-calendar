const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('js/cinelva-records-page.js','utf8');
const start=source.indexOf('    // Restore the selected tab after a refresh');
const restore=source.slice(start,source.indexOf('    const params=',start));
test('saved retired world and genre views restore to the active summary without rewriting records',()=>{for(const saved of ['world','genres']){const calls=[];vm.runInNewContext(restore,{sessionStorage:{getItem:()=>saved},setTab:value=>calls.push(value),TAB_STORAGE_KEY:'tab'});assert.deepEqual(calls,['summary']);}});
test('active saved tabs retain their own route',()=>{for(const saved of ['summary','records','awards','directors','watchlist']){const calls=[];vm.runInNewContext(restore,{sessionStorage:{getItem:()=>saved},setTab:value=>calls.push(value),TAB_STORAGE_KEY:'tab'});assert.deepEqual(calls,[saved]);}});
test('disabled session storage cannot break the initial dashboard',()=>{assert.doesNotThrow(()=>vm.runInNewContext(restore,{sessionStorage:{getItem(){throw Error('private');}},setTab(){throw Error('unexpected');},TAB_STORAGE_KEY:'tab'}));});
