'use strict';
const {readBody}=require('./feedback.cjs');
function createMetricHandler({enabled,store}){
 return async request=>{
  const allowed=request.headers.get('origin')==='https://cinelva.vercel.app';
  const headers={'Cache-Control':'no-store','Vary':'Origin',...(allowed?{'Access-Control-Allow-Origin':'https://cinelva.vercel.app','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'}:{})};
  const response=status=>status===204?new Response(null,{status,headers}):Response.json({error:'現在集計できません。'},{status,headers});
  if(!allowed)return response(403);
  if(request.method==='OPTIONS')return response(204);
  if(request.method!=='POST')return response(405);
  if(!enabled)return response(503);
  let value;try{value=await readBody(request);}catch{return response(400);}
  if(!value||Object.keys(value).length!==1||!['search','record_saved','bookmark'].includes(value.event))return response(400);
  try{await store.increment(value.event);return response(204);}catch{return response(503);}
 };
}
function createMetricStore(prisma){return{
 async increment(event){await prisma.$executeRaw`INSERT INTO "FeatureMetric" ("day","event","count") VALUES (CURRENT_DATE,${event},1) ON CONFLICT ("day","event") DO UPDATE SET "count"="FeatureMetric"."count"+1 WHERE "FeatureMetric"."count"<10000`;},
 async summary(){return prisma.$queryRaw`SELECT "day","event","count" FROM "FeatureMetric" WHERE "day">=CURRENT_DATE-29 ORDER BY "day" DESC,"event"`;}
};}
module.exports={createMetricHandler,createMetricStore};
