/* Pure, deterministic scene model for the personal Ocean. No DOM, network or runtime AI. */
(function(root){
'use strict';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function hash32(value){
  let h=2166136261;
  for(const c of String(value)){h^=c.codePointAt(0);h=Math.imul(h,16777619);}
  h^=h>>>16;h=Math.imul(h,0x85ebca6b);h^=h>>>13;h=Math.imul(h,0xc2b2ae35);h^=h>>>16;
  return h>>>0;
}
function unit(key){return hash32(key)/4294967295;}
function oceanModel(){
  if(root.CinemapOceanModel)return root.CinemapOceanModel;
  if(typeof module!=='undefined'&&module.exports)return require('./ocean-model.js');
  throw new Error('CinemapOceanModel is required before CinemapOceanEcosystem');
}
function watchedFilms(catalog,records){
  const byId=new Map((catalog||[]).map(f=>[String(f.id),f]));
  return Object.values(records||{}).filter(r=>r?.watched).map(r=>{
    const film=byId.get(String(r.id))||r;
    return {film,record:r};
  });
}
function ratingProminence(rating){
  const r=Number(rating);
  if(r===5)return 1.38;
  if(r>=4.5)return 1.22;
  if(r>=4)return 1.1;
  if(r>0&&r<3)return .9;
  return 1;
}
const benthic=new Set(['octopus','cuttlefish','blueoctopus','lobster','nudibranch','horseshoe','mantisshrimp','isopod','urchin','seastar']);
const reefLife=new Set(['seahorse','seadragon','clownfish','moray','puffer','angelfish','lionfish','nautilus']);
const drifters=new Set(['jelly','combjelly']);
const megafauna=new Set(['whale','whaleshark','manta','mantaray','hammerhead','tigershark','dolphin','beluga','seal','turtle','eagleray','stingray','sunfish']);
const sizeByFamily={
  whale:4.8,whaleshark:4.25,manta:3.5,mantaray:3.65,hammerhead:3.05,tigershark:3.0,
  dolphin:2.35,beluga:2.45,seal:1.75,turtle:1.9,eagleray:2.45,stingray:2.2,sunfish:2.55,
  swordfish:2.05,sailfish:2.15,barracuda:1.15,grouper:1.45,moray:1.35,octopus:1.25,cuttlefish:1.05,
  nautilus:.82,lobster:.8,horseshoe:.72,isopod:.78,mantisshrimp:.62,blueoctopus:.55,lionfish:.82,
  seadragon:.56,puffer:.62,angelfish:.58,jelly:.86,combjelly:.54,nudibranch:.42,urchin:.4,seastar:.46,
  seahorse:.38,clownfish:.52,silver:.72,reef:.64,deep:.78,gold:.6,veil:.66
};
function familyOf(sp){return String(sp?.id||'').replace(/-\d+$/,'');}
function nicheFor(sp){const family=familyOf(sp);if(benthic.has(family))return'benthic';if(reefLife.has(family))return'reef';if(drifters.has(family))return'drifter';return'pelagic';}
function yFor(niche,key,family){const u=unit('y:'+key);if(niche==='benthic')return 75+u*15;if(niche==='reef')return 58+u*25;if(niche==='drifter')return 18+u*46;if(megafauna.has(family))return 20+u*38;return 16+u*52;}
function motionFor(niche,family){if(niche==='benthic')return'grounded';if(niche==='drifter')return'drift';if(megafauna.has(family))return'cruise';if(niche==='reef')return'hover';return'swim';}
function build(catalog,records){
  const model=oceanModel();
  const seen=watchedFilms(catalog,records);
  const species=seen.map(({film})=>model.speciesFor(film));
  const families=new Set(species.map(familyOf));
  const types=new Set(species.map(s=>s.id));
  const ratings=seen.map(({record})=>Number(record.rating)).filter(Number.isFinite);
  const loved=ratings.filter(v=>v>=4).length;
  const exceptional=ratings.filter(v=>v===5).length;
  const n=seen.length;
  const diversity=n?types.size/n:0;
  const maturity=clamp((n+families.size*1.6+types.size*.3+loved*.25+exceptional*1.2)/120);
  const habitat={
    reef:clamp(n/100),
    vegetation:clamp(n/85),
    schools:Math.min(7,Math.floor(n/11)),
    distantLife:clamp((n-6)/80),
    light:clamp(.18+n/150),
    richness:maturity
  };
  const all=seen.map(({film,record},i)=>{
    const sp=species[i],family=familyOf(sp),niche=nicheFor(sp),motion=motionFor(niche,family);
    const key=String(film.id??film.title??i);
    const z=.12+unit('depth:'+key)*.88;
    const individuality=.84+unit('scale:'+key)*.32;
    const prominence=ratingProminence(record.rating);
    const visualScale=(sizeByFamily[family]||.8)*individuality*prominence;
    const scale=individuality*prominence;
    const schoolable=['silver','reef','gold','veil','clownfish','angelfish','barracuda'].includes(family);
    return {
      film,species:sp,family,niche,motion,atlas:sp.atlas||0,index:sp.index||0,
      x:10+unit('x:'+key)*80,
      y:yFor(niche,key,family),
      z,
      depthBand:z<.38?'far':z<.72?'mid':'near',
      scale,visualScale,
      speed:motion==='cruise'?18+unit('speed:'+key)*14:motion==='drift'?13+unit('speed:'+key)*10:9+unit('speed:'+key)*10,
      drift:motion==='grounded'?3+unit('drift:'+key)*5:motion==='hover'?5+unit('drift:'+key)*9:motion==='cruise'?34+unit('drift:'+key)*46:16+unit('drift:'+key)*28,
      direction:unit('direction:'+key)>.5?1:-1,
      schoolable,
      hero:Number(record.rating)===5,
      rating:Number.isFinite(Number(record.rating))?Number(record.rating):null,
      order:hash32('population:'+key)
    };
  });
  // A mature ecosystem is composed, not tiled: keep rare favourites and a stable
  // cross-section of life while abundance moves into schools/habitat layers.
  const heroes=all.filter(o=>o.hero).sort((a,b)=>a.order-b.order).slice(0,8);
  const heroIds=new Set(heroes.map(o=>String(o.film.id)));
  const rest=all.filter(o=>!heroIds.has(String(o.film.id))).sort((a,b)=>a.order-b.order);
  const organisms=[...heroes,...rest.slice(0,Math.max(0,40-heroes.length))].sort((a,b)=>a.z-b.z);
  return {maturity,habitat,organisms,stats:{watched:n,types:types.size,families:families.size,loved,exceptional,diversity}};
}
const api={build,ratingProminence,nicheFor};
root.CinemapOceanEcosystem=api;
if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
