const fs=require('node:fs');
const stable=value=>JSON.stringify(Object.entries(value||{}).sort(([a],[b])=>a.localeCompare(b)));
function audit(lock,manifest){
 const errors=[],packages=[],manual_review_packages=[];
 if(lock.lockfileVersion!==3)errors.push('backend requires lockfileVersion3');
 const root=lock.packages?.[''];
 for(const kind of ['dependencies','devDependencies'])if(stable(root?.[kind])!==stable(manifest[kind]))errors.push(kind+' manifest differs from lock');
 for(const [path,row] of Object.entries(lock.packages||{})){
  if(!path)continue;
  if(!row.version)errors.push(path+': exact version missing');
  if(!/^https:\/\/registry\.npmjs\.org\//.test(row.resolved||'')||!row.integrity)errors.push(path+': registry URL/integrity missing');
  if(typeof row.license!=='string'||!row.license.trim())errors.push(path+': license metadata missing');
  const entry={path,version:row.version,license:row.license,resolved:row.resolved,integrity:row.integrity,dev:Boolean(row.dev),optional:Boolean(row.optional)};
  packages.push(entry);
  if(row.license&&!['MIT','Apache-2.0','BSD-3-Clause','BSD-2-Clause','ISC','0BSD'].includes(row.license))manual_review_packages.push(entry);
 }
 if(!packages.length)errors.push('empty dependency inventory');
 packages.sort((a,b)=>a.path.localeCompare(b.path));
 return {schema_version:1,scope:'Exact npm lock metadata, including optional platform packages. This is an inventory, not legal clearance or proof of production installed versions.',legal_clearance:false,package_count:packages.length,packages,manual_review_packages,errors};
}
if(require.main===module){
 try{
  const report=audit(JSON.parse(fs.readFileSync('backend/package-lock.json')),JSON.parse(fs.readFileSync('backend/package.json')));
  const index=process.argv.indexOf('--output');if(index>=0){const target=process.argv[index+1];if(!target)throw Error('--output needs a path');fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');}
  if(report.errors.length){console.error(report.errors.join('\n'));process.exitCode=1;}
  else console.log(`Dependency inventory passed: ${report.package_count} locked packages, ${report.manual_review_packages.length} license expressions retained for manual review; no legal clearance claimed.`);
 }catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={audit};
