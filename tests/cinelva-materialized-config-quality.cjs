const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),file=path.join(root,'vercel.json'),original=fs.readFileSync(file);
try{
 fs.writeFileSync(file,fs.readFileSync(path.join(root,'backend/vercel.json')));
 const result=spawnSync('python',['scripts/quality_gate.py'],{cwd:root,stdio:'inherit',env:{...process.env,VERCEL:'1',VERCEL_ENV:'preview',CINELVA_VERIFIED_BACKEND_CONFIG:'1'}});
 assert.equal(result.status,0,'complete quality gate must pass with verified backend configuration materialized at root');
}finally{fs.writeFileSync(file,original);}
