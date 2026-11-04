-- Additive only. Apply once after exact-source CI/release proof and Free quota check.
BEGIN;
CREATE TABLE IF NOT EXISTS "Feedback" (
 "id" TEXT PRIMARY KEY, "kind" TEXT NOT NULL CHECK ("kind" IN ('bug','idea','comment')),
 "body" TEXT NOT NULL CHECK (char_length("body") BETWEEN 3 AND 4000), "email" TEXT,
 "status" TEXT NOT NULL DEFAULT 'new' CHECK ("status" IN ('new','in_progress','done')),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Feedback_createdAt_id_idx" ON "Feedback"("createdAt","id");
CREATE INDEX IF NOT EXISTS "Feedback_status_createdAt_id_idx" ON "Feedback"("status","createdAt","id");
CREATE TABLE IF NOT EXISTS "FeedbackRateBucket" (
 "key" TEXT PRIMARY KEY, "count" INTEGER NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "FeedbackRateBucket_expiresAt_idx" ON "FeedbackRateBucket"("expiresAt");
COMMIT;
