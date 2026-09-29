(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.CinemapOceanEcologyState=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function validRecordCount(records){
    if(!records||typeof records!=='object'||Array.isArray(records))return 0;
    return Object.values(records).filter(v=>v&&typeof v==='object'&&!Array.isArray(v)).length;
  }
  function maturityStateForRecords(records,states,fallbackState){
    const count=validRecordCount(records);
    if(count===0)return Number(fallbackState);
    const milestones=Object.keys(states||{}).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
    let reached=milestones.length?milestones[0]:0;
    for(const milestone of milestones){if(milestone<=count)reached=milestone;else break;}
    return reached;
  }
  return {validRecordCount,maturityStateForRecords};
});
