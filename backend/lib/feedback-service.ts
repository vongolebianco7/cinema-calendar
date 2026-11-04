import {createMetricStore} from './metrics.cjs';
import {prisma} from './prisma';
import {createHandler} from './feedback.cjs';
import {createFeedbackStore} from './feedback-store.cjs';
const store={...createFeedbackStore(prisma),metrics:async()=>{if(process.env.FEATURE_METRICS_ENABLED!=='true')return null;try{return await createMetricStore(prisma).summary();}catch{return null;}}};
export const feedbackHandler=createHandler({store,adminToken:process.env.FEEDBACK_ADMIN_TOKEN,rateSecret:process.env.FEEDBACK_RATE_SECRET,
 origins:['https://cinelva.vercel.app']});
