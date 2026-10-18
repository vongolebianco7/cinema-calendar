const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const page=fs.readFileSync('my-cinelva/index.html','utf8');
test('My Cinelva inline executable scripts are valid JavaScript',()=>{
  const scripts=[...page.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].filter(x=>!x[1].includes('application/json')&&!x[1].includes('src=')).map(x=>x[2]);
  for(const js of scripts.filter(Boolean)) assert.doesNotThrow(()=>new Function(js));
});
test('production home and My Cinelva navigation expose the real record page',()=>{
  assert.match(fs.readFileSync('index.html','utf8'),/href="my-cinelva\//);
  assert.match(fs.readFileSync('my-cinemap.html','utf8'),/href="my-cinelva\//);
});
