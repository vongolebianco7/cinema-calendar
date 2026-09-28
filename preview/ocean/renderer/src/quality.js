export function selectQuality(input={}){
  const width=Number(input.width)||390,dpr=Math.max(1,Number(input.dpr)||1),cores=Math.max(1,Number(input.cores)||4);
  if(input.reducedMotion===true)return {tier:'reduced',dpr:1,particles:0,shafts:1,caustics:false,schoolSize:8,maxLife:34,maxHabitat:42};
  if(width<=600&&cores<=3)return {tier:'mobile-low',dpr:Math.min(1.25,dpr),particles:70,shafts:2,caustics:false,schoolSize:16,maxLife:54,maxHabitat:72};
  if(width<=600)return {tier:'mobile-high',dpr:Math.min(2,dpr),particles:150,shafts:4,caustics:true,schoolSize:28,maxLife:82,maxHabitat:110};
  return {tier:'desktop',dpr:Math.min(2,dpr),particles:240,shafts:6,caustics:true,schoolSize:44,maxLife:120,maxHabitat:160};
}
export function maturityCaps(quality,recordCount=0){const q=quality||selectQuality(),n=Math.max(0,Number(recordCount)||0),r=Math.min(1,n/100);return {life:n?Math.max(4,Math.round(q.maxLife*(.12+.88*r))):0,habitat:n?Math.max(8,Math.round(q.maxHabitat*(.18+.82*r))):0,schoolSize:n?Math.max(4,Math.round(q.schoolSize*(.3+.7*r))):0,particles:Math.round(q.particles*(.35+.65*r))};}
