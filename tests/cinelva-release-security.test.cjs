const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
function load(file,extras={}){
 const code=stripTypeScriptTypes(fs.readFileSync(file,'utf8'),{mode:'transform'}).replace(/^import .*?;\n/gm,'').replaceAll('export ','');
 const ctx={Request,Response,URL,setTimeout,clearTimeout,TextDecoder,TextEncoder,AbortSignal,Map,Date,process:{env:{}},console,...extras};
 vm.runInNewContext(code+';globalThis.api={'+(file.endsWith('http.ts')?'json,rateLimit,rateLimited,options,readJsonBody:typeof readJsonBody==="undefined"?undefined:readJsonBody':'POST,OPTIONS')+'}',ctx);return ctx.api;
}
function agent(){const http=load('backend/lib/http.ts');return load('backend/app/api/agent/route.ts',{...http,fetch:async()=>{throw Error('fixture upstream credential must never escape')}});}
function req(body,headers={'Content-Type':'application/json'}){return new Request('https://fixture/api/agent',{method:'POST',headers,body});}
test('static frontend rejects framing, object embeds and base URL injection',()=>{
 const headers=Object.fromEntries(require('../scripts/source-configuration.cjs').readSourceConfiguration('vercel.json').headers?.find(x=>x.source==='/(.*)')?.headers.map(x=>[x.key.toLowerCase(),x.value])||[]);
 assert.equal(headers['x-content-type-options'],'nosniff');assert.equal(headers['x-frame-options'],'DENY');
 for(const directive of ["frame-ancestors 'none'","object-src 'none'","base-uri 'self'"])assert.ok(headers['content-security-policy']?.includes(directive),directive);
});
test('agent rejects oversized declared body before reading it',async()=>{
 const r=await agent().POST(req('{}',{'Content-Type':'application/json','Content-Length':'9000'}));assert.equal(r.status,413);assert.equal(r.headers.get('cache-control'),'no-store');
});
test('agent rejects oversized streamed body without a length header',async()=>{
 const r=await agent().POST(req(JSON.stringify({message:'a',extra:'x'.repeat(9000)})));assert.equal(r.status,413);
});
test('agent requires a JSON string message and never reflects malformed input',async()=>{
 for(const body of ['{',JSON.stringify({message:{secret:'fixture'}}),JSON.stringify({message:['a']})]){const r=await agent().POST(req(body));assert.equal(r.status,400);assert.equal(r.headers.get('cache-control'),'no-store');}
});
test('bounded JSON reader counts UTF-8 bytes and accepts the exact limit',async()=>{
 const {readJsonBody}=load('backend/lib/http.ts');const body=JSON.stringify({message:'映画'}),bytes=new TextEncoder().encode(body).length;
 assert.equal((await readJsonBody(req(body),bytes)).message,'映画');
 await assert.rejects(()=>readJsonBody(req(body),bytes-1),e=>e.status===413);
});
test('agent upstream outage returns a generic no-store response',async()=>{
 const http=load('backend/lib/http.ts');const api=load('backend/app/api/agent/route.ts',{...http,process:{env:{TMDB_API_KEY:'fixture'}},fetch:async()=>{throw Error('fixture-secret')}});
 const r=await api.POST(req('{"message":"SF"}'));assert.equal(r.status,502);assert.equal(r.headers.get('cache-control'),'no-store');assert.ok(!(await r.text()).includes('fixture-secret'));
});
test('agent normal JSON searches stay bounded, credential-free and no-store',async()=>{
 const http=load('backend/lib/http.ts');let calls=0;
 const api=load('backend/app/api/agent/route.ts',{...http,process:{env:{TMDB_API_KEY:'fixture-key'}},fetch:async(url,init)=>{calls++;assert.equal(new URL(url).hostname,'api.themoviedb.org');assert.ok(init.signal);return {ok:true,json:async()=>({results:[{id:7,title:'映画',release_date:'2020-01-01',overview:'紹介',poster_path:'/fixture.jpg'}]})};}});
 const r=await api.POST(req('{"message":"SF"}'));const data=await r.json();assert.equal(r.status,200);assert.equal(calls,1);assert.equal(data.movies[0].id,7);assert.ok(!JSON.stringify(data).includes('fixture-key'));assert.equal(r.headers.get('cache-control'),'no-store');
});
test('public catalog CORS never grants browser credentials',()=>{
 const {json}=load('backend/lib/http.ts');const r=json({ok:true});assert.equal(r.headers.get('access-control-allow-origin'),'*');assert.equal(r.headers.get('access-control-allow-credentials'),null);
});
test('upstream failures are logged without raw exception objects',()=>{
 for(const name of ['movies','movie-detail'])assert.ok(!/console\.warn\([^;]*,\s*e\)/.test(fs.readFileSync(`backend/app/api/${name}/route.ts`,'utf8')));
});
test('over-limit streams return 413 without waiting for cancellation',async()=>{
 const {readJsonBody}=load('backend/lib/http.ts');
 for(const cancel of [()=>new Promise(()=>{}),()=>Promise.reject(Error('cancel rejected'))]){
  const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array(4097));},cancel});
  const request=new Request('https://fixture/api/agent',{method:'POST',body:stream,duplex:'half'});
  const outcome=await Promise.race([readJsonBody(request).then(()=>0,e=>e.status),new Promise(r=>setTimeout(()=>r('hung'),100))]);assert.equal(outcome,413);
 }
});
test('stalled body has a bounded deadline and split UTF-8 is decoded correctly',async()=>{
 const {readJsonBody}=load('backend/lib/http.ts');
 const stalled=new Request('https://fixture/api/agent',{method:'POST',body:new ReadableStream({pull(){return new Promise(()=>{})}}),duplex:'half'});
 const outcome=await Promise.race([readJsonBody(stalled,4096,10).then(()=>0,e=>e.status),new Promise(r=>setTimeout(()=>r('hung'),100))]);assert.equal(outcome,408);
 const bytes=new TextEncoder().encode('{"message":"映画"}');let i=0;const chunks=new ReadableStream({pull(c){if(i===bytes.length)c.close();else c.enqueue(bytes.slice(i,++i));}});
 assert.equal((await readJsonBody(new Request('https://fixture/api/agent',{method:'POST',body:chunks,duplex:'half'}))).message,'映画');
});

test('agent JSON POST preflight is allowed without enabling catalog writes',async()=>{
 const http=load('backend/lib/http.ts');const api=load('backend/app/api/agent/route.ts',http);
 const preflight=await api.OPTIONS(new Request('https://fixture/api/agent',{method:'OPTIONS',headers:{Origin:'https://cinelva.vercel.app','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'}}));
 assert.equal(preflight.status,204);assert.match(preflight.headers.get('access-control-allow-methods'),/POST/);assert.doesNotMatch(preflight.headers.get('access-control-allow-methods'),/DELETE|PUT/);
 assert.equal(http.options(new Request('https://fixture/api/movies')).headers.get('access-control-allow-methods'),'GET,OPTIONS');
});
