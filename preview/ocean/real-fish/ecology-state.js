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
    const genres=new Set(),regions=new Set(),directors=new Set();
    rows.forEach(r=>{
      (Array.isArray(r.genres)?r.genres:[]).forEach(g=>g&&genres.add(String(g)));
      if(r.region)regions.add(String(r.region));
      if(r.director)directors.add(String(r.director));
    });
    const diversityScore=genres.size+regions.size*2+Math.min(directors.size,6);
    const diversityTier=diversityScore>=16?5:diversityScore>=10?4:diversityScore>=6?3:diversityScore>=3?2:count?1:0;
    return {count,ratedCount:ratings.length,highRatings,ratingBonus,effectiveCount:count+ratingBonus,genreCount:genres.size,regionCount:regions.size,directorCount:directors.size,diversityScore,diversityTier};
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
