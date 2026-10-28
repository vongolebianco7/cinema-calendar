const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const ts=require('../backend/node_modules/typescript');
const code=ts.transpileModule(fs.readFileSync('backend/lib/http.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const exportsObject={};vm.runInNewContext(code,{exports:exportsObject,Request,Response,Headers,TextDecoder,Uint8Array,URL,Date,Map,Set});
test('bounded JSON rejects chunked oversized bodies before parsing',async()=>{
 const r=new Request('https://test.invalid/api/agent',{method:'POST',body:JSON.stringify({message:'x'.repeat(9000)})});
 await assert.rejects(()=>exportsObject.readJsonBody(r,4096),e=>e.status===413);
});
test('bounded JSON accepts multibyte input and rejects malformed JSON',async()=>{
 assert.deepEqual(JSON.parse(JSON.stringify(await exportsObject.readJsonBody(new Request('https://test.invalid',{method:'POST',body:'{"message":"映画"}'}),4096))),{message:'映画'});
 await assert.rejects(()=>exportsObject.readJsonBody(new Request('https://test.invalid',{method:'POST',body:'{'}),4096),e=>e.status===400);
});
test('error responses are never publicly cached',()=>{
 const response=exportsObject.json({error:'unavailable'},{status:503});
 assert.equal(response.headers.get('cache-control'),'no-store');
});
test('rate limit rejects excess calls with uncached retry guidance',()=>{
 const req=new Request('https://test.invalid/api/isolated-limit');
 assert.equal(exportsObject.rateLimited(req,2),null);
 assert.equal(exportsObject.rateLimited(req,2),null);
 const denied=exportsObject.rateLimited(req,2);
 assert.equal(denied.status,429);assert.equal(denied.headers.get('cache-control'),'no-store');
 assert.ok(Number(denied.headers.get('retry-after'))>0);
});
test('every database-backed endpoint applies a request limit before database work',()=>{
 for(const route of ['calendar','health','status','tv','releases','theater-directory']){
  const source=fs.readFileSync(`backend/app/api/${route}/route.ts`,'utf8');
  assert.match(source,/const limited\s*=\s*rateLimited\(request/ ,route);
 }
});
