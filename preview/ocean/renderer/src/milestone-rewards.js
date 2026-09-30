export const MILESTONE_STEP=100;
const REWARDS=new Map([
 [100,{key:'clown',label:'カクレクマノミ',niche:'reef',scale:.82}],
 [200,{key:'octopus',label:'タコ',niche:'benthic',scale:1.6}],
 [300,{key:'turtle',label:'ウミガメ',niche:'pelagic',scale:2.2}],
 [400,{key:'shark',label:'サメ',niche:'pelagic',scale:3.1}],
 [500,{key:'dolphin',label:'イルカ',niche:'pelagic',scale:3.0}],
 [600,{key:'manta',label:'マンタ',niche:'pelagic',scale:3.8}],
 [700,{key:'napoleon',label:'ナポレオンフィッシュ',niche:'reef',scale:2.4}],
 [800,{key:'whale',label:'ザトウクジラ',niche:'pelagic',scale:7.2}],
 [900,{key:'hammerhead',label:'シュモクザメ',niche:'pelagic',scale:3.5}],
 [1000,{key:'whaleshark',label:'ジンベイザメ',niche:'pelagic',scale:7.8}]
]);
export function unlockedMilestones(watched){const n=Math.max(0,Number(watched)||0);return [...REWARDS].filter(([at])=>at<=n).map(([at,reward])=>({at,...reward}))}
export function nextMilestone(watched){const n=Math.max(0,Number(watched)||0),at=(Math.floor(n/MILESTONE_STEP)+1)*MILESTONE_STEP;return{at,remaining:at-n,label:'???'}}
export function milestonePublicState(watched){return{unlocked:unlockedMilestones(watched),next:nextMilestone(watched)}}
