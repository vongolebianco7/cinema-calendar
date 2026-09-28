const ARCHETYPES=['reef','disc','slender','shark','ray','jelly','turtle','needle'];
const SCALE_BANDS=['tiny','small','medium','large'];
const DEPTH_BANDS=['near','mid','far'];
const GROUPING={reef:'school',disc:'school',slender:'school',needle:'school',shark:'solitary',ray:'loose',jelly:'drift',turtle:'solitary'};
const RARITY={reef:'common',disc:'common',slender:'common',needle:'common',jelly:'uncommon',ray:'rare',turtle:'rare',shark:'rare'};
function seeded(index,salt=0){const x=Math.sin((index+1)*12.9898+salt*78.233)*43758.5453;return x-Math.floor(x)}
export function ecosystemMaturity(recordCount=0){const count=Math.max(0,Number(recordCount)||0);let stage='empty';if(count>=100)stage='mature';else if(count>=30)stage='growing';else if(count>=10)stage='young';else if(count>0)stage='awakening';return {count,stage,richness:Math.min(1,count/100),habitat:Math.min(1,count/80),life:Math.min(1,count/70),depth:Math.min(1,count/50)};}
export function creatureProfile(index){
 const i=Math.max(0,Number(index)||0),silhouette=ARCHETYPES[i%ARCHETYPES.length];
 const scaleBand=SCALE_BANDS[(i*3+Math.floor(i/4))%SCALE_BANDS.length];
 const depthBand=DEPTH_BANDS[(i*5+Math.floor(i/3))%DEPTH_BANDS.length];
 const scale={tiny:.38,small:.62,medium:1.02,large:1.72}[scaleBand]*(.9+seeded(i,1)*.22);
 const speed={tiny:1.18,small:1,medium:.72,large:.42}[scaleBand]*(.9+seeded(i,2)*.2);
 const turnRadius={tiny:2.4,small:3.8,medium:6.4,large:10.8}[scaleBand]*(.9+seeded(i,3)*.25);
 return {archetype:silhouette,silhouette,scaleBand,depthBand,scale,speed,turnRadius,grouping:GROUPING[silhouette],rarity:RARITY[silhouette],solitary:GROUPING[silhouette]==='solitary',phase:seeded(i,4)*Math.PI*2,hue:(i*.137+seeded(i,5)*.04)%1};
}
