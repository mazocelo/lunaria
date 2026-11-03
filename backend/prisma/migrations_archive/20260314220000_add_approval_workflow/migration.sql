-- Add approval workflow fields to roteiro_versoes
ALTER TABLE "roteiro_versoes" ADD COLUMN "status" VARCHAR(20) NOT NULL DEFAULT 'draft';
ALTER TABLE "roteiro_versoes" ADD COLUMN "reviewer_id" INTEGER;
ALTER TABLE "roteiro_versoes" ADD COLUMN "reviewed_at" TIMESTAMPTZ;
ALTER TABLE "roteiro_versoes" ADD COLUMN "review_comment" TEXT;

-- Foreign key for reviewer
ALTER TABLE "roteiro_versoes" ADD CONSTRAINT "roteiro_versoes_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Index for filtering by status
CREATE INDEX "roteiro_versoes_historia_id_status_idx" ON "roteiro_versoes"("historia_id", "status");
