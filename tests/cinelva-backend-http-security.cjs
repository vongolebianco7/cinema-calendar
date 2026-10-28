const {test}=require('node:test');
const assert=require('node:assert/strict');
const http=require('../backend/lib/http.ts');
const req=(path='/api/test',headers={})=>new Request('https://example.test'+path,{headers});
test('failures are never cached as public catalog responses',()=>{
 const r=http.json({error:'unavailable'},{status:503});
 assert.equal(r.headers.get('cache-control'),'no-store');
 assert.equal(http.json({movies:[]}).headers.get('access-control-allow-credentials'),null);
});
test('agent preflight permits its existing POST method without credentials',()=>{
 const r=http.options(req(),['POST','OPTIONS']);
 assert.equal(r.headers.get('access-control-allow-methods'),'POST,OPTIONS');
 assert.equal(r.headers.get('access-control-allow-credentials'),null);
});
test('request guard rejects oversized query before catalog work',()=>{
 assert.equal(http.rateLimited(req('/api/test?q='+'x'.repeat(4100)))?.status,414);
});
test('limiter fails closed at capacity and preserves offender counters',()=>{
 const offender=req('/api/capacity',{'x-forwarded-for':'offender'});
 for(let i=0;i<3;i++)http.rateLimit(offender,2);
 for(let i=0;i<5100;i++)http.rateLimit(req('/api/capacity',{'x-forwarded-for':'test-'+i}),2);
 assert.equal(http.rateLimit(offender,2).ok,false);
 assert.equal(http.rateLimit(req('/api/capacity',{'x-forwarded-for':'new-over-capacity'}),2).ok,false);
});
test('bounded JSON uses streamed bytes, not claimed length; rejects wrong types and invalid JSON',async()=>{
 const post=(body,headers={'content-type':'application/json'})=>new Request('https://example.test/api/agent',{method:'POST',body,headers});
 assert.deepEqual(await http.readJsonBody(post('{"message":"映画"}')),{message:'映画'});
 await assert.rejects(()=>http.readJsonBody(post('x',{'content-type':'text/plain'})),e=>e.status===415);
 await assert.rejects(()=>http.readJsonBody(post('{')),e=>e.status===400);
 await assert.rejects(()=>http.readJsonBody(post(' '.repeat(5000),{'content-type':'application/json','content-length':'2'})),e=>e.status===413);
 await assert.rejects(()=>http.readJsonBody(post(' '.repeat(5000))),e=>e.status===413);
});
