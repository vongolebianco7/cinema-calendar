'use strict';

const UNKNOWN=new Set([undefined,null,'unknown']);
const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const movieYear=m=>Number(m.release_year||m.year||String(m.release_date||m.date||'').slice(0,4))||null;

function identityKeys(record){
  const keys=[];
  if(record.tmdb_id!==null&&record.tmdb_id!==undefined)keys.push(`tmdb:${record.tmdb_id}`);
  if(record.release_year){
    for(const name of [record.original_title,record.title,...(record.aliases||[])]){
      if(norm(name))keys.push(`title:${norm(name)}|${record.release_year}`);
    }
  }
  return keys;
}

function validateCatalog(catalog){
  const errors=[];
  if(!catalog||!Array.isArray(catalog.records)||catalog.records.length===0)return {valid:false,errors:['records must be a non-empty array']};
  const seenTmdb=new Set(),seenPrimary=new Set();
  catalog.records.forEach((r,i)=>{
    const p=`records[${i}]`;
    if(!r.title)errors.push(`${p}.title is required`);
    if(!Number.isInteger(r.release_year))errors.push(`${p}.release_year is required`);
    if(!Array.isArray(r.aliases))errors.push(`${p}.aliases must be an array`);
    if(!Array.isArray(r.evidence)||r.evidence.length===0)errors.push(`${p}.evidence is required`);
    else r.evidence.forEach((e,j)=>{
      if(!/^https:\/\//.test(e.url||''))errors.push(`${p}.evidence[${j}].url must be https`);
      if(!e.source_type||!e.claim||!/^\d{4}-\d{2}-\d{2}$/.test(e.checked_at||''))errors.push(`${p}.evidence[${j}] provenance is incomplete`);
    });
    if(r.confidence!=='official-confirmed')errors.push(`${p}.confidence must be official-confirmed`);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(r.last_verified_at||''))errors.push(`${p}.last_verified_at is required`);
    if(r.tmdb_id!==null&&r.tmdb_id!==undefined){
      const k=String(r.tmdb_id); if(seenTmdb.has(k))errors.push(`duplicate TMDb identity ${k}`); seenTmdb.add(k);
    }
    const primary=`${norm(r.original_title||r.title)}|${r.release_year}`;
    if(seenPrimary.has(primary))errors.push(`duplicate title/year identity ${primary}`); seenPrimary.add(primary);
    for(const field of ['official_imax_release','filmed_for_imax','imax_camera','imax_70mm','imax_specific_sound']){
      if(r[field]===undefined)errors.push(`${p}.${field} must be explicit (unknown allowed)`);
    }
    if(!Array.isArray(r.expanded_ratio)||r.expanded_ratio.length===0)errors.push(`${p}.expanded_ratio must be a non-empty array`);
  });
  return {valid:errors.length===0,errors};
}

function matchCatalogRecord(movie,catalog){
  if(!movie||!catalog||!Array.isArray(catalog.records))return null;
  const id=movie.tmdb_id??movie.tmdbId??movie.id;
  if(id!==undefined&&id!==null){
    const hit=catalog.records.find(r=>r.tmdb_id!==null&&r.tmdb_id!==undefined&&String(r.tmdb_id)===String(id));
    if(hit)return hit;
  }
  const year=movieYear(movie); if(!year)return null;
  const original=norm(movie.original_title);
  if(original){
    const hit=catalog.records.find(r=>r.release_year===year&&norm(r.original_title||r.title)===original);
    if(hit)return hit;
  }
  const candidates=[movie.title,...(movie.aliases||[])].map(norm).filter(Boolean);
  for(const r of catalog.records){
    if(r.release_year!==year)continue;
    const names=[r.title,r.original_title,...(r.aliases||[])].map(norm);
    if(candidates.some(n=>names.includes(n)))return r;
  }
  return null;
}

function catalogFacts(record){
  if(!record)return {};
  const ratio=(record.expanded_ratio||[]).filter(v=>!UNKNOWN.has(v));
  return {
    official_imax_release:record.official_imax_release,
    filmed_for_imax:record.filmed_for_imax,
    imax_camera:record.imax_camera,
    imax_expanded_ratio:ratio.length?(ratio.includes('1.43:1')?'1.43':ratio.includes('1.90:1')?'1.90':ratio[0]):'unknown',
    imax_70mm:record.imax_70mm,
    sources:(record.evidence||[]).map(e=>({label:`IMAX — ${record.title}`,url:e.url,formats:['imax'],source_type:e.source_type,checked_at:e.checked_at}))
  };
}

module.exports={validateCatalog,matchCatalogRecord,catalogFacts,identityKeys,norm};
