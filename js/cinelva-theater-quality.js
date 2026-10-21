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
  const api={knownClosed,directory};root.CinelvaTheaterQuality=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis==='object'?globalThis:this);
