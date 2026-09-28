(function(root){
  'use strict';
  function hash(text){let h=2166136261;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function unit(seed,salt){let x=hash(seed+'|'+salt);x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967295;}
  function buildRenderScene(ecosystem){
    ecosystem=ecosystem||{};const habitatModel=ecosystem.habitat||ecosystem.maturity||{};const source=ecosystem.organisms||ecosystem.creatures||[];const world={width:44,height:16,depth:34};const fish=[];let large=0;
    source.slice(0,30).forEach((c,i)=>{const film=c.film||{},seed=film.id||c.id||c.filmId||c.speciesId||('fish-'+i),baseScale=Number(c.visualScale||c.size||c.scale)||1,wantsLarge=Number(c.rating)>=5||baseScale>=2.2,isLarge=wantsLarge&&large<2;if(isLarge)large++;fish.push({id:String(seed),title:film.title||c.title||'',speciesId:c.species?.id||c.speciesId||'reef',x:(unit(seed,'x')-.5)*world.width*.82,y:-.8+unit(seed,'y')*7.2,z:(unit(seed,'z')-.5)*world.depth*.82,scale:isLarge?2.15+unit(seed,'ls')*.45:.78+unit(seed,'s')*.82,speed:.28+unit(seed,'v')*.52,hue:165+unit(seed,'h')*125,phase:unit(seed,'p')*6.283,direction:c.direction||(unit(seed,'d')>.5?1:-1),large:isLarge});});
    const schoolCount=Math.min(5,Number(habitatModel.schools)||((ecosystem.schools||[]).length));for(let si=0;si<schoolCount;si++){const count=5+si%4;for(let j=0;j<count&&fish.length<48;j++){const seed='school-'+si+'-'+j+'-'+source.length;fish.push({id:seed,title:'',speciesId:'school',x:(unit(seed,'x')-.5)*world.width*.88,y:-.2+unit(seed,'y')*6,z:(unit(seed,'z')-.5)*world.depth*.9,scale:.36+unit(seed,'s')*.32,speed:.48+unit(seed,'v')*.45,hue:178+unit(seed,'h')*70,phase:unit(seed,'p')*6.283,direction:si%2?1:-1,school:si,large:false});}}
    const richness=Math.max(.15,Number(habitatModel.reef??habitatModel.richness)||.35),veg=Math.max(.12,Number(habitatModel.vegetation)||.3),habitatCount=Math.max(14,Math.min(36,Math.round(14+richness*14+veg*10))),habitat=[];
    for(let i=0;i<habitatCount;i++){const seed='habitat-'+i+'-'+source.length;habitat.push({id:seed,type:i%3===0?'coral':i%4===0?'grass':'rock',x:(unit(seed,'x')-.5)*world.width*.94,y:-4.6,z:(unit(seed,'z')-.5)*world.depth*.88,scale:.62+unit(seed,'s')*1.9,hue:142+unit(seed,'h')*105,phase:unit(seed,'p')*6.283});}
    const light=Math.max(.4,Math.min(1,Number(habitatModel.light)||.68)),particleCount=Math.min(82,36+Math.round(light*40)),particles=[];for(let i=0;i<particleCount;i++){const seed='particle-'+i+'-'+source.length;particles.push({x:(unit(seed,'x')-.5)*world.width,y:-3+unit(seed,'y')*12,z:(unit(seed,'z')-.5)*world.depth,phase:unit(seed,'p')*6.283,size:.018+unit(seed,'s')*.045});}
    return {world,fish,habitat,particles,light};
  }
  root.CinemapOceanScene={buildRenderScene};
})(typeof window!=='undefined'?window:globalThis);
