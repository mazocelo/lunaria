/**
 * Blueprint quota service — rate-limiting para geração de roteiros.
 * Extraído de historiaController.consumirCotaBlueprint.
 */
import gerenciadorSessoes from '../redis/sessoes.js';
import logger from '../helpers/logger.js';
const log = logger.child({ module: 'blueprintQuotaService' });

/**
 * Consome 1 unidade de cota de blueprint para o usuário.
 * @param {number|string} userId
 * @param {number} [limit=5] — máximo de requests na janela
 * @param {number} [windowSeconds=3600] — janela em segundos (default 1h)
 * @returns {Promise<{allowed: boolean, remaining: number}>}
 * @throws {Error} com statusCode 401 se sem userId, 429 se quota excedida
 */
export async function consumirCotaBlueprint(userId, limit = 5, windowSeconds = 60 * 60) {
  if (!userId) {
    throw Object.assign(new Error('Autenticacao necessaria para gerar roteiro'), { statusCode: 401 });
  }

  try {
    await gerenciadorSessoes.initialize();
    const redis = gerenciadorSessoes.client;
    if (!redis) return { allowed: true, remaining: limit };

    const key = `rate_limit:blueprint:${userId}`;
    const total = await redis.incr(key);
    if (total === 1) {
      await redis.expire(key, windowSeconds);
    }

    if (total > limit) {
      throw Object.assign(
        new Error('Limite de geracao de roteiros atingido. Tente novamente em 1 hora.'),
        { statusCode: 429 }
      );
    }

    return { allowed: true, remaining: Math.max(limit - total, 0) };
  } catch (error) {
    if (error.statusCode) throw error;
    log.warn({ err: error }, 'Falha ao validar cota de blueprint no Redis, seguindo sem bloqueio');
    return { allowed: true, remaining: limit };
  }
}
