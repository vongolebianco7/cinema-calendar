const assert=require('assert');
const path=require('path');
const {pathToFileURL}=require('url');
(async()=>{
 const mod=await import(pathToFileURL(path.join(__dirname,'..','preview/ocean/renderer/src/creature-profiles.js')).href);
 const profiles=Array.from({length:24},(_,i)=>mod.creatureProfile(i));
 const types=new Set(profiles.map(p=>p.archetype));
 assert.ok(types.size>=5,'at least five distinct silhouettes');
 const sizes=profiles.map(p=>p.scale);
 assert.ok(Math.max(...sizes)/Math.min(...sizes)>=2.2,'large visible size range');
 const bands=new Set(profiles.map(p=>p.depthBand));
 assert.ok(bands.size>=3,'creatures occupy multiple depth bands');
 assert.ok(profiles.some(p=>p.solitary),'some creatures are not schooling clones');
 console.log('Ocean creature diversity tests passed');
})().catch(e=>{console.error(e);process.exit(1)});
