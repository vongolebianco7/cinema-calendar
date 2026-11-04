import {rateLimit} from '../../../lib/http';
import {prisma} from '../../../lib/prisma';
import {createMetricHandler,createMetricStore} from '../../../lib/metrics.cjs';
export const runtime='nodejs';
const handler=createMetricHandler({enabled:process.env.FEATURE_METRICS_ENABLED==='true',store:createMetricStore(prisma)});
export async function POST(request:Request){
 if(request.headers.get('origin')==='https://cinelva.vercel.app'&&!rateLimit(request,20).ok)return Response.json({error:'時間をおいてお試しください。'},{status:429,headers:{'Cache-Control':'no-store','Access-Control-Allow-Origin':'https://cinelva.vercel.app','Vary':'Origin','Retry-After':'60'}});
 return handler(request);
}
export const OPTIONS=handler;
