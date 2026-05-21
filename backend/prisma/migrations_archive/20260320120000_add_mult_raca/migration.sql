-- AlterTable: add mult_raca to racas
ALTER TABLE "racas" ADD COLUMN IF NOT EXISTS "mult_raca" INTEGER DEFAULT 5;
