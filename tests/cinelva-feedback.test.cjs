const {test}=require('node:test');const assert=require('node:assert/strict');
let f;try{f=require('../backend/lib/feedback.cjs');}catch{}
test('feedback module provides private request handler',()=>assert.equal(typeof f?.createHandler,'function'));
test('public support guidance points to private feedback form, not public GitHub issues',()=>{
 const credits=require('node:fs').readFileSync(require('node:path').join(__dirname,'../credits.html'),'utf8');
 assert.match(credits,/<b>Q\. 不具合や改善要望を伝えたい。<\/b>[\s\S]*?<a href="(?:https:\/\/cinelva\.vercel\.app\/)?feedback\.html"[^>]*>[^<]*ご意見・ご要望フォーム[^<]*<\/a>/);
 assert.match(credits,/個人情報、秘密情報、鑑賞履歴、バックアップ内容は記載しないでください/);
 assert.doesNotMatch(credits,/href="https:\/\/github\.com\/[^\"]+\/issues/);
});
test('reject invalid types, long/blank body, malformed email and non-object input',()=>{
 assert.ok(f);for(const v of [null,[],{}, {kind:'other',body:'abc'}, {kind:'bug',body:'  '}, {kind:'bug',body:'a'.repeat(4001)}, {kind:'bug',body:'abc',email:'bad'}])assert.throws(()=>f.validate(v));
 assert.deepEqual(f.validate({kind:'bug',body:' <img src=x>\u0000 ',email:''}),{kind:'bug',body:'<img src=x>',email:null});
});
const token='a'.repeat(40),origin='https://cinelva.vercel.app';
function setup(){const rows=[];return{rows,handle:f.createHandler({adminToken:token,rateSecret:'b'.repeat(40),origins:[origin],store:{submit:async(data,key)=>{rows.push({...data,id:'one',status:'new'});return true;},list:async()=>rows,update:async(id,status)=>{const r=rows.find(r=>r.id===id);if(!r)return false;r.status=status;return true;}}})};}
const req=(path,method='GET',body,auth)=>new Request('https://backend.test/api/'+path,{method,headers:{origin,'content-type':'application/json',...(auth?{authorization:'Bearer '+auth}:{})},...(body?{body:JSON.stringify(body)}:{})});
test('anonymous submit -> private admin list -> status update; no public or invalid token read',async()=>{
 const {handle,rows}=setup();const r=await handle(req('feedback','POST',{kind:'idea',body:'改善お願いします'}));assert.equal(r.status,201);assert.equal(rows.length,1);
 for(const auth of [undefined,'wrong'])assert.equal((await handle(req('admin/feedback','GET',null,auth))).status,401);
 const listing=await handle(req('admin/feedback','GET',null,token));assert.equal(listing.headers.get('cache-control'),'no-store');assert.equal((await listing.json()).items[0].body,'改善お願いします');
 assert.equal((await handle(req('admin/feedback','PATCH',{id:'one',status:'done'},token))).status,200);assert.equal(rows[0].status,'done');
 assert.equal((await handle(req('admin/feedback','PATCH',{id:'one',status:'evil'},token))).status,400);
});
test('bad origins, honeypot, oversized and malformed bodies do not persist',async()=>{
 const {handle,rows}=setup();assert.equal((await handle(new Request('https://backend.test/api/feedback',{method:'POST',headers:{origin:'https://evil.test','content-type':'application/json'},body:'{}'}))).status,403);
 assert.equal((await handle(req('feedback','POST',{kind:'bug',body:'abc',website:'spam'}))).status,400);
 assert.equal((await handle(req('feedback','POST',{kind:'bug',body:'a'.repeat(17000)}))).status,413);
 assert.equal(rows.length,0);
});
test('database errors fail closed and rate denial returns 429 without echoing content',async()=>{
 const opts={adminToken:token,rateSecret:token,origins:[origin],store:{submit:async()=>false}};
 assert.equal((await f.createHandler(opts)(req('feedback','POST',{kind:'bug',body:'abc'}))).status,429);
 opts.store.submit=async()=>{throw new Error('private database details');};const r=await f.createHandler(opts)(req('feedback','POST',{kind:'bug',body:'abc'}));assert.equal(r.status,503);assert.doesNotMatch(await r.text(),/private database/);
});
test('Unicode minimum length agrees with PostgreSQL character count',()=>{assert.throws(()=>f.validate({kind:'bug',body:'😀a'}));assert.equal(f.validate({kind:'bug',body:'😀ab'}).body,'😀ab');});

test('reject non-string honeypot payloads and control characters in contact emails',()=>{
 for(const website of [1,true,{},[],['spam']])assert.throws(()=>f.validate({kind:'bug',body:'valid report',website}));
 for(const email of ['a\u0000b@example.com','a\u007fb@example.com'])assert.throws(()=>f.validate({kind:'bug',body:'valid report',email}));
 assert.equal(f.validate({kind:'bug',body:'valid report',website:''}).body,'valid report');
});
