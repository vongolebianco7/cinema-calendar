const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {shouldIncludeDemo,createDemoPage}=require('../scripts/cinelva-demo-build.cjs');

test('demo output is included only in explicitly non-production previews',()=>{
  assert.equal(shouldIncludeDemo({VERCEL_ENV:'preview'}),true);
  assert.equal(shouldIncludeDemo({CF_PAGES_BRANCH:'feature/demo'}),true);
  assert.equal(shouldIncludeDemo({GITHUB_EVENT_NAME:'pull_request'}),true);
  for(const env of [{VERCEL_ENV:'production',CF_PAGES_BRANCH:'main'},{VERCEL_ENV:'production',CF_PAGES_BRANCH:'preview',GITHUB_EVENT_NAME:'pull_request'},{CF_PAGES_BRANCH:'main'},{}, {VERCEL_ENV:'development'}]) assert.equal(shouldIncludeDemo(env),false);
});

test('static production branch omits the demo while preview output contains it',()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'cinelva-demo-build-'));
  try{
    for(const [name,branch,expected] of [['main','main',false],['preview','feature/demo',true]]){
      const output=path.join(temp,name);
      const result=spawnSync(process.execPath,['scripts/build-static.cjs'],{encoding:'utf8',env:{PATH:process.env.PATH,CINELVA_STATIC_OUTPUT:output,CF_PAGES_BRANCH:branch,CF_PAGES_PRODUCTION_BRANCH:'main',VERCEL_ENV:''}});
      assert.equal(result.status,0,result.stderr||result.stdout);
      assert.equal(fs.existsSync(path.join(output,'my-cinelva-demo','index.html')),expected,`${branch} output demo inclusion`);
    }
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
});

test('demo page is generated from current My Cinelva UI and contains a visible demo marker',()=>{
  const source=fs.readFileSync('my-cinelva/index.html','utf8');
  const html=createDemoPage(source,[{id:42,tmdbId:42,title:'Sample',watched:true,watchedAt:'2026-01-01',rating:4,genres:['Drama'],countries:['Japan']}]);
  assert.match(html,/id="summaryView"/);
  assert.match(html,/id="recordsView"/);
  assert.match(html,/DEMO \/ サンプルデータ/);
  assert.match(html,/cinelva-library-records-v2/);
  assert.match(html,/noindex,nofollow/);
  assert.match(html,/Object\.defineProperty\(window,'localStorage'/);
  assert.match(html,/demo_api_disabled/);
});

