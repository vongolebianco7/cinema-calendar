const fs=require('node:fs'),path=require('node:path');
function observedAt(value,now){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value))return null;
 const day=value.slice(0,10),calendar=Date.parse(day+'T00:00:00Z');
 if(!Number.isFinite(calendar)||new Date(calendar).toISOString().slice(0,10)!==day)return null;
 const time=Date.parse(value);return Number.isFinite(time)&&time<=now?new Date(time).toISOString():null;
}
function buildStatus(registry,loadDataset,now=Date.now()){
 const sources=(registry.categories||[]).map(category=>{
  let data=null;try{if(category.dataset)data=loadDataset(category.dataset);}catch{/* Missing snapshots remain unknown. */}
  const date=observedAt(data?.[category.generated_at_field],now),age=date?(now-Date.parse(date))/3600000:null;
  const row={id:category.id,status:category.status,source:category.source||'未確認',source_url:/^https:\/\//.test(category.source_url||'')?category.source_url:null,source_observed_at:date,max_age_hours:Number.isFinite(category.max_age_hours)?category.max_age_hours:null,freshness:date&&Number.isFinite(category.max_age_hours)?age>category.max_age_hours?'stale':'within_window':'unknown'};
  if(category.id==='streaming-availability'&&data?.movies){
   const values=Object.values(data.movies),counts={total:values.length,fresh:0,stale:0,unknown:0};
   for(const value of values){const checked=observedAt(value?.checked_at,now);if(!checked)counts.unknown++;else if(now-Date.parse(checked)<=7*86400000)counts.fresh++;else counts.stale++;}
   row.observations=counts;
  }
  return row;
 });
 return {schema_version:1,generated_at:new Date(now).toISOString(),sources};
}
function fromRoot(root,now=Date.now()){
 const registryPath=path.join(root,'quality/external-data-registry.json');
 const registry=fs.existsSync(registryPath)?JSON.parse(fs.readFileSync(registryPath)):{categories:[]};
 return buildStatus(registry,dataset=>{
  if(!dataset.startsWith('data/')||dataset.split('/').includes('..'))throw Error('Invalid dataset path');
  return JSON.parse(fs.readFileSync(path.join(root,dataset)));
 },now);
}
if(require.main===module){const at=process.argv.indexOf('--output');if(at<0||!process.argv[at+1])throw Error('--output path required');fs.writeFileSync(process.argv[at+1],JSON.stringify(fromRoot(process.cwd()),null,2)+'\n');}
module.exports={buildStatus,fromRoot};
