CREATE TABLE "ai_jobs" (
  "id" TEXT NOT NULL,
  "queue" VARCHAR(50) NOT NULL,
  "entity_type" VARCHAR(50) NOT NULL,
  "entity_id" VARCHAR(100) NOT NULL,
  "owner_user_id" INTEGER,
  "status" VARCHAR(20) NOT NULL,
  "bullmq_job_id" VARCHAR(191),
  "request_payload" JSONB,
  "attempts_total" INTEGER NOT NULL DEFAULT 2,
  "attempts_made" INTEGER NOT NULL DEFAULT 0,
  "last_error" TEXT,
  "queued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "started_at" TIMESTAMPTZ(6),
  "finished_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ai_jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_jobs_bullmq_job_id_key" ON "ai_jobs"("bullmq_job_id");
CREATE INDEX "ai_jobs_queue_status_idx" ON "ai_jobs"("queue", "status");
CREATE INDEX "ai_jobs_entity_type_entity_id_created_at_idx" ON "ai_jobs"("entity_type", "entity_id", "created_at");
CREATE INDEX "ai_jobs_owner_user_id_created_at_idx" ON "ai_jobs"("owner_user_id", "created_at");
