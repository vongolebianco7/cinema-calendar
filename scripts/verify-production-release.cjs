/* Public, read-only CI proof. No token, mutation, paid service or retry loop. */
const {createHash}=require('node:crypto');
const {isDeepStrictEqual}=require('node:util');
const {execFileSync}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path');
const REPOSITORY='vongolebianco7/cinema-calendar';
const RECEIPT='quality/production-proof.json';
const REQUIRED_WORKFLOWS=['.github/workflows/autonomous-quality-gate.yml','.github/workflows/cinelva-smoke.yml','.github/workflows/validate-frontend.yml','.github/workflows/backend-build.yml'];
const SHA=/^[a-f0-9]{40}$/;
const GENERATED_DATA=new Set(['availability','awards','director_name_readings','directors-mobile','directors','events','movies','outdoor-events','rankings','rankings_extra','rankings_year','release_history','revival_screenings','source-status','special_screenings','streaming','theater_schedules','theaters_master','theaters_osm','theatrical','tv'].map(name=>`data/${name}.json`));
function unchangedConfiguration(name,original,current){
 if(!['vercel.json','backend/vercel.json'].includes(name))return false;
 try{
  const a=JSON.parse(original),b=JSON.parse(current);
  return !!a&&!!b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)&&isDeepStrictEqual(a,b);
 }catch{return false;}
}
function relevant(name){return name!==RECEIPT&&!name.startsWith('docs/')&&!name.endsWith('.md')&&!GENERATED_DATA.has(name)&&!/^data\/rankings\/[^/]+\.json$/.test(name);}
function sourceDigest(entries){
 if(!Array.isArray(entries))throw Error('Invalid source tree');
 if(entries.some(e=>relevant(e.path)&&e.type!=='blob'&&e.type!=='tree'))throw Error('Unsupported executable source entry');
 const rows=entries.filter(e=>e.type==='blob'&&relevant(e.path));
 if(!rows.length||rows.some(e=>typeof e.path!=='string'||!SHA.test(e.sha)||!/^100644$|^100755$|^120000$/.test(e.mode)))throw Error('Invalid executable source tree');
 return createHash('sha256').update(rows.map(e=>`${e.path}\0${e.mode}\0${e.sha}\n`).sort().join('')).digest('hex');
}
async function verifyProof({receipt,currentEntries,dirtyPaths=[],readJson}){
 if(receipt?.schema_version!==1||!SHA.test(receipt.head_sha))throw Error('Missing or invalid production CI receipt');
 const changed=dirtyPaths.filter(relevant);
 if(changed.length)throw Error(`Modified tracked source cannot be published: ${JSON.stringify(changed)}`);
 const head=receipt.head_sha;
 const commit=await readJson(`/commits/${head}`),treeSha=commit?.commit?.tree?.sha;
 if(commit?.sha!==head||!SHA.test(treeSha))throw Error('CI proof commit is invalid');
 const tree=await readJson(`/git/trees/${treeSha}?recursive=1`);
 if(tree?.sha!==treeSha||tree.truncated!==false||!Array.isArray(tree.tree))throw Error('CI proof tree is incomplete or unbound');
 const digest=sourceDigest(currentEntries);
 if(digest!==sourceDigest(tree.tree))throw Error('Executable source does not match CI-verified source');
 const result=await readJson(`/actions/runs?head_sha=${head}&event=pull_request&per_page=100`);
 if(!Array.isArray(result?.workflow_runs))throw Error('CI workflows are unavailable');
 for(const workflow of REQUIRED_WORKFLOWS){
  const runs=result.workflow_runs.filter(r=>r.path===workflow&&r.head_sha===head&&r.event==='pull_request');
  if(runs.some(r=>!Number.isFinite(Date.parse(r.updated_at))))throw Error(`Required workflow has invalid verification time: ${workflow}`);
  runs.sort((a,b)=>Date.parse(b.updated_at)-Date.parse(a.updated_at)||(Date.parse(b.run_started_at)||0)-(Date.parse(a.run_started_at)||0)||(b.run_attempt||1)-(a.run_attempt||1)||b.id-a.id);
  if(!runs.length||runs[0].status!=='completed'||runs[0].conclusion!=='success')throw Error(`Required workflow has not succeeded: ${workflow}`);
 }
 return {head_sha:head,source_digest:digest,workflows:REQUIRED_WORKFLOWS};
}
async function readJson(route){
 const response=await fetch(`https://api.github.com/repos/${REPOSITORY}${route}`,{headers:{Accept:'application/vnd.github+json','User-Agent':'Cinelva-production-proof','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(15000),redirect:'error'});
 if(!response.ok)throw Error(`Public CI proof HTTP${response.status}; production remains blocked`);
 return response.json();
}
async function main(argv=process.argv.slice(2),env=process.env){
 if(env.VERCEL_ENV!=='production'&&!argv.includes('--require')){console.log('Production CI proof: local/CI compilation; production verification is required at publication.');return;}
 const root=execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8'}).trim();
 const git=(args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'});
 const currentEntries=git(['ls-tree','-rz','--full-tree','HEAD']).split('\0').filter(Boolean).map(line=>{const [metadata,...name]=line.split('\t');const [mode,type,sha]=metadata.split(' ');return {path:name.join('\t'),mode,type,sha};});
 const dirtyPaths=[...git(['diff','--name-only','-z','HEAD']).split('\0'),...git(['ls-files','--others','--exclude-standard','-z']).split('\0')].filter(Boolean);
 const protectedDirtyPaths=dirtyPaths.filter(name=>{
  if(!['vercel.json','backend/vercel.json'].includes(name))return true;
  try{
   const file=path.join(root,name);
   if(!fs.lstatSync(file).isFile())return true;
   const original=git(['show',`HEAD:${name}`]),current=fs.readFileSync(file,'utf8');
   if(unchangedConfiguration(name,original,current))return false;
   const a=JSON.parse(original),b=JSON.parse(current);
   const keys=[...new Set([...Object.keys(a||{}),...Object.keys(b||{})])].filter(key=>!isDeepStrictEqual(a?.[key],b?.[key]));
   console.error('Production configuration changed keys:',JSON.stringify({path:name,keys}));
  }catch{/* Missing, unreadable or invalid configuration remains protected. */}
  return true;
 });
 const receipt=JSON.parse(fs.readFileSync(path.join(root,RECEIPT),'utf8'));
 const proof=await verifyProof({receipt,currentEntries,dirtyPaths:protectedDirtyPaths,readJson});
 console.log(`Production CI proof passed: ${proof.head_sha}, source ${proof.source_digest}; all${proof.workflows.length} required workflows succeeded.`);
}
module.exports={unchangedConfiguration,relevant,sourceDigest,verifyProof,REQUIRED_WORKFLOWS,GENERATED_DATA,main};
if(require.main===module)main().catch(error=>{console.error('Production publication refused:',error.message);process.exitCode=1;});
