// Import a rights-cleared, independently audited JP streaming catalog feed.
// Usage: node scripts/import-streaming-availability.cjs /path/to/licensed-feed.json --write
// No scraping, guessed provider matches, or calendar-to-catalog conversion.
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {validateSnapshot,serviceKeys}=require('../js/streaming-availability.js');
function validateImport(feed,now=Date.now()){
 const problems=[];
 if(!feed||feed.schema_version!==1||feed.country!=='JP')problems.push('expected schema_version=1, country=JP');
 if(!feed?.license?.provider||!feed?.license?.agreement_reference||feed?.license?.public_display_authorized!==true)
  problems.push('a verified rights agreement for public display is required');
 if(!feed?.coverage_audit?.auditor||!feed?.coverage_audit?.method||feed?.coverage_audit?.all_supported_services_verified)
  problems.push('independent full-catalog coverage audit is required');
 for(const service of serviceKeys){
  const result=validateSnapshot(feed,service,now);
  if(!result.ok)problems.push(service+': '+result.reason);
 }
 return {ok:problems.length===0,problems};
}
if(require.main===module){
 const file=process.argv[2],write=process.argv.includes('--write');
 if(!file){console.error('Usage: node scripts/import-streaming-availability.cjs <licensed-feed.json> [--write]');process.exitCode=2}
 else{
  try{
   const feed=JSON.parse(fs.readFileSync(path.resolve(file),'utf8'));
   const result=validateImport(feed);
   if(!result.ok){console.error('Import blocked:\\n'+result.problems.join('\\n'));process.exitCode=1}
   else if(write){
    const output=path.resolve(__dirname,'../data/streaming-availability.json');
    const {schema_version,country,generated_at,services}=feed;
    fs.writeFileSync(output,JSON.stringify({schema_version,country,generated_at,services},null,2)+'\\n');
    console.log('Validated licensed JP catalog written to '+output);
   }else console.log('Feed validated; run with --write after verifying license and coverage audit.');
  }catch(error){console.error(error.message);process.exitCode=1}
 }
}
module.exports={validateImport};
