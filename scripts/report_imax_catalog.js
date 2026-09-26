'use strict';
const {validateCatalog,matchCatalogRecord,catalogFacts}=require('./imax-catalog.js');
const known=v=>v!==undefined&&v!==null&&v!=='unknown';

function localEvidenceFor(record,evidence){
  evidence=evidence||{};
  const rows=[];
  if(record.tmdb_id!==null&&record.tmdb_id!==undefined&&evidence.films?.[String(record.tmdb_id)])rows.push(evidence.films[String(record.tmdb_id)]);
  for(const name of [record.title,record.original_title,...(record.aliases||[])]){
    const row=evidence.title_fixtures?.[`${name}|${record.release_year}`];if(row)rows.push(row);
  }
  return Object.assign({},...rows);
}
function detectConflicts(catalog,evidence){
  const conflicts=[];
  for(const r of catalog.records||[]){
    const official=catalogFacts(r),local=localEvidenceFor(r,evidence);
    for(const field of ['official_imax_release','filmed_for_imax','imax_camera','imax_expanded_ratio','imax_70mm']){
      if(known(official[field])&&known(local[field])&&String(official[field])!==String(local[field]))conflicts.push({title:r.title,release_year:r.release_year,field,official:official[field],local:local[field]});
    }
  }
  return conflicts;
}
function generateReport(catalog,evidence,localMovies=[],now='2026-09-26'){
  const validation=validateCatalog(catalog),cutoff=new Date(now+'T00:00:00Z').getTime()-180*86400000;
  const stale=(catalog.records||[]).filter(r=>new Date(r.last_verified_at+'T00:00:00Z').getTime()<cutoff).map(r=>({title:r.title,release_year:r.release_year,last_verified_at:r.last_verified_at}));
  const unresolved=(catalog.records||[]).filter(r=>r.tmdb_id==null&&!localMovies.some(m=>matchCatalogRecord(m,{records:[r]}))).map(r=>({title:r.title,release_year:r.release_year}));
  const matched=localMovies.length?localMovies.filter(m=>matchCatalogRecord(m,catalog)).length:(catalog.records||[]).filter(r=>r.tmdb_id!=null).length;
  const conflicts=detectConflicts(catalog,evidence);
  return {generated_at:now,catalog_valid:validation.valid,records:(catalog.records||[]).length,matched_coverage:matched,unresolved_records:unresolved,stale_records:stale,duplicates:validation.errors.filter(e=>e.startsWith('duplicate ')),conflicts};
}
function preserveLastKnownGood(currentCatalog,proposedCatalog){const v=validateCatalog(proposedCatalog);return v.valid?{accepted:true,catalog:proposedCatalog,errors:[]}:{accepted:false,catalog:currentCatalog,errors:v.errors};}
if(require.main===module){const fs=require('fs');const catalog=JSON.parse(fs.readFileSync('data/imax_catalog.json','utf8'));const evidence=JSON.parse(fs.readFileSync('data/screening_format_evidence.json','utf8'));process.stdout.write(JSON.stringify(generateReport(catalog,evidence),null,2)+'\n');}
module.exports={generateReport,detectConflicts,preserveLastKnownGood};
