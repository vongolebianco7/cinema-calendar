'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),net=require('node:net'),{spawn}=require('node:child_process');
const {waitForLocalServer}=require('./helpers/local-server.cjs');
(async()=>{
 const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
 const cwd=path.join(__dirname,'../backend');const env={...process.env,DATABASE_URL:'postgresql://fixture:fixture@127.0.0.1:1/unavailable?connect_timeout=1',NEXT_TELEMETRY_DISABLED:'1'};
 for(const name of ['TMDB_API_KEY','TMDB_READ_ACCESS_TOKEN','TMDB_API_TOKEN'])delete env[name];
 const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)],{cwd,env,stdio:['ignore','pipe','pipe']});let output='';server.stdout.on('data',d=>output+=d);server.stderr.on('data',d=>output+=d);
 try{
  await waitForLocalServer(port);
  const sample=require('../data/movies.json').movies.find(m=>m.title);assert.ok(sample);
  for(const [url,key] of [['/api/calendar','movies'],['/api/tv','movies'],['/api/movies?q='+encodeURIComponent(sample.title)+'&limit=3','movies'],['/api/theater-directory?prefecture=東京都','theaters'],['/api/releases?from=2026-10-01&to=2026-11-01&service=Lemino','releases']]){
   const r=await fetch(`http://127.0.0.1:${port}${url}`,{signal:AbortSignal.timeout(10000)});assert.equal(r.status,200,url);const d=await r.json();assert.equal(d.data_source,'static_snapshot',url);assert.equal(d.database_status,'unavailable',url);assert.ok(d[key].length,url);assert.equal(r.headers.get('access-control-allow-origin'),'*');
   if(url.startsWith('/api/calendar'))assert.equal(d.generated_at,require('../data/movies.json').generated_at);
   if(key==='releases')assert.ok(d.count>=2);
   console.log(url,200,d[key].length,'static_snapshot');
  }
  // Built handlers, isolated from production DB and TMDB credentials.
  for(const route of ['agent','boxoffice-world','calendar','critic-videos','discover','health','movie-detail','movies','people','releases','status','theater-directory','theaters','tv','watch-providers']){
   for(const method of ['PUT','PATCH','DELETE']){
    const r=await fetch(`http://127.0.0.1:${port}/api/${route}`,{method,signal:AbortSignal.timeout(10000)});
    assert.equal(r.status,405,`${method} ${route} must not expose a write handler`);
   }
  }
  const agentUrl=`http://127.0.0.1:${port}/api/agent`;
  const preflight=await fetch(agentUrl,{method:'OPTIONS',headers:{Origin:'https://cinelva.vercel.app','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'}});
  assert.equal(preflight.status,204);assert.match(preflight.headers.get('access-control-allow-methods'),/POST/);assert.equal(preflight.headers.get('access-control-allow-credentials'),null);
  for(const [body,status] of [['{',400],[JSON.stringify({message:'a',extra:'x'.repeat(9000)}),413],[JSON.stringify({message:{a:1}}),400]]){
   const r=await fetch(agentUrl,{method:'POST',headers:{'Content-Type':'application/json'},body});assert.equal(r.status,status);assert.equal(r.headers.get('cache-control'),'no-store');
  }
  console.log('45 prohibited write methods rejected; agent preflight and malformed/oversized/type validation passed.');
  const health=await fetch(`http://127.0.0.1:${port}/api/health`,{signal:AbortSignal.timeout(10000)});assert.equal(health.status,503,'health must report database outage honestly');
  console.log('Built backend serves all five read APIs with database unavailable; health remains503.');
 }catch(error){console.error(output.slice(-3000));throw error;}finally{server.kill('SIGTERM');await new Promise(r=>server.once('exit',r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
