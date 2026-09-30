export const MILESTONE_STEP=100;
const REWARDS=new Map([
 [100,{key:'clown',label:'カクレクマノミ',niche:'reef',scale:.9}],
 [200,{key:'turtle',label:'ウミガメ',niche:'pelagic',scale:2.2}],
 [300,{key:'octopus',label:'大ダコ',niche:'benthic',scale:2.7}],
 [400,{key:'manta',label:'マンタ',niche:'pelagic',scale:4.2}],
 [500,{key:'dolphin',label:'イルカ',niche:'pelagic',scale:4.6}],
 [600,{key:'shark',label:'大型サメ',niche:'pelagic',scale:5.0}],
 [700,{key:'orca',label:'シャチ',niche:'pelagic',scale:6.0}],
 [800,{key:'humpback',label:'ザトウクジラ',niche:'pelagic',scale:8.0}],
 [900,{key:'whaleshark',label:'ジンベイザメ',niche:'pelagic',scale:8.8}],
 [1000,{key:'bluewhale',label:'シロナガスクジラ',niche:'pelagic',scale:10.0}]
]);
export function unlockedMilestones(watched){const n=Math.max(0,Number(watched)||0);return [...REWARDS].filter(([at])=>at<=n).map(([at,reward])=>({at,...reward}))}
export function nextMilestone(watched){const n=Math.max(0,Number(watched)||0),at=(Math.floor(n/MILESTONE_STEP)+1)*MILESTONE_STEP;return{at,remaining:at-n,label:'???'}}
export function milestonePublicState(watched){return{unlocked:unlockedMilestones(watched),next:nextMilestone(watched)}}
