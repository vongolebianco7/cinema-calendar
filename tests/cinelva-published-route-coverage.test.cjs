const {readSourceConfiguration}=require('../scripts/source-configuration.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

test('every declared active route is published or redirects to its published canonical page', t => {
  const config=readSourceConfiguration('vercel.json');
  const routes=JSON.parse(fs.readFileSync('quality/route-manifest.json','utf8')).routes;
  const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'cinelva-published-routes-'));
  t.after(()=>fs.rmSync(fixture,{recursive:true,force:true}));
  for(const directory of ['assets','js','data','preview','my-cinelva','scripts']) fs.mkdirSync(path.join(fixture,directory));
  for(const name of ['build-static.cjs','cinelva-demo-build.cjs','cinelva-demo-fixture.cjs','source-status.cjs'])fs.copyFileSync('scripts/'+name,path.join(fixture,'scripts',name));
  for(const {path:route} of routes){
    const target=path.join(fixture,route);
    fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(route,target);
  }
  const result=spawnSync(config.buildCommand,{cwd:fixture,shell:true,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const output=path.join(fixture,config.outputDirectory);
  for(const {path:route} of routes){
    if(fs.existsSync(path.join(output,route))) continue;
    const rule=(config.redirects||[]).find(rule=>rule.source==='/cinelva/:path*');
    assert.ok(rule,route+' is absent from the deployment artifact and needs a canonical redirect');
    assert.equal(rule.destination,'/:path*','retain the requested page on the same origin');
    assert.equal(rule.permanent,false,'keep legacy routing reversible');
    assert.ok(route.startsWith('cinelva/'),route+' is outside the compatibility rule');
    const canonical=route.slice('cinelva/'.length);
    assert.ok(fs.existsSync(path.join(output,canonical)),route+' must reach an actual published page');
  }
});
