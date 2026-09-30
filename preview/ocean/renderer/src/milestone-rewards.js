export const MILESTONE_STEP=50;
// 75 intentionally stays empty until a quality replacement for the rejected seahorse is approved.
const REWARDS=[
 {at:25,key:'clownfish',asset:'clown',label:'カクレクマノミ',niche:'reef',scale:.55},
 {at:50,key:'seaTurtle',asset:null,label:'ウミガメ',niche:'pelagic',scale:2.2},
 {at:100,key:'sunfish',asset:null,label:'マンボウ',niche:'pelagic',scale:2.6},
 {at:150,key:'giantOctopus',asset:null,label:'大ダコ',niche:'benthic',scale:2.7},
 {at:200,key:'manta',asset:'manta',label:'マンタ',niche:'pelagic',scale:4.2},
 {at:250,key:'dolphin',asset:null,label:'イルカ',niche:'pelagic',scale:4.6},
 {at:300,key:'hammerhead',asset:'shark',label:'ハンマーヘッドシャーク',niche:'pelagic',scale:5.0},
 {at:350,key:'largeShark',asset:'shark',label:'大型サメ',niche:'pelagic',scale:5.2},
 {at:400,key:'dugong',asset:null,label:'ジュゴン',niche:'pelagic',scale:4.5},
 {at:450,key:'minkeWhale',asset:'whale',label:'ミンククジラ',niche:'pelagic',scale:7.0},
 {at:500,key:'orca',asset:null,label:'シャチ',niche:'pelagic',scale:6.0},
 {at:550,key:'manta',asset:'manta',label:'マンタ追加',niche:'pelagic',scale:4.2},
 {at:600,key:'humpbackWhale',asset:'whale',label:'ザトウクジラ',niche:'pelagic',scale:8.0},
 {at:650,key:'seaTurtle',asset:null,label:'ウミガメ追加',niche:'pelagic',scale:2.2},
 {at:700,key:'whaleShark',asset:'shark',label:'ジンベイザメ',niche:'pelagic',scale:8.8},
 {at:750,key:'sunfish',asset:null,label:'マンボウ追加',niche:'pelagic',scale:2.6},
 {at:800,key:'dolphin',asset:null,label:'イルカ小群',niche:'pelagic',scale:4.3,copies:3},
 {at:850,key:'hammerhead',asset:'shark',label:'ハンマーヘッド追加',niche:'pelagic',scale:5.0},
 {at:900,key:'minkeWhale',asset:'whale',label:'ミンククジラ追加',niche:'pelagic',scale:7.0},
 {at:950,key:'orca',asset:null,label:'シャチ追加',niche:'pelagic',scale:6.0},
 {at:1000,key:'blueWhale',asset:'whale',label:'シロナガスクジラ',niche:'pelagic',scale:10.0}
];
export function unlockedMilestones(watched){const n=Math.max(0,Number(watched)||0);return REWARDS.filter(r=>r.at<=n).flatMap(r=>Array.from({length:Math.max(1,Number(r.copies)||1)},(_,i)=>({...r,copy:i+1})))}
export function nextMilestone(watched){const n=Math.max(0,Number(watched)||0),next=REWARDS.find(r=>r.at>n);if(next)return{at:next.at,remaining:next.at-n,label:'???'};const at=Math.ceil((n+1)/MILESTONE_STEP)*MILESTONE_STEP;return{at,remaining:at-n,label:'???'}}
export function milestonePublicState(watched){return{unlocked:unlockedMilestones(watched),next:nextMilestone(watched)}}
