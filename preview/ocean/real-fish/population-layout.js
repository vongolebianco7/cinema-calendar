(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CinemapOceanPopulationLayout=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const CENTERS=[
  {x:18,y:18,rx:13,ry:7},{x:48,y:14,rx:15,ry:6},{x:79,y:24,rx:12,ry:8},
  {x:31,y:39,rx:14,ry:8},{x:65,y:43,rx:15,ry:9},{x:16,y:57,rx:11,ry:6},{x:82,y:57,rx:10,ry:7}
];
const GOLDEN_ANGLE=2.399963229728653;
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function hash01(index,salt=0){let x=((index+1)*0x9e3779b1^(salt+1)*0x85ebca6b)>>>0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return(x>>>0)/4294967296}
function halton(n,base){let f=1,r=0;while(n>0){f/=base;r+=f*(n%base);n=Math.floor(n/base)}return r}
function layoutPopulation(total){const count=Math.max(0,Math.floor(Number(total)||0)),points=[];if(!count)return points;const schooling=Math.round(count*.68);const perSchool=Math.max(1,Math.ceil(schooling/CENTERS.length));
 for(let i=0;i<count;i++){
  let x,y,school=-1;
  if(i<schooling){school=(i*5+Math.floor(i/11))%CENTERS.length;const center=CENTERS[school],ordinal=Math.floor(i/CENTERS.length);const progress=Math.sqrt((ordinal+.65)/(perSchool+.65));const angle=ordinal*GOLDEN_ANGLE+school*.77+(hash01(i,3)-.5)*.85;const radius=.28+.72*progress;x=center.x+Math.cos(angle)*center.rx*radius+(hash01(i,4)-.5)*3.2;y=center.y+Math.sin(angle)*center.ry*radius+(hash01(i,5)-.5)*2.6;
  }else{const n=i-schooling+1;x=4+88*halton(n*3+7,2)+(hash01(i,6)-.5)*3.8;y=8+58*halton(n*5+11,3)+(hash01(i,7)-.5)*3.0;}
  x=clamp(x,3,93);y=clamp(y,7,69);
  const d=hash01(i,8),depth=d<.18?'near':d<.47?'far':'mid';const width=depth==='near'?6.7+hash01(i,9)*2.1:depth==='far'?3.0+hash01(i,9)*1.25:4.4+hash01(i,9)*1.9;
  points.push({x,y,width,depth,school});
 }
 return points;
}
return{layoutPopulation};
});
