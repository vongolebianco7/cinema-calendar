const assert=require('assert');
const path=require('path');
const {pathToFileURL}=require('url');
(async()=>{
  const mod=await import(pathToFileURL(path.join(__dirname,'..','preview/ocean/renderer/src/schooling.js')).href);
  const a=mod.createSchool(8,42),b=mod.createSchool(8,42);
  assert.deepEqual(a,b,'same seed produces same school');
  assert.equal(a.length,8);
  const before=a.map(f=>({...f,p:{...f.p},v:{...f.v}}));
  mod.stepSchool(a,.016,{x:0,y:0,z:-12});
  assert.ok(a.some((f,i)=>f.p.x!==before[i].p.x||f.p.y!==before[i].p.y||f.p.z!==before[i].p.z),'fish move');
  for(const f of a){const speed=Math.hypot(f.v.x,f.v.y,f.v.z);assert.ok(speed<=2.21&&speed>=.19,'velocity remains bounded');assert.ok(f.p.y>-6.8&&f.p.y<8.5,'fish remain in water column')}
  const spread=Math.max(...a.map(f=>f.p.x))-Math.min(...a.map(f=>f.p.x));
  assert.ok(spread<22,'cohesion prevents unbounded spread');
  console.log('Ocean schooling tests passed');
})().catch(err=>{console.error(err);process.exit(1)});
