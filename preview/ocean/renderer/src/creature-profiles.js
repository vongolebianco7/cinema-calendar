const ARCHETYPES=['reef','disc','slender','shark','ray','jelly'];
const SCALES=[.52,.68,.82,1.05,1.28,1.55];
export function creatureProfile(index){
 const i=Math.max(0,Number(index)||0),archetype=ARCHETYPES[i%ARCHETYPES.length];
 const depthBand=['near','mid','far'][Math.floor(i/2)%3];
 const scale=SCALES[(i*5+Math.floor(i/6))%SCALES.length];
 return {archetype,depthBand,scale,solitary:archetype==='shark'||archetype==='ray'||archetype==='jelly',hue:(i*.137)%1};
}
