-- AlterTable: tts_cache
-- Make audio_data nullable (was NOT NULL before R2 support)
-- Add audio_url column for Cloudflare R2 URL storage
ALTER TABLE "tts_cache" ALTER COLUMN "audio_data" DROP NOT NULL;
ALTER TABLE "tts_cache" ADD COLUMN IF NOT EXISTS "audio_url" TEXT;
