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
  if(r===5)return 1.55;
  if(r>=4.5)return 1.32;
  if(r>=4)return 1.16;
  if(r>0&&r<3)return .9;
  return 1;
}
const benthic=new Set(['octopus','cuttlefish','blueoctopus','lobster','nudibranch','horseshoe','mantisshrimp','isopod','urchin','seastar']);
const reefLife=new Set(['seahorse','seadragon','clownfish','moray','puffer','angelfish','lionfish','nautilus']);
const drifters=new Set(['jelly','combjelly']);
function nicheFor(sp){const family=String(sp?.id||'').replace(/-\d+$/,'');if(benthic.has(family))return'benthic';if(reefLife.has(family))return'reef';if(drifters.has(family))return'drifter';return'pelagic';}
function yFor(niche,key){const u=unit('y:'+key);if(niche==='benthic')return 72+u*18;if(niche==='reef')return 56+u*26;if(niche==='drifter')return 18+u*50;return 12+u*58;}
function build(catalog,records){
  const model=oceanModel();
  const seen=watchedFilms(catalog,records);
  const species=seen.map(({film})=>model.speciesFor(film));
  const families=new Set(species.map(s=>s.id.split('-')[0]));
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
    schools:Math.min(6,Math.floor(n/12)),
    distantLife:clamp((n-6)/80),
    light:clamp(.18+n/150),
    richness:maturity
  };
  const all=seen.map(({film,record},i)=>{
    const sp=species[i],niche=nicheFor(sp);
    const key=String(film.id??film.title??i);
    const z=.16+unit('depth:'+key)*.84;
    const base=.56+unit('scale:'+key)*.72;
    const prominence=ratingProminence(record.rating);
    const scale=base*prominence;
    return {
      film, species:sp, niche, atlas:sp.atlas||0, index:sp.index||0,
      x:4+unit('x:'+key)*92,
      y:yFor(niche,key),
      z,
      depthBand:z<.43?'far':z<.73?'mid':'near',
      scale,
      speed:10+unit('speed:'+key)*13,
      drift:niche==='benthic'?8+unit('drift:'+key)*12:18+unit('drift:'+key)*34,
      direction:unit('direction:'+key)>.5?1:-1,
      hero:Number(record.rating)===5,
      rating:Number.isFinite(Number(record.rating))?Number(record.rating):null,
      order:hash32('population:'+key)
    };
  });
  // Keep all 5.0 discoveries visible, then fill a stable sample. Density is
  // expressed by habitat/schools rather than hundreds of DOM nodes on iPhone.
  const organisms=all.sort((a,b)=>Number(b.hero)-Number(a.hero)||a.order-b.order).slice(0,64).sort((a,b)=>a.z-b.z);
  return {
    maturity,
    habitat,
    organisms,
    stats:{watched:n,types:types.size,families:families.size,loved,exceptional,diversity}
  };
}
const api={build,ratingProminence,nicheFor};
root.CinemapOceanEcosystem=api;
if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
