(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CinemapOceanPopulationLayout=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const GOLDEN_ANGLE=2.399963229728653;
const LEGACY_CENTERS=[
  {x:18,y:18,rx:13,ry:7},{x:48,y:14,rx:15,ry:6},{x:79,y:24,rx:12,ry:8},
  {x:31,y:39,rx:14,ry:8},{x:65,y:43,rx:15,ry:9},{x:16,y:57,rx:11,ry:6},{x:82,y:57,rx:10,ry:7}
];
const DENSE_CENTERS=[
  {x:12,y:14},{x:31,y:12},{x:55,y:15},{x:80,y:13},{x:90,y:24},
  {x:20,y:30},{x:43,y:29},{x:69,y:31},{x:85,y:38},
  {x:12,y:47},{x:35,y:47},{x:59,y:44},{x:78,y:49},
  {x:23,y:60},{x:50,y:59},{x:72,y:61}
];
const LOWER_THIRD_ANCHORS=[
  {x:18,y:74,rx:4.2,ry:1.8},{x:45,y:81,rx:4.8,ry:2.0},{x:70,y:74,rx:4.4,ry:1.8},{x:87,y:81,rx:3.8,ry:1.9}
];
const SOLO_ANCHORS=[
  {x:16,y:18,rx:4,ry:3.2},{x:38,y:19,rx:4.2,ry:3.3},{x:65,y:18,rx:4.5,ry:3.5},{x:84,y:27,rx:4,ry:3.2},
  {x:25,y:44,rx:4.5,ry:3.8},{x:57,y:47,rx:4.8,ry:3.8},{x:77,y:46,rx:4.2,ry:3.8},{x:58,y:60,rx:4.5,ry:3.5}
];
const DENSE_GROUP_SIZES=[40,38,36,34,32,30,24,22,20,18,16,14,12,10,10,10,10,9,9,9,9,9,8,8,8,8,7];
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function hash01(index,salt=0){let x=((index+1)*0x9e3779b1^(salt+1)*0x85ebca6b)>>>0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return(x>>>0)/4294967296}
function halton(n,base){let f=1,r=0;while(n>0){f/=base;r+=f*(n%base);n=Math.floor(n/base)}return r}
function legacyDepthAndWidth(index){const d=hash01(index,8);const depth=d<.18?'near':d<.47?'far':'mid';const width=depth==='near'?6.7+hash01(index,9)*2.1:depth==='far'?3.0+hash01(index,9)*1.25:4.4+hash01(index,9)*1.9;return{depth,width}}
function denseDepthAndWidth(index,count=500){if(count>=1000){const d=hash01(index,81);const depth=d<.72?'far':d<.94?'mid':'near';const width=depth==='far'?2.1+hash01(index,82):depth==='mid'?3.8+hash01(index,82)*1.4:5.8+hash01(index,82)*1.6;return{depth,width}}const d=hash01(index,8);const depth=d<.08?'near':d<.25?'mid':'far';const width=depth==='near'?6.2+hash01(index,9)*1.8:depth==='mid'?4.15+hash01(index,9)*1.65:2.55+hash01(index,9)*1.25;return{depth,width}}
function legacyLayout(count){const points=[],schooling=Math.round(count*.68),perSchool=Math.max(1,Math.ceil(schooling/LEGACY_CENTERS.length));for(let i=0;i<count;i++){let x,y,school=-1;if(i<schooling){school=(i*5+Math.floor(i/11))%LEGACY_CENTERS.length;const center=LEGACY_CENTERS[school],ordinal=Math.floor(i/LEGACY_CENTERS.length);const progress=Math.sqrt((ordinal+.65)/(perSchool+.65));const angle=ordinal*GOLDEN_ANGLE+school*.77+(hash01(i,3)-.5)*.85;const radius=.28+.72*progress;x=center.x+Math.cos(angle)*center.rx*radius+(hash01(i,4)-.5)*3.2;y=center.y+Math.sin(angle)*center.ry*radius+(hash01(i,5)-.5)*2.6;}else{const n=i-schooling+1;x=4+88*halton(n*3+7,2)+(hash01(i,6)-.5)*3.8;y=8+58*halton(n*5+11,3)+(hash01(i,7)-.5)*3.0;}const sizing=legacyDepthAndWidth(i);points.push({x:clamp(x,3,93),y:clamp(y,7,69),width:sizing.width,depth:sizing.depth,school});}return points}
function groupRadius(size){if(size>=28)return{rx:7.2+size*.053,ry:4.35+size*.035};if(size>=12)return{rx:5.5+size*.053,ry:3.65+size*.035};return{rx:3.55+size*.103,ry:2.6+size*.063}}
function spreadMatureFarWater(points,count){if(count<1000)return points;const target=Math.min(points.length,Math.max(80,Math.floor(count*.10)));for(let n=0;n<target;n++){const index=(n*11+5)%points.length;points[index].x=clamp(4+90*halton(n*5+19,2)+(hash01(n,91)-.5)*1.2,3,95);points[index].y=clamp(7+76*halton(n*7+23,3)+(hash01(n,92)-.5),7,85);points[index].depth='far';points[index].width=2.1+hash01(n,93);points[index].school=-3;}return points}
function populateLowerThird(points,count){const ratio=count>=1000?.10:.08,target=Math.max(1,Math.floor(count*ratio));for(let n=0;n<target&&n<points.length;n++){const index=(n*7+3)%points.length,anchor=LOWER_THIRD_ANCHORS[n%LOWER_THIRD_ANCHORS.length],ring=Math.floor(n/LOWER_THIRD_ANCHORS.length),angle=(ring+1)*GOLDEN_ANGLE+(n%LOWER_THIRD_ANCHORS.length)*.71;const spread=.34+.035*(ring%4);points[index].x=clamp(anchor.x+Math.cos(angle)*anchor.rx*spread+(hash01(n,51)-.5)*.65,3,95);points[index].y=clamp(anchor.y+Math.sin(angle)*anchor.ry+(hash01(n,52)-.5)*.7,70,85);points[index].school=-2;}return points}
function denseLayout(count){
  const points=[];
  const solitaryTarget=Math.max(25,Math.min(50,Math.round(count*.08)));
  const schoolingTarget=count-solitaryTarget;
  const baseTotal=DENSE_GROUP_SIZES.reduce((a,b)=>a+b,0);
  let assigned=0,globalIndex=0;
  for(let school=0;school<DENSE_GROUP_SIZES.length&&assigned<schoolingTarget;school++){
    const raw=Math.round(DENSE_GROUP_SIZES[school]/baseTotal*schoolingTarget);
    const remaining=schoolingTarget-assigned;
    const size=Math.max(1,Math.min(remaining,raw));
    const center=DENSE_CENTERS[school%DENSE_CENTERS.length],radius=groupRadius(size);
    for(let ordinal=0;ordinal<size;ordinal++){
      const progress=Math.sqrt((ordinal+.8)/(size+.8));
      const angle=ordinal*GOLDEN_ANGLE+school*.91+(hash01(globalIndex,21)-.5)*.42;
      const ring=.18+.82*progress;
      let x=center.x+Math.cos(angle)*radius.rx*ring+(hash01(globalIndex,22)-.5)*.7;
      let y=center.y+Math.sin(angle)*radius.ry*ring+(hash01(globalIndex,23)-.5)*.55;
      x=clamp(x,2.5,95.5);y=clamp(y,7,68.5);
      const sizing=denseDepthAndWidth(globalIndex,count);
      points.push({x,y,width:sizing.width,depth:sizing.depth,school});
      globalIndex++;assigned++;
      if(assigned>=schoolingTarget)break;
    }
  }
  while(assigned<schoolingTarget){const school=DENSE_GROUP_SIZES.length-1,center=DENSE_CENTERS[school%DENSE_CENTERS.length],ordinal=assigned;const angle=ordinal*GOLDEN_ANGLE;const x=clamp(center.x+Math.cos(angle)*5,2.5,95.5),y=clamp(center.y+Math.sin(angle)*3.5,7,68.5),sizing=denseDepthAndWidth(globalIndex,count);points.push({x,y,width:sizing.width,depth:sizing.depth,school});globalIndex++;assigned++}
  let soloIndex=0,attempts=0;
  while(points.length<count&&attempts<5000){
    const anchor=SOLO_ANCHORS[soloIndex%SOLO_ANCHORS.length];
    const ringOrdinal=Math.floor(soloIndex/SOLO_ANCHORS.length);
    const angle=(ringOrdinal+1)*GOLDEN_ANGLE+(soloIndex%SOLO_ANCHORS.length)*.63;
    const ring=.48+.14*(ringOrdinal%4);
    const x=clamp(anchor.x+Math.cos(angle)*anchor.rx*ring+(hash01(soloIndex,31)-.5)*.8,2.5,95.5);
    const y=clamp(anchor.y+Math.sin(angle)*anchor.ry*ring+(hash01(soloIndex,32)-.5)*.7,7,68.5);
    soloIndex++;attempts++;
    let tooClose=false;
    for(let i=0;i<points.length;i++){if(Math.hypot(points[i].x-x,points[i].y-y)<.95){tooClose=true;break}}
    if(tooClose)continue;
    const sizing=denseDepthAndWidth(globalIndex,count);
    points.push({x,y,width:sizing.width,depth:sizing.depth,school:-1});
    globalIndex++;
  }
  while(points.length<count){const i=points.length,anchor=SOLO_ANCHORS[i%SOLO_ANCHORS.length],sizing=denseDepthAndWidth(globalIndex,count);points.push({x:clamp(anchor.x+(hash01(i,41)-.5)*7,2.5,95.5),y:clamp(anchor.y+(hash01(i,42)-.5)*5.5,7,68.5),width:sizing.width,depth:sizing.depth,school:-1});globalIndex++}
  spreadMatureFarWater(points,count);
  return populateLowerThird(points,count);
}
function layoutPopulation(total){const count=Math.max(0,Math.floor(Number(total)||0));if(!count)return[];return count>=300?denseLayout(count):legacyLayout(count)}
return{layoutPopulation};
});
