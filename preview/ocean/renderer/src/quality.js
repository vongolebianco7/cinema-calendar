export function selectQuality(input={}){
  const width=Number(input.width)||390;
  const dpr=Math.max(1,Number(input.dpr)||1);
  const cores=Math.max(1,Number(input.cores)||4);
  if(input.reducedMotion===true)return {tier:'reduced',dpr:1,particles:0,shafts:1,caustics:false,schoolSize:8};
  if(width<=600&&cores<=3)return {tier:'mobile-low',dpr:Math.min(1.25,dpr),particles:70,shafts:2,caustics:false,schoolSize:16};
  if(width<=600)return {tier:'mobile-high',dpr:Math.min(2,dpr),particles:180,shafts:5,caustics:true,schoolSize:32};
  return {tier:'desktop',dpr:Math.min(2,dpr),particles:260,shafts:7,caustics:true,schoolSize:48};
}
