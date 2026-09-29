(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.CinemapOceanEcologyState=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function validRecords(records){
    if(!records||typeof records!=='object'||Array.isArray(records))return [];
    return Object.values(records).filter(v=>v&&typeof v==='object'&&!Array.isArray(v));
  }
  function validRecordCount(records){return validRecords(records).length;}
  function ecologySignalsForRecords(records){
    const rows=validRecords(records),count=rows.length;
    const ratings=rows.map(r=>Number(r.rating)).filter(r=>Number.isFinite(r)&&r>0);
    const highRatings=ratings.filter(r=>r>=4).length;
    const ratingBonus=Math.min(5,Math.floor(highRatings/5));
    return {count,ratedCount:ratings.length,highRatings,ratingBonus,effectiveCount:count+ratingBonus};
  }
  function maturityStateForRecords(records,states,fallbackState){
    const signals=ecologySignalsForRecords(records);
    if(signals.count===0)return Number(fallbackState);
    const milestones=Object.keys(states||{}).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
    let reached=milestones.length?milestones[0]:0;
    for(const milestone of milestones){if(milestone<=signals.effectiveCount)reached=milestone;else break;}
    return reached;
  }
  return {validRecordCount,ecologySignalsForRecords,maturityStateForRecords};
});
