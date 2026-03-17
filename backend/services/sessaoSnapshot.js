import db from '../Model/index.js';
import gerenciadorSessoes from '../redis/sessoes.js';
import { buscarTemasCompletos } from '../helpers/temasHelper.js';
import logger from '../helpers/logger.js';

const log = logger.child({ module: 'sessaoSnapshot' });

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
      log.warn({ salaId }, 'Snapshot ignorado: sessao invalida');
      return null;
    }

    const snapshotData = {
      historia_id: parseInt(sessaoRedis.historiaId),
      estado: {
        ...(sessaoRedis.estadoJogo || {}),
        mestreContexto: sessaoRedis.mestreContexto || sessaoRedis.estadoJogo?.mestreContexto || null
      },
      mensagens: sessaoRedis.mensagens || [],
      resumos: sessaoRedis.resumos || [],
      jogadores: sessaoRedis.jogadores || {},
      status: sessaoRedis.status === 'finalizada' ? 'finalizada' : 'ativa',
      rodada_atual: sessaoRedis.estadoJogo?.rodadaAtual || 0,
      fase: sessaoRedis.estadoJogo?.fase || null,
      iniciada_em: sessaoRedis.iniciadaEm ? new Date(sessaoRedis.iniciadaEm) : null
    };

    const result = await db.SessaoJogo.upsertSnapshot(salaId, snapshotData);
    log.info({ salaId, rodada: snapshotData.rodada_atual }, 'Snapshot salvo');
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
      status: 'iniciada',
      statusJogo: 'iniciado',
      estadoJogo: snapshot.estado || {},
      mensagens: snapshot.mensagens || [],
      resumos: snapshot.resumos || [],
      jogadores: snapshot.jogadores || {},
      mestreContexto: snapshot.estado?.mestreContexto || null,
      iniciadaEm: snapshot.iniciada_em?.toISOString() || new Date().toISOString(),
      atualizadaEm: new Date().toISOString()
    };

    // Enriquecer com dados do banco (historia, mestre, personagens)
    try {
      const historia = await db.Historia.findById(snapshot.historia_id);
      if (historia) {
        sessaoReconstruida.historiaNome = historia.nome;
        sessaoReconstruida.historiaPrologo = historia.prologo || '';
        sessaoReconstruida.historiaRoteiro = historia.roteiro || null;
        sessaoReconstruida.historiaTemas = Array.isArray(historia.temas) && historia.temas.length > 0
          ? await buscarTemasCompletos(historia.temas)
          : [];
        sessaoReconstruida.donoId = historia.id_usuario ? String(historia.id_usuario) : null;
        sessaoReconstruida.maxJogadores = historia.maximo_de_participantes || 5;

        if (historia.mestres) {
          sessaoReconstruida.mestreConfig = {
            nome: historia.mestres.nome,
            personalidade: historia.mestres.personalidade,
            tom_narrativo: historia.mestres.tom_narrativo,
            regras_especiais: historia.mestres.regras_especiais,
            modelo: historia.mestres.modelo,
            temperatura: historia.mestres.temperatura,
            max_tokens: historia.mestres.max_tokens
          };
        }

        // Reconstruir jogadoresConectados a partir do mapa de jogadores
        sessaoReconstruida.jogadoresConectados = Object.keys(snapshot.jogadores || {});
      }
    } catch (err) {
      log.warn({ err }, 'Erro ao enriquecer sessao restaurada');
    }

    // Salvar no Redis
    await gerenciadorSessoes.criarSessao(salaId, sessaoReconstruida);
    log.info({ salaId }, 'Sessao restaurada do PostgreSQL para Redis');
    return sessaoReconstruida;
  }

  /**
   * Sincronizar: ler Redis e salvar no PostgreSQL
   * @param {string} salaId - ID da sala
   */
  async sincronizar(salaId) {
    const sessaoRedis = await gerenciadorSessoes.obterSessao(salaId);
    if (!sessaoRedis) {
      log.warn({ salaId }, 'Sincronizacao: sessao nao encontrada no Redis');
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
      log.info({ salaId }, 'Snapshot finalizado');
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
