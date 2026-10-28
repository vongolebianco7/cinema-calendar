const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('all static routes receive protective headers without disabling existing inline handlers',()=>{
 const config=require('../scripts/source-configuration.cjs').readSourceConfiguration('vercel.json');
 const headers=Object.fromEntries((config.headers?.find(x=>x.source==='/(.*)')?.headers||[]).map(x=>[x.key.toLowerCase(),x.value]));
 assert.equal(headers['x-content-type-options'],'nosniff');
 assert.equal(headers['x-frame-options'],'DENY');
 const csp=headers['content-security-policy']||'';
 for(const value of ["frame-ancestors 'none'","base-uri 'none'","object-src 'none'","form-action 'self'","script-src 'self' 'unsafe-inline'","connect-src 'self' https://backend-one-gray-94.vercel.app"])assert.ok(csp.includes(value),value);
 assert.ok(!csp.includes('unsafe-eval'));
});
test('expensive public read endpoints all apply request guard before DB work',()=>{
 for(const route of ['health','status','tv','theater-directory','calendar','releases']){
 const src=fs.readFileSync(`backend/app/api/${route}/route.ts`,'utf8');
 assert.match(src,/rateLimited\(request/);
 assert.ok(src.indexOf('rateLimited(request')<src.indexOf('prisma.'));
 }
});
