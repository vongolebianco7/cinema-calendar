const assert=require("node:assert");const O=require("../js/ocean-ecosystem.js");
const horror=Array.from({length:12},(_,i)=>({id:"h"+i,title:"Horror "+i,genres:["Horror"],rating:3.5+(i%4)*.5,year:2000+i}));
const species=new Set(horror.map(O.speciesFor).map(x=>x.id));assert(species.size>=3,"horror must not collapse to one species");
const a=O.speciesFor({id:"42",title:"Same",genres:["Drama"]}).id,b=O.speciesFor({id:"42",title:"Same",genres:["Drama"]}).id;assert.equal(a,b,"mapping must be stable");
const eco=O.build(Array.from({length:100},(_,i)=>({id:String(i),title:"Movie "+i,genres:[i%3?"Drama":"Adventure"],rating:4})));assert(eco.environment.coral>0&&eco.environment.seaweed>0&&eco.environment.ambientSchools>0);assert.equal(eco.environment.richness,1);
const v=O.variant({id:"best",rating:5});assert.equal(v.finish,"iridescent");console.log("ocean ecosystem tests passed");