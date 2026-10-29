// CLS session windows: https://web.dev/articles/cls (1s gap, at most5s).
export function layoutShiftScore(entries){
 let best=0,sum=0,first=null,last=null;
 for(const entry of entries){
  if(entry.hadRecentInput)continue;
  if(last===null||entry.startTime-last>=1000||entry.startTime-first>=5000){first=entry.startTime;sum=0;}
  sum+=entry.value;last=entry.startTime;best=Math.max(best,sum);
 }
 return best;
}
export function performanceBudgetPass({supported,cls,ready_ms,interaction_ms}){
 return supported&&Number.isFinite(cls)&&cls<=.1&&Number.isFinite(ready_ms)&&ready_ms<=5000&&Number.isFinite(interaction_ms)&&interaction_ms<=1000;
}

// Separate from the historical scorecard: these operations have different clocks
// and acceptance targets. Unknown evidence must not become a successful zero.
export function assessRequestedPerformance(measurements={}){
 const targets={initial_ms:2000,tab_ms:300,cached_ms:200,review_ms:200,search_ms:1000,scroll_fps:60};
 return Object.fromEntries(Object.entries(targets).map(([key,target])=>{
  const value=measurements[key],minimum=key==='scroll_fps';
  const valid=typeof value==='number'&&Number.isFinite(value)&&value>=0;
  const status=value===undefined||value===null?'unmeasured':!valid?'fail':(minimum?value>=target:value<=target)?'pass':'fail';
  return [key,{value:valid?value:null,target,comparison:minimum?'>=':'<=',status}];
 }));
}
