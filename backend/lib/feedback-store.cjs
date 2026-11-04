'use strict';
function createFeedbackStore(prisma){ return {
 async submit(data,ipHash){
  return prisma.$transaction(async tx=>{
   const now=Date.now(),hour=Math.floor(now/3600000),day=Math.floor(now/86400000);
   // Atomic UPDATE predicates serialize concurrent requests, across cold starts.
   for(const [key,limit,expires] of [[`global:${day}`,100,(day+1)*86400000],[`${ipHash}:${hour}`,3,(hour+1)*3600000]]){
    const rows=await tx.$queryRaw`INSERT INTO "FeedbackRateBucket" ("key","count","expiresAt") VALUES (${key},1,${new Date(expires)}) ON CONFLICT ("key") DO UPDATE SET "count"="FeedbackRateBucket"."count"+1 WHERE "FeedbackRateBucket"."count"<${limit} RETURNING "count"`;
    if(!rows.length)throw Object.assign(new Error('rate limit'),{limited:true});
   }
   await tx.feedback.create({data});
   await tx.feedbackRateBucket.deleteMany({where:{expiresAt:{lt:new Date(now)}}});
   return true;
  }).catch(error=>{if(error.limited)return false;throw error;});
 },
 async list(status,cursor){
  return prisma.feedback.findMany({where:status?{status}:{},orderBy:[{createdAt:'desc'},{id:'desc'}],take:50,...(cursor?{cursor:{id:cursor},skip:1}:{})});
 },
 async update(id,status){return (await prisma.feedback.updateMany({where:{id},data:{status}})).count===1;}
}; }
module.exports={createFeedbackStore};
