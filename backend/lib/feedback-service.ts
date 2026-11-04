import {prisma} from './prisma';
import {createHandler,type FeedbackData} from './feedback.cjs';
const store={
 async submit(data:FeedbackData,ipHash:string){
  return prisma.$transaction(async tx=>{
   const now=Date.now(),hour=Math.floor(now/3600000),day=Math.floor(now/86400000);
   // Atomic UPDATE predicates serialize concurrent requests, across cold starts.
   for(const [key,limit,expires] of [[`global:${day}`,100,(day+1)*86400000],[`${ipHash}:${hour}`,3,(hour+1)*3600000]] as const){
    const rows=await tx.$queryRaw<{count:number}[]>`INSERT INTO "FeedbackRateBucket" ("key","count","expiresAt") VALUES (${key},1,${new Date(expires)}) ON CONFLICT ("key") DO UPDATE SET "count"="FeedbackRateBucket"."count"+1 WHERE "FeedbackRateBucket"."count"<${limit} RETURNING "count"`;
    if(!rows.length)throw Object.assign(new Error('rate limit'),{limited:true});
   }
   await tx.feedback.create({data});
   await tx.feedbackRateBucket.deleteMany({where:{expiresAt:{lt:new Date(now)}}});
   return true;
  }).catch(error=>{if(error.limited)return false;throw error;});
 },
 async list(status?:string,cursor?:string){
  return prisma.feedback.findMany({where:status?{status}:{},orderBy:[{createdAt:'desc'},{id:'desc'}],take:50,...(cursor?{cursor:{id:cursor},skip:1}:{})});
 },
 async update(id:string,status:string){return (await prisma.feedback.updateMany({where:{id},data:{status}})).count===1;}
};
export const feedbackHandler=createHandler({store,adminToken:process.env.FEEDBACK_ADMIN_TOKEN,rateSecret:process.env.FEEDBACK_RATE_SECRET,
 origins:['https://cinelva.vercel.app']});
