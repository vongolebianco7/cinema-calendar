const {execFileSync}=require('node:child_process');
const path=require('node:path');
function checkProduction(env=process.env,required=false){
 if(env.VERCEL_ENV!=='production'&&!required)return;
 const root=path.resolve(__dirname,'..');
 execFileSync(process.execPath,[path.join(root,'scripts/verify-production-release.cjs'),...(required?['--require']:[])],{cwd:process.cwd(),env,stdio:'inherit'});
 // Isolated artifact fixtures are preview builds, not recursive production releases.
 const qualityEnv={...env,VERCEL_ENV:'preview'};
 delete qualityEnv.CINELVA_VERIFIED_BACKEND_CONFIG;
 if(env.VERCEL==='1'&&path.relative(root,process.cwd())==='backend')qualityEnv.CINELVA_VERIFIED_BACKEND_CONFIG='1';
 execFileSync('python3',['scripts/quality_gate.py'],{cwd:root,env:qualityEnv,stdio:'inherit'});
}
module.exports={checkProduction};
if(require.main===module)checkProduction(process.env,process.argv.includes('--require'));
