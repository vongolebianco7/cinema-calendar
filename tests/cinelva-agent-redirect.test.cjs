const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');

test('concierge legacy routes resolve to the matching discover page in both site roots',()=>{
  for(const [file,base,expected] of [
    ['agent.html','https://cinelva.example/agent.html','https://cinelva.example/discover.html?mode=concierge'],
    ['cinelva/agent.html','https://cinelva.example/cinelva/agent.html','https://cinelva.example/cinelva/discover.html?mode=concierge']
  ]){
    const html=fs.readFileSync(path.join(root,file),'utf8');
    const match=html.match(/location\.replace\(new URL\("([^"]+)",location\.href\)\.href\)/);
    assert.ok(match,file+' must resolve the redirect against the current document URL');
    assert.equal(new URL(match[1],base).href,expected,file+' must resolve inside its current deployment root');
  }
});
