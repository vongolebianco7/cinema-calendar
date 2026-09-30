(function(root){'use strict';
const recurring=[
 {key:'clownfish',label:'カクレクマノミ',first:25,every:100,role:'habitat',habitat:'reef-anemone',scaleClass:'small'},
 {key:'sea-turtle',label:'ウミガメ',first:50,every:200,role:'habitat',habitat:'reef-edge',scaleClass:'medium'},
 {key:'seahorse',label:'タツノオトシゴ',first:75,every:200,role:'habitat',habitat:'reef-vegetation',scaleClass:'small'}
];
const fixed=[
 {key:'ocean-sunfish',label:'マンボウ',unlockAt:100,role:'feature',habitat:'open-mid',scaleClass:'large'},
 {key:'giant-octopus',label:'大ダコ',unlockAt:150,role:'hero',habitat:'seabed-rock',scaleClass:'hero'},
 {key:'manta-ray',label:'マンタ',unlockAt:200,role:'hero',habitat:'open-glide',scaleClass:'hero'},
 {key:'dolphin',label:'イルカ',unlockAt:300,role:'hero',habitat:'upper-mid',scaleClass:'hero'},
 {key:'hammerhead-shark',label:'ハンマーヘッドシャーク',unlockAt:400,role:'hero',habitat:'open-mid',scaleClass:'hero'},
 {key:'large-shark',label:'大型サメ',unlockAt:500,role:'hero',habitat:'open-mid',scaleClass:'hero'},
 {key:'dugong',label:'ジュゴン',unlockAt:600,role:'hero',habitat:'shallow-seagrass',scaleClass:'hero'},
 {key:'minke-whale',label:'ミンククジラ',unlockAt:700,role:'hero',habitat:'open-route',scaleClass:'giant'},
 {key:'orca',label:'シャチ',unlockAt:800,role:'hero',habitat:'open-route',scaleClass:'giant'},
 {key:'humpback-whale',label:'ザトウクジラ',unlockAt:1000,role:'hero',habitat:'open-route',scaleClass:'giant'},
 {key:'whale-shark',label:'ジンベイザメ',unlockAt:1200,role:'hero',habitat:'open-route',scaleClass:'giant'},
 {key:'blue-whale',label:'シロナガスクジラ',unlockAt:1500,role:'hero',habitat:'open-route',scaleClass:'colossal'}
];
function rewardsForCount(value){
 const count=Math.max(0,Math.floor(Number(value)||0));
 const rewards=[];
 for(const rule of recurring){
   if(count<rule.first)continue;
   const total=1+Math.floor((count-rule.first)/rule.every);
   for(let i=0;i<total;i++)rewards.push({key:rule.key,label:rule.label,unlockAt:rule.first+i*rule.every,ordinal:i+1,role:rule.role,habitat:rule.habitat,scaleClass:rule.scaleClass});
 }
 for(const rule of fixed){if(count>=rule.unlockAt)rewards.push({...rule,ordinal:1});}
 return rewards.sort((a,b)=>a.unlockAt-b.unlockAt||a.key.localeCompare(b.key));
}
function heroRewardsForCount(count){return rewardsForCount(count).filter(r=>r.role==='hero');}
root.CinemapOceanMilestoneRewards={recurring,fixed,rewardsForCount,heroRewardsForCount};
})(window);
