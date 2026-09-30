export const MILESTONE_STEP=100;
const REWARDS=new Map([
 [100,{key:'clown',label:'カクレクマノミ',niche:'reef',scale:1.15}],
 [200,{key:'manta',label:'マンタ',niche:'pelagic',scale:1.08}],
 [300,{key:'shark',label:'サメ',niche:'pelagic',scale:1.08}],
 [400,{key:'whale',label:'ザトウクジラ',niche:'pelagic',scale:1.04}],
 [500,{key:'sword',label:'メカジキ',niche:'pelagic',scale:1.1}],
 [600,{key:'butterfly',label:'チョウチョウウオ',niche:'reef',scale:1.2}],
 [700,{key:'grouper',label:'ハタ',niche:'reef',scale:1.12}],
 [800,{key:'angler',label:'アンコウ',niche:'benthic',scale:1.2}],
 [900,{key:'manta',label:'記念マンタ',niche:'pelagic',scale:1.18}],
 [1000,{key:'whale',label:'記念クジラ',niche:'pelagic',scale:1.1}]
]);
export function unlockedMilestones(watched){const n=Math.max(0,Number(watched)||0);return [...REWARDS].filter(([at])=>at<=n).map(([at,reward])=>({at,...reward}))}
export function nextMilestone(watched){const n=Math.max(0,Number(watched)||0),at=(Math.floor(n/MILESTONE_STEP)+1)*MILESTONE_STEP;return{at,remaining:at-n,label:'???'}}
export function milestoneSlots(watched){return unlockedMilestones(watched).map(reward=>({index:reward.at-1,...reward}))}
export function milestonePublicState(watched){return{unlocked:unlockedMilestones(watched),next:nextMilestone(watched)}}
