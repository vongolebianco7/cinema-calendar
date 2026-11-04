import type {PrismaClient} from '@prisma/client';
import type {FeedbackStore} from './feedback.cjs';
export function createFeedbackStore(prisma:PrismaClient):FeedbackStore;
