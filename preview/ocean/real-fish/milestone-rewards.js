(function(root){'use strict';
const recurring=[
 {key:'clownfish',label:'カクレクマノミ',first:25,every:100,role:'habitat',habitat:'reef-anemone',scaleClass:'small'},
 {key:'sea-turtle',label:'ウミガメ',first:50,every:200,role:'habitat',habitat:'reef-edge',scaleClass:'medium'}
];
const fixed=[
 {key:'ocean-sunfish',label:'マンボウ',unlockAt:100,ordinal:1,role:'feature',habitat:'open-mid',scaleClass:'large'},
 {key:'giant-octopus',label:'大ダコ',unlockAt:150,ordinal:1,role:'hero',habitat:'seabed-rock',scaleClass:'hero'},
 {key:'manta-ray',label:'マンタ',unlockAt:200,ordinal:1,role:'hero',habitat:'open-glide',scaleClass:'hero'},
 {key:'dolphin',label:'イルカ',unlockAt:250,ordinal:1,role:'hero',habitat:'upper-mid',scaleClass:'hero'},
 {key:'hammerhead-shark',label:'ハンマーヘッドシャーク',unlockAt:300,ordinal:1,role:'hero',habitat:'open-mid',scaleClass:'hero'},
 {key:'large-shark',label:'大型サメ',unlockAt:350,ordinal:1,role:'hero',habitat:'open-mid',scaleClass:'hero'},
 {key:'dugong',label:'ジュゴン',unlockAt:400,ordinal:1,role:'hero',habitat:'shallow-seagrass',scaleClass:'hero'},
 {key:'minke-whale',label:'ミンククジラ',unlockAt:450,ordinal:1,role:'hero',habitat:'open-route',scaleClass:'giant'},
 {key:'orca',label:'シャチ',unlockAt:500,ordinal:1,role:'hero',habitat:'open-route',scaleClass:'giant'},
 {key:'manta-ray',label:'マンタ',unlockAt:550,ordinal:2,role:'hero',habitat:'open-glide',scaleClass:'hero'},
 {key:'humpback-whale',label:'ザトウクジラ',unlockAt:600,ordinal:1,role:'hero',habitat:'open-route',scaleClass:'giant'},
 {key:'whale-shark',label:'ジンベイザメ',unlockAt:700,ordinal:1,role:'hero',habitat:'open-route',scaleClass:'giant'},
 {key:'ocean-sunfish',label:'マンボウ',unlockAt:750,ordinal:2,role:'feature',habitat:'open-mid',scaleClass:'large'},
 {key:'dolphin',label:'イルカ',unlockAt:800,ordinal:2,role:'hero',habitat:'upper-mid',scaleClass:'hero',copies:3},
 {key:'hammerhead-shark',label:'ハンマーヘッドシャーク',unlockAt:850,ordinal:2,role:'hero',habitat:'open-mid',scaleClass:'hero'},
 {key:'minke-whale',label:'ミンククジラ',unlockAt:900,ordinal:2,role:'hero',habitat:'open-route',scaleClass:'giant'},
 {key:'orca',label:'シャチ',unlockAt:950,ordinal:2,role:'hero',habitat:'open-route',scaleClass:'giant'},
 {key:'blue-whale',label:'シロナガスクジラ',unlockAt:1000,ordinal:1,role:'hero',habitat:'open-route',scaleClass:'colossal'},
 {key:'manta-ray',label:'マンタ',unlockAt:1100,ordinal:3,role:'hero',habitat:'open-glide',scaleClass:'hero'},
 {key:'dugong',label:'ジュゴン',unlockAt:1150,ordinal:2,role:'hero',habitat:'shallow-seagrass',scaleClass:'hero'},
 {key:'whale-shark',label:'ジンベイザメ',unlockAt:1200,ordinal:2,role:'hero',habitat:'open-route',scaleClass:'giant'},
 {key:'minke-whale',label:'ミンククジラ',unlockAt:1300,ordinal:3,role:'hero',habitat:'open-route',scaleClass:'giant'},
 {key:'orca',label:'シャチ',unlockAt:1350,ordinal:3,role:'hero',habitat:'open-route',scaleClass:'giant'},
 {key:'humpback-whale',label:'ザトウクジラ',unlockAt:1400,ordinal:2,role:'hero',habitat:'open-route',scaleClass:'giant'},
 {key:'blue-whale',label:'シロナガスクジラ',unlockAt:1500,ordinal:2,role:'hero',habitat:'open-route',scaleClass:'colossal'}
];
function rewardsForCount(value){
 const count=Math.max(0,Math.floor(Number(value)||0));
 const rewards=[];
 for(const rule of recurring){
   if(count<rule.first)continue;
   const total=1+Math.floor((count-rule.first)/rule.every);
   for(let i=0;i<total;i++)rewards.push({key:rule.key,label:rule.label,unlockAt:rule.first+i*rule.every,ordinal:i+1,role:rule.role,habitat:rule.habitat,scaleClass:rule.scaleClass});
 }
 for(const rule of fixed){if(count>=rule.unlockAt){const copies=Math.max(1,Number(rule.copies)||1);for(let i=0;i<copies;i++)rewards.push({...rule,ordinal:(rule.ordinal||1)+i});}}
 return rewards.sort((a,b)=>a.unlockAt-b.unlockAt||a.key.localeCompare(b.key));
}
function heroRewardsForCount(count){return rewardsForCount(count).filter(r=>r.role==='hero');}
root.CinemapOceanMilestoneRewards={recurring,fixed,rewardsForCount,heroRewardsForCount};
})(window);
