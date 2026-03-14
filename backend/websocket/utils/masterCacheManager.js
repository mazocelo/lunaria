import { MESTRE_CONFIG } from '../../agents/Mestre/config.js';

/**
 * Gerencia o cache LRU de instâncias de Mestre IA.
 * Recebe a referência do Map mestresCache do socketManager.
 */
export default class MasterCacheManager {
  constructor(mestresCache) {
    this.mestresCache = mestresCache;
  }

  getHistoriaRoteiroAtualizadoEmMs(sessao) {
    const raw = sessao?.estadoJogo?.historiaRoteiroAtualizadoEm;
    if (!raw) return null;

    const timestamp = new Date(raw).getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  getCacheHistoriaRoteiroAtualizadoEmMs(cache) {
    if (!cache) return null;

    if (cache.historiaRoteiroAtualizadoEm) {
      const timestamp = new Date(cache.historiaRoteiroAtualizadoEm).getTime();
      if (Number.isFinite(timestamp)) {
        return timestamp;
      }
    }

    return Number.isFinite(cache.criadoEm) ? cache.criadoEm : null;
  }

  isMestreCacheStale(cache, sessao) {
    const sessionTimestamp = this.getHistoriaRoteiroAtualizadoEmMs(sessao);
    if (!sessionTimestamp) {
      return false;
    }

    const cacheTimestamp = this.getCacheHistoriaRoteiroAtualizadoEmMs(cache);
    if (!cacheTimestamp) {
      return true;
    }

    return sessionTimestamp > cacheTimestamp;
  }

  /**
   * Invalidar cache do Mestre (a cada 5 rodadas)
   */
  invalidarMestreSeNecessario(salaId, rodadaAtual) {
    if (!this.mestresCache.has(salaId)) return false;

    const cache = this.mestresCache.get(salaId);

    // Invalidar a cada 5 rodadas
    if (rodadaAtual - cache.rodadaInicial >= 5) {
      console.log(`♻️ Invalidando cache do Mestre (5 rodadas completas)`);
      this.mestresCache.delete(salaId);
      return true;
    }

    return false;
  }

  /**
   * Limpar cache de mestres antigos (> 1h sem uso)
   */
  limparCacheMestres() {
    const agora = Date.now();
    let removidos = 0;

    for (const [salaId, cache] of this.mestresCache.entries()) {
      if (agora - cache.ultimoUso > MESTRE_CONFIG.cache.ttl * 1000) {
        this.mestresCache.delete(salaId);
        removidos++;
      }
    }

    if (removidos > 0) {
      console.log(`🧹 Removidos ${removidos} mestres inativos do cache`);
    }
  }
}
