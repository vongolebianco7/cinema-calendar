const assert=require('assert');
const path=require('path');
const {pathToFileURL}=require('url');
(async()=>{
  const mod=await import(pathToFileURL(path.join(__dirname,'..','preview/ocean/renderer/src/quality.js')).href);
  assert.deepEqual(mod.selectQuality({width:390,dpr:3,cores:6,reducedMotion:false}),{tier:'mobile-high',dpr:2,particles:180,shafts:5,caustics:true,schoolSize:32});
  assert.deepEqual(mod.selectQuality({width:390,dpr:3,cores:2,reducedMotion:false}),{tier:'mobile-low',dpr:1.25,particles:70,shafts:2,caustics:false,schoolSize:16});
  assert.deepEqual(mod.selectQuality({width:390,dpr:2,cores:6,reducedMotion:true}),{tier:'reduced',dpr:1,particles:0,shafts:1,caustics:false,schoolSize:8});
  assert.deepEqual(mod.selectQuality({width:900,dpr:1,cores:8,reducedMotion:false}),{tier:'desktop',dpr:1,particles:260,shafts:7,caustics:true,schoolSize:48});
  console.log('Ocean renderer quality tests passed');
})().catch(err=>{console.error(err);process.exit(1)});
