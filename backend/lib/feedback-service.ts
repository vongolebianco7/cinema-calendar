import {prisma} from './prisma';
import {createHandler} from './feedback.cjs';
import {createFeedbackStore} from './feedback-store.cjs';
const store=createFeedbackStore(prisma);
export const feedbackHandler=createHandler({store,adminToken:process.env.FEEDBACK_ADMIN_TOKEN,rateSecret:process.env.FEEDBACK_RATE_SECRET,
 origins:['https://cinelva.vercel.app']});
