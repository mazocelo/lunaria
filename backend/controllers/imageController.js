import { generateImage, buildPrompt } from '../services/imageGenerationService.js';
import usageService from '../services/usageService.js';
import { redisClient } from '../redis/redis-config.js';

const VALID_ENTITY_TYPES = ['personagem', 'monstro', 'equipamento', 'historia', 'historia_mapa', 'mestre', 'npc', 'local', 'cena'];
const LOCK_PREFIX = 'img_lock:';
const LOCK_TTL_MS = 60000; // 60s (geração de imagem é mais lenta)

/**
 * Tenta adquirir lock distribuído para evitar geração duplicada simultânea
 */
async function acquireLock(lockKey) {
  try {
    if (!redisClient.isOpen) return true;
    const result = await redisClient.set(LOCK_PREFIX + lockKey, '1', { NX: true, PX: LOCK_TTL_MS });
    return result === 'OK';
  } catch {
    return true; // sem Redis → prossegue sem lock
  }
}

async function releaseLock(lockKey) {
  try {
    if (!redisClient.isOpen) return;
    await redisClient.del(LOCK_PREFIX + lockKey);
  } catch { /* ignore */ }
}

async function gerarImagem(req, res) {
  try {
    const { entityType, entityData, options } = req.body;

    if (!entityType || !VALID_ENTITY_TYPES.includes(entityType)) {
      return res.status(400).json({
        success: false,
        error: `entityType inválido. Use: ${VALID_ENTITY_TYPES.join(', ')}`,
      });
    }

    if (!entityData || typeof entityData !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'entityData é obrigatório e deve ser um objeto',
      });
    }

    // Lock por entidade (entityType + id) para evitar geração simultânea duplicada
    const lockKey = `${entityType}:${entityData.id || entityData.nome || 'unknown'}`;
    const gotLock = await acquireLock(lockKey);
    if (!gotLock) {
      return res.status(429).json({
        success: false,
        error: 'Imagem já está sendo gerada para esta entidade. Aguarde.',
      });
    }

    try {
      console.log(`[ImageController] entityType=${entityType} estilo=${entityData.estilo_imagem || 'DEFAULT'}`);
      console.log(`[ImageController] entityData:`, JSON.stringify(entityData, null, 2));
      const prompt = buildPrompt(entityType, entityData);
      console.log(`[ImageController] prompt final:`, prompt);
      const tImg = Date.now();
      const imageUrl = await generateImage(prompt, {
        ...(options || {}),
        estilo_imagem: entityData.estilo_imagem
      });

      if (req.user?.id) usageService.track({ userId: req.user.id, provider: 'leonardo', tipo: 'image', duracao_ms: Date.now() - tImg, metadata: { entityType } });

      return res.json({ success: true, data: { url: imageUrl, prompt } });
    } finally {
      releaseLock(lockKey);
    }
  } catch (error) {
    console.error('[ImageController] Erro ao gerar imagem:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao gerar imagem',
    });
  }
}

export { gerarImagem };
