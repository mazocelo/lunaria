-- Reconciliacao do drift residual da producao (Fase 1 - saneamento de migrations).
-- Alinha a producao ao schema.prisma apos o re-baseline (0_init).
-- Idempotente: nenhuma operacao destrutiva de dados (sem DROP TABLE/COLUMN/INDEX).

-- 3 indices ausentes na producao
CREATE UNIQUE INDEX IF NOT EXISTS "mestres_id_usuario_nome_key" ON "mestres"("id_usuario", "nome");

CREATE INDEX IF NOT EXISTS "personagens_id_usuario_deleted_at_idx" ON "personagens"("id_usuario", "deleted_at");

CREATE INDEX IF NOT EXISTS "personagens_sistema_idx" ON "personagens"("sistema");

-- 4 foreign keys com ON DELETE divergente (producao: NO ACTION; schema: CASCADE).
-- Recriar a FK nao altera dados.
ALTER TABLE "api_usage" DROP CONSTRAINT IF EXISTS "api_usage_user_id_fkey";
ALTER TABLE "api_usage" ADD CONSTRAINT "api_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "historias" DROP CONSTRAINT IF EXISTS "fk_historias_id_usuario";
ALTER TABLE "historias" ADD CONSTRAINT "fk_historias_id_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "mestres" DROP CONSTRAINT IF EXISTS "fk_mestres_id_usuario";
ALTER TABLE "mestres" ADD CONSTRAINT "fk_mestres_id_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "personagens" DROP CONSTRAINT IF EXISTS "fk_personagens_id_usuario";
ALTER TABLE "personagens" ADD CONSTRAINT "fk_personagens_id_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
