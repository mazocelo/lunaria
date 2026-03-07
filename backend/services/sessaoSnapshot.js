import db from '../Model/index.js';
import gerenciadorSessoes from '../redis/sessoes.js';

/**
 * Servico de snapshot: sincroniza sessoes entre Redis (fonte primaria) e PostgreSQL (backup duravel)
 */
class SessaoSnapshotService {
  /**
   * Salvar snapshot da sessao Redis no PostgreSQL
   * @param {string} salaId - ID da sala (ex: "historia_123")
   * @param {Object} sessaoRedis - Objeto completo da sessao Redis
   */
  async salvarSnapshot(salaId, sessaoRedis) {
    if (!sessaoRedis || !sessaoRedis.historiaId) {
      console.warn(`⚠️ Snapshot ignorado: sessao invalida para sala ${salaId}`);
      return null;
    }

    const snapshotData = {
      historia_id: parseInt(sessaoRedis.historiaId),
      estado: sessaoRedis.estadoJogo || {},
      mensagens: sessaoRedis.mensagens || [],
      resumos: sessaoRedis.resumos || [],
      jogadores: sessaoRedis.jogadores || {},
      status: sessaoRedis.status === 'finalizada' ? 'finalizada' : 'ativa',
      rodada_atual: sessaoRedis.estadoJogo?.rodadaAtual || 0,
      fase: sessaoRedis.estadoJogo?.fase || null,
      iniciada_em: sessaoRedis.iniciadaEm ? new Date(sessaoRedis.iniciadaEm) : null
    };

    const result = await db.SessaoJogo.upsertSnapshot(salaId, snapshotData);
    console.log(`💾 Snapshot salvo para sala ${salaId} (rodada ${snapshotData.rodada_atual})`);
    return result;
  }

  /**
   * Restaurar sessao do PostgreSQL para Redis
   * @param {string} salaId - ID da sala
   * @returns {Object|null} Sessao restaurada ou null se nao encontrada
   */
  async restaurarSessao(salaId) {
    const snapshot = await db.SessaoJogo.findBySalaId(salaId);
    if (!snapshot || snapshot.status === 'finalizada') {
      return null;
    }

    // Reconstruir objeto de sessao Redis a partir do snapshot
    const sessaoReconstruida = {
      id: salaId,
      historiaId: snapshot.historia_id,
      status: 'ativa',
      estadoJogo: snapshot.estado || {},
      mensagens: snapshot.mensagens || [],
      resumos: snapshot.resumos || [],
      jogadores: snapshot.jogadores || {},
      iniciadaEm: snapshot.iniciada_em?.toISOString() || new Date().toISOString(),
      atualizadaEm: new Date().toISOString()
    };

    // Precisamos reconstruir campos que vem do DB (historia, personagens, mestre)
    // Esses serao recarregados pelo fluxo normal de /jogo/start
    // Aqui salvamos apenas o estado do jogo que seria perdido

    // Salvar no Redis
    await gerenciadorSessoes.criarSessao(salaId, sessaoReconstruida);
    console.log(`♻️ Sessao restaurada do PostgreSQL para Redis: ${salaId}`);
    return sessaoReconstruida;
  }

  /**
   * Sincronizar: ler Redis e salvar no PostgreSQL
   * @param {string} salaId - ID da sala
   */
  async sincronizar(salaId) {
    const sessaoRedis = await gerenciadorSessoes.obterSessao(salaId);
    if (!sessaoRedis) {
      console.warn(`⚠️ Sincronizacao: sessao ${salaId} nao encontrada no Redis`);
      return null;
    }
    return await this.salvarSnapshot(salaId, sessaoRedis);
  }

  /**
   * Verificar se existe snapshot salvo para uma sala
   * @param {string} salaId - ID da sala
   * @returns {Object|null} Snapshot ou null
   */
  async obterSnapshot(salaId) {
    return await db.SessaoJogo.findBySalaId(salaId);
  }

  /**
   * Marcar snapshot como finalizado
   * @param {string} salaId - ID da sala
   */
  async finalizarSnapshot(salaId) {
    try {
      await db.SessaoJogo.finalize(salaId);
      console.log(`🏁 Snapshot finalizado para sala ${salaId}`);
    } catch (error) {
      // Se nao existe snapshot, ignorar silenciosamente
      if (error.code === 'P2025') return;
      throw error;
    }
  }
}

// Singleton
const sessaoSnapshotService = new SessaoSnapshotService();
export default sessaoSnapshotService;
