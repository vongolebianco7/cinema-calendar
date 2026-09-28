/* Pure, deterministic scene model for the personal Ocean. No DOM, network or runtime AI. */
(function(root){
'use strict';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function hash32(value){let h=2166136261;for(const c of String(value)){h^=c.codePointAt(0);h=Math.imul(h,16777619);}h^=h>>>16;h=Math.imul(h,0x85ebca6b);h^=h>>>13;h=Math.imul(h,0xc2b2ae35);h^=h>>>16;return h>>>0;}
function unit(key){return hash32(key)/4294967295;}
function oceanModel(){if(root.CinemapOceanModel)return root.CinemapOceanModel;if(typeof module!=='undefined'&&module.exports)return require('./ocean-model.js');throw new Error('CinemapOceanModel is required before CinemapOceanEcosystem');}
function watchedFilms(catalog,records){const byId=new Map((catalog||[]).map(f=>[String(f.id),f]));return Object.values(records||{}).filter(r=>r?.watched).map(r=>({film:byId.get(String(r.id))||r,record:r}));}
function validRating(value){const rating=Number(value);return Number.isFinite(rating)&&rating>=.1&&rating<=5?rating:null;}
function ratingProminence(rating){const r=validRating(rating);if(r===5)return 1.38;if(r>=4.5)return 1.22;if(r>=4)return 1.1;if(r!==null&&r<3)return .9;return 1;}
function ratingGrowth(rating){const r=validRating(rating);if(r===null)return 0;if(r===5)return 1.35;if(r>=4.5)return 1.05;if(r>=4)return .82;if(r>=3.5)return .58;if(r>=3)return .42;return .28;}
const benthic=new Set(['octopus','cuttlefish','blueoctopus','lobster','nudibranch','horseshoe','mantisshrimp','isopod','urchin','seastar']);
const reefLife=new Set(['seahorse','seadragon','clownfish','moray','puffer','angelfish','lionfish','nautilus']);
const drifters=new Set(['jelly','combjelly']);
const megafauna=new Set(['whale','whaleshark','manta','mantaray','hammerhead','tigershark','dolphin','beluga','seal','turtle','eagleray','stingray','sunfish']);
const sizeByFamily={whale:4.8,whaleshark:4.25,manta:3.5,mantaray:3.65,hammerhead:3.05,tigershark:3,dolphin:2.35,beluga:2.45,seal:1.75,turtle:1.9,eagleray:2.45,stingray:2.2,sunfish:2.55,swordfish:2.05,sailfish:2.15,barracuda:1.15,grouper:1.45,moray:1.35,octopus:1.25,cuttlefish:1.05,nautilus:.82,lobster:.8,horseshoe:.72,isopod:.78,mantisshrimp:.62,blueoctopus:.55,lionfish:.82,seadragon:.56,puffer:.62,angelfish:.58,jelly:.86,combjelly:.54,nudibranch:.42,urchin:.4,seastar:.46,seahorse:.38,clownfish:.52,silver:.72,reef:.64,deep:.78,gold:.6,veil:.66};
const milestones=[{at:0,label:'静かな海'},{at:1,label:'最初の生命'},{at:5,label:'小さな群れ'},{at:12,label:'育ち始めたリーフ'},{at:30,label:'豊かな生態系'},{at:60,label:'成熟した海'},{at:100,label:'あなたの大海原'}];
function milestoneFor(watched){let stage=0;for(let i=1;i<milestones.length;i++){if(watched>=milestones[i].at)stage=i;else break;}const next=milestones[stage+1];return{stage,label:milestones[stage].label,nextAt:next?next.at:null,nextLabel:next?next.label:null,remaining:next?Math.max(0,next.at-watched):0};}
function familyOf(sp){return String(sp?.id||'').replace(/-\d+$/,'');}
function nicheFor(sp){const family=familyOf(sp);if(benthic.has(family))return'benthic';if(reefLife.has(family))return'reef';if(drifters.has(family))return'drifter';return'pelagic';}
function yFor(niche,key,family){const u=unit('y:'+key);if(niche==='benthic')return 76+u*13;if(niche==='reef')return 60+u*22;if(niche==='drifter')return 18+u*44;if(megafauna.has(family))return 18+u*34;return 18+u*48;}
function motionFor(niche,family){if(niche==='benthic')return'grounded';if(niche==='drifter')return'drift';if(megafauna.has(family))return'cruise';if(niche==='reef')return'hover';return'swim';}
function priority(a,b){return Number(b.hero)-Number(a.hero)||a.order-b.order;}
function compose(all){
  const ordered=[...all].sort(priority),chosen=[],ids=new Set();
  const take=(predicate,limit)=>{for(const o of ordered){if(chosen.length>=22||limit<=0)break;const id=String(o.film.id);if(!ids.has(id)&&predicate(o)){chosen.push(o);ids.add(id);limit--;}}};
  take(o=>o.visualScale>=2.2,2);take(o=>o.niche==='benthic',5);take(o=>o.niche==='drifter',3);take(o=>o.visualScale<1&&o.niche!=='benthic'&&o.niche!=='drifter',8);take(o=>o.visualScale>=1&&o.visualScale<2.2,4);take(o=>o.visualScale<2.2,22-chosen.length);
  if(all.length<=22)for(const o of ordered){const id=String(o.film.id);if(!ids.has(id)){chosen.push(o);ids.add(id);}}
  const groups={mega:0,benthic:0,drifter:0,reef:0,pelagic:0};
  for(const o of chosen){const group=o.visualScale>=2.2?'mega':o.niche,slot=groups[group]++;if(group==='mega'){o.x=slot%2?68:32;o.y=22+slot*24;}else if(group==='benthic'){o.x=13+((slot*19+unit('lane:'+o.film.id)*7)%74);o.y=79+(slot%2)*8;}else if(group==='drifter'){o.x=18+((slot*31)%65);o.y=22+(slot%3)*16;}else if(group==='reef'){o.x=12+((slot*23)%76);o.y=61+(slot%3)*9;}else{o.x=12+((slot*29)%76);o.y=24+(slot%4)*12;}}
  return chosen.sort((a,b)=>a.z-b.z);
}
function build(catalog,records){
  const model=oceanModel(),seen=watchedFilms(catalog,records),species=seen.map(({film})=>model.speciesFor(film));
  const families=new Set(species.map(familyOf)),types=new Set(species.map(s=>s.id));
  const ratings=seen.map(({record})=>validRating(record.rating)).filter(v=>v!==null),rated=ratings.length;
  const loved=ratings.filter(v=>v>=4).length,exceptional=ratings.filter(v=>v===5).length,n=seen.length,diversity=n?types.size/n:0,ratingEnergy=ratings.reduce((sum,r)=>sum+ratingGrowth(r),0);
  const growthPoints=n+ratingEnergy+families.size*1.6+types.size*.3,growthSignal=n+ratingEnergy,maturity=clamp(growthPoints/130);
  const habitat={reef:clamp(growthSignal/105),vegetation:clamp(growthSignal/92),schools:Math.min(7,Math.floor(growthSignal/11)),distantLife:clamp((growthSignal-6)/84),light:clamp(.18+growthSignal/155),richness:maturity};
  const all=seen.map(({film,record},i)=>{const sp=species[i],family=familyOf(sp),niche=nicheFor(sp),motion=motionFor(niche,family),key=String(film.id??film.title??i),z=.12+unit('depth:'+key)*.88,individuality=.84+unit('scale:'+key)*.32,prominence=ratingProminence(record.rating),visualScale=(sizeByFamily[family]||.8)*individuality*prominence;return{film,species:sp,family,niche,motion,atlas:sp.atlas||0,index:sp.index||0,x:10+unit('x:'+key)*80,y:yFor(niche,key,family),z,depthBand:z<.38?'far':z<.72?'mid':'near',scale:individuality*prominence,visualScale,speed:motion==='cruise'?18+unit('speed:'+key)*14:motion==='drift'?13+unit('speed:'+key)*10:9+unit('speed:'+key)*10,drift:motion==='grounded'?3+unit('drift:'+key)*5:motion==='hover'?5+unit('drift:'+key)*9:motion==='cruise'?34+unit('drift:'+key)*46:16+unit('drift:'+key)*28,direction:unit('direction:'+key)>.5?1:-1,hero:validRating(record.rating)===5,rating:validRating(record.rating),order:hash32('population:'+key)};});
  return{maturity,habitat,milestone:milestoneFor(n),organisms:compose(all),stats:{watched:n,rated,types:types.size,families:families.size,loved,exceptional,diversity,ratingEnergy}};
}
const api={build,ratingProminence,ratingGrowth,nicheFor,milestoneFor};root.CinemapOceanEcosystem=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
