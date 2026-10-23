const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {unchangedConfiguration}=require('./verify-production-release.cjs');

// Configuration assertions normally inspect the working tree. After a successful
// production proof, the backend's quality subprocess may see Vercel's exact
// committed backend config at root. Assert the frontend source in that one case.
function readSourceConfiguration(name,{root=path.resolve(__dirname,'..'),env=process.env}={}){
 if(!['vercel.json','backend/vercel.json'].includes(name))throw Error('Unsupported source configuration');
 const current=fs.readFileSync(path.join(root,name),'utf8');
 if(name!=='vercel.json'||env.VERCEL!=='1'||env.CINELVA_VERIFIED_BACKEND_CONFIG!=='1')return JSON.parse(current);
 const committed=file=>execFileSync('git',['show',`HEAD:${file}`],{cwd:root,encoding:'utf8'});
 const frontend=committed('vercel.json'),backend=committed('backend/vercel.json');
 if(!unchangedConfiguration(name,frontend,current,{vercel:true,appDirectory:'backend',backendConfiguration:backend}))throw Error('Unverified materialized configuration');
 return JSON.parse(frontend);
}
module.exports={readSourceConfiguration};
