const {execFileSync}=require('node:child_process');
const path=require('node:path');
function checkProduction(env=process.env,required=false){
 if(env.VERCEL_ENV!=='production'&&!required)return;
 const root=path.resolve(__dirname,'..');
 execFileSync(process.execPath,['scripts/verify-production-release.cjs',...(required?['--require']:[])],{cwd:root,env,stdio:'inherit'});
 // Isolated artifact fixtures are preview builds, not recursive production releases.
 execFileSync('python3',['scripts/quality_gate.py'],{cwd:root,env:{...env,VERCEL_ENV:'preview'},stdio:'inherit'});
}
module.exports={checkProduction};
if(require.main===module)checkProduction(process.env,process.argv.includes('--require'));
