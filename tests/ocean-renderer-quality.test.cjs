const assert=require('assert');
const path=require('path');
const {pathToFileURL}=require('url');
(async()=>{
  const mod=await import(pathToFileURL(path.join(__dirname,'..','preview/ocean/renderer/src/quality.js')).href);
  const high=mod.selectQuality({width:390,dpr:3,cores:6,reducedMotion:false});
  assert.deepEqual(high,{tier:'mobile-high',dpr:2,particles:150,shafts:4,caustics:true,schoolSize:28,maxLife:82,maxHabitat:110});
  assert.deepEqual(mod.selectQuality({width:390,dpr:3,cores:2,reducedMotion:false}),{tier:'mobile-low',dpr:1.25,particles:70,shafts:2,caustics:false,schoolSize:16,maxLife:54,maxHabitat:72});
  assert.deepEqual(mod.selectQuality({width:390,dpr:2,cores:6,reducedMotion:true}),{tier:'reduced',dpr:1,particles:0,shafts:1,caustics:false,schoolSize:8,maxLife:34,maxHabitat:42});
  assert.deepEqual(mod.selectQuality({width:900,dpr:1,cores:8,reducedMotion:false}),{tier:'desktop',dpr:1,particles:240,shafts:6,caustics:true,schoolSize:44,maxLife:120,maxHabitat:160});
  const young=mod.maturityCaps(high,10),mature=mod.maturityCaps(high,100);
  assert.ok(young.life<mature.life&&young.habitat<mature.habitat&&young.particles<mature.particles);
  assert.ok(mature.life<=high.maxLife&&mature.habitat<=high.maxHabitat&&mature.schoolSize<=high.schoolSize);
  console.log('Ocean renderer quality tests passed');
})().catch(err=>{console.error(err);process.exit(1)});
