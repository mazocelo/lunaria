-- CreateIndex
CREATE INDEX "amizades_receiver_id_status_idx" ON "amizades"("receiver_id", "status");

-- CreateIndex
CREATE INDEX "feed_posts_user_id_deleted_at_criado_em_idx" ON "feed_posts"("user_id", "deleted_at", "criado_em");

-- CreateIndex
CREATE INDEX "sessoes_jogo_historia_id_status_idx" ON "sessoes_jogo"("historia_id", "status");
