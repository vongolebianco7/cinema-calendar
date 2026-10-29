(function(root){
  'use strict';
  const normalize=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/\s+/g,'');
  function knownClosed(row,now=Date.now()){
    if(row.closed===true||row.is_closed===true)return true;
    if(['closed','disused','abandoned','demolished','閉館','閉業'].includes(normalize(row.status)))return true;
    return ['dissolved_at','dissolution_date','closing_date'].some(key=>{
      const value=Date.parse(row[key]||'');return Number.isFinite(value)&&value<=now;
    });
  }
  function directory(rows,now=Date.now()){
    const identities=new Set(),locations=new Set(),output=[];
    for(const row of rows||[]){
      if(!row||typeof row!=='object'||!normalize(row.name)||knownClosed(row,now))continue;
      const source=normalize(row.source),id=row.source_id??row.osm_id;
      const identity=id!=null&&String(id).trim()&&source?JSON.stringify([source,row.osm_type||'',String(id)]):'';
      const name=normalize(row.name),address=normalize(row.address);
      const lat=row.latitude??row.lat,lon=row.longitude??row.lon;
      const coordinates=lat!=null&&lat!==''&&lon!=null&&lon!==''&&Number.isFinite(Number(lat))&&Number.isFinite(Number(lon))&&Math.abs(Number(lat))<=90&&Math.abs(Number(lon))<=180;
      const location=address?JSON.stringify([name,'address',address]):coordinates?JSON.stringify([name,'coordinates',Number(lat),Number(lon)]):'';
      const duplicate=identity&&identities.has(identity)||location&&locations.has(location);
      if(identity)identities.add(identity);if(location)locations.add(location);
      if(!duplicate)output.push(row);
    }
    return output;
  }
  function mergeOfficialDirectory(official,existing,now=Date.now()){
    const key=row=>normalize(row?.name).replace(/[・･.\-（）()]/g,'')+'|'+normalize(row?.prefecture);
    const prior=(existing||[]).filter(row=>row&&typeof row==='object');
    const consumed=new Set(),output=[];
    for(const row of official||[]){
      if(!row||typeof row!=='object')continue;
      const matches=normalize(row.prefecture)?prior.filter(item=>key(item)===key(row)):[];
      matches.forEach(item=>consumed.add(item));
      if(matches.length===1){
        // A sparse official branch list enriches identity, never erases trusted
        // location/links or revives a separately recorded closure.
        const nonempty=Object.fromEntries(Object.entries(row).filter(([,value])=>value!==''&&value!==null&&value!==undefined));
        if(!knownClosed(matches[0],now))output.push({...matches[0],...nonempty});
      }else if(matches.length>1){
        // Name+prefecture is insufficient to choose between distinct locations.
        output.push(...matches);
      }else output.push(row);
    }
    return directory([...output,...prior.filter(item=>!consumed.has(item))],now);
  }
  const api={knownClosed,directory,mergeOfficialDirectory};root.CinelvaTheaterQuality=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis==='object'?globalThis:this);
