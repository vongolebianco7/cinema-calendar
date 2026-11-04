'use strict';
const {createHash,createHmac,timingSafeEqual}=require('node:crypto');
const kinds=new Set(['bug','idea','comment']),statuses=new Set(['new','in_progress','done']);
const fail=status=>Object.assign(new Error('invalid request'),{status});
function validate(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw fail(400);
 if(typeof input.website==='string'&&input.website)throw fail(400);
 if(!kinds.has(input.kind)||typeof input.body!=='string'||input.body.length>4000)throw fail(400);
 const body=input.body.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'').trim();
 if(body.length<3)throw fail(400);
 if(input.email!==undefined&&typeof input.email!=='string')throw fail(400);
 const email=(input.email||'').trim();
 if(email&&(email.length>254||!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)))throw fail(400);
 return{kind:input.kind,body,email:email||null};
}
async function readBody(request){
 if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))throw fail(415);
 const length=request.headers.get('content-length');if(length&&(!/^\d+$/.test(length)||Number(length)>16384))throw fail(413);
 if(!request.body)throw fail(400);
 const reader=request.body.getReader(),decoder=new TextDecoder('utf-8',{fatal:true});let bytes=0,text='',timer;
 const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(fail(408)),8000);});
 try{while(true){const r=await Promise.race([reader.read(),timeout]);if(r.done)break;bytes+=r.value.byteLength;if(bytes>16384)throw fail(413);text+=decoder.decode(r.value,{stream:true});}return JSON.parse(text+decoder.decode());}
 catch(e){void reader.cancel().catch(()=>{});throw e.status?e:fail(400);}finally{clearTimeout(timer);reader.releaseLock();}
}
function authorized(request,token){
 if(typeof token!=='string'||token.length<32)return false;
 const value=request.headers.get('authorization')||'';
 return timingSafeEqual(createHash('sha256').update(value).digest(),createHash('sha256').update('Bearer '+token).digest());
}
function rateKey(request,secret,now=Date.now()){
 // Vercel replaces x-forwarded-for; never persist raw request headers/IP.
 const ip=request.headers.get('x-forwarded-for')?.split(',')[0].trim()||'unknown';
 return createHmac('sha256',secret).update(Math.floor(now/86400000)+':'+ip).digest('hex');
}
function createHandler({store,adminToken,rateSecret,origins=[]}){
 return async request=>{
  const origin=request.headers.get('origin'),allowed=origins.includes(origin);
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin',...(allowed?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET,POST,PATCH,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization'}:{})};
  const response=(value,status=200,extra={})=>Response.json(value,{status,headers:{...headers,...extra}});
  if(origin&&!allowed)return response({error:'アクセスが許可されていません。'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:allowed?204:403,headers});
  const admin=new URL(request.url).pathname==='/api/admin/feedback';
  if(admin&&!authorized(request,adminToken))return response({error:'管理者認証が必要です。'},401);
  try{
   if(admin&&request.method==='GET'){
    const url=new URL(request.url),status=url.searchParams.get('status')||undefined;
    if(status&&!statuses.has(status))throw fail(400);
    const cursor=url.searchParams.get('cursor')||undefined;
    if(cursor&&!/^[a-zA-Z0-9-]{1,80}$/.test(cursor))throw fail(400);
    return response({items:await store.list(status,cursor)});
   }
   if(admin&&request.method==='PATCH'){
    const input=await readBody(request);
    if(!input||typeof input.id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(input.id)||!statuses.has(input.status))throw fail(400);
    return await store.update(input.id,input.status)?response({ok:true}):response({error:'投稿が見つかりません。'},404);
   }
   if(!admin&&request.method==='POST'){
    if(!allowed)return response({error:'アクセスが許可されていません。'},403);
    const data=validate(await readBody(request));
    if(typeof rateSecret!=='string'||rateSecret.length<32)return response({error:'現在受付できません。時間をおいて再度お試しください。'},503);
    const saved=await store.submit(data,rateKey(request,rateSecret));
    return saved?response({ok:true},201):response({error:'送信回数の上限です。時間をおいてお試しください。'},429,{'Retry-After':'3600'});
   }
   return response({error:'Method not allowed'},405);
  }catch(e){const status=[400,408,413,415].includes(e.status)?e.status:503;return response({error:status===503?'現在受付できません。時間をおいて再度お試しください。':'入力内容を確認してください。'},status);}
 };
}
module.exports={validate,authorized,rateKey,createHandler};
