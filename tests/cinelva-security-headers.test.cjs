const {test}=require('node:test'),assert=require('node:assert/strict');
test('canonical static pages prevent framing, MIME sniffing and unsafe base/form targets',()=>{
 const config=require('../vercel.json');
 const rule=config.headers?.find(x=>x.source==='/(.*)');
 assert.ok(rule,'all static routes need security headers');
 const headers=Object.fromEntries(rule.headers.map(x=>[x.key.toLowerCase(),x.value]));
 assert.equal(headers['x-content-type-options'],'nosniff');
 assert.equal(headers['x-frame-options'],'DENY');
 for(const directive of ["frame-ancestors 'none'","object-src 'none'","base-uri 'self'","form-action 'self'"])assert.ok(headers['content-security-policy'].includes(directive),directive);
});
