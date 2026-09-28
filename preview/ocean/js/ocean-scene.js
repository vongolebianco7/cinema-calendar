(function(root){
  'use strict';
  function hash(text){let h=2166136261;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function unit(seed,salt){let x=hash(seed+'|'+salt);x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967295;}
  function buildRenderScene(ecosystem){
    ecosystem=ecosystem||{};const maturity=ecosystem.maturity||{};const source=ecosystem.creatures||[];const world={width:44,height:16,depth:34};
    const fish=[];let large=0;
    source.slice(0,30).forEach((c,i)=>{const seed=c.id||c.filmId||c.speciesId||('fish-'+i);const wantsLarge=Number(c.rating)>=5||Number(c.size)>=1.55;const isLarge=wantsLarge&&large<2;if(isLarge)large++;
      fish.push({id:String(seed),speciesId:c.speciesId||'reef',x:(unit(seed,'x')-.5)*world.width*.82,y:-1.2+unit(seed,'y')*7.8,z:(unit(seed,'z')-.5)*world.depth*.82,scale:isLarge?1.8+unit(seed,'ls')*.35:.62+unit(seed,'s')*.72,speed:.28+unit(seed,'v')*.52,hue:165+unit(seed,'h')*125,phase:unit(seed,'p')*6.283,direction:unit(seed,'d')>.5?1:-1,large:isLarge});
    });
    (ecosystem.schools||[]).slice(0,5).forEach((school,si)=>{const count=Math.min(9,Math.max(3,Number(school.count)||5));for(let j=0;j<count&&fish.length<48;j++){const seed=(school.id||'school-'+si)+'-'+j;fish.push({id:seed,speciesId:'school',x:(unit(seed,'x')-.5)*world.width*.88,y:-.2+unit(seed,'y')*6,z:(unit(seed,'z')-.5)*world.depth*.9,scale:.28+unit(seed,'s')*.24,speed:.48+unit(seed,'v')*.45,hue:178+unit(seed,'h')*70,phase:unit(seed,'p')*6.283,direction:si%2?1:-1,school:si,large:false});}}
    const richness=Math.max(.15,Number(maturity.reef)||.35);const veg=Math.max(.12,Number(maturity.vegetation)||.3);const habitatCount=Math.max(8,Math.min(28,Math.round(8+richness*12+veg*8)));const habitat=[];
    for(let i=0;i<habitatCount;i++){const seed='habitat-'+i+'-'+source.length;habitat.push({id:seed,type:i%4===0?'coral':i%3===0?'grass':'rock',x:(unit(seed,'x')-.5)*world.width*.94,y:-4.6,z:(unit(seed,'z')-.5)*world.depth*.88,scale:.55+unit(seed,'s')*1.65,hue:142+unit(seed,'h')*85,phase:unit(seed,'p')*6.283});}
    const particleCount=Math.min(72,28+Math.round((Number(maturity.light)||.5)*36));const particles=[];for(let i=0;i<particleCount;i++){const seed='particle-'+i+'-'+source.length;particles.push({x:(unit(seed,'x')-.5)*world.width,y:-3+unit(seed,'y')*12,z:(unit(seed,'z')-.5)*world.depth,phase:unit(seed,'p')*6.283,size:.018+unit(seed,'s')*.045});}
    return {world,fish,habitat,particles,light:Math.max(.35,Math.min(1,Number(maturity.light)||.62))};
  }
  root.CinemapOceanScene={buildRenderScene};
})(typeof window!=='undefined'?window:globalThis);
