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
