import logger from '../helpers/logger.js';

const log = logger.child({ module: 'SessaoJogo' });

/**
 * Modelo de SessaoJogo - Persistencia de sessoes de jogo em PostgreSQL
 * Armazena snapshots periodicos do estado Redis para durabilidade
 */
const SessaoJogo = (prisma) => {
  const model = prisma.sessoes_jogo;

  const SessaoJogoMethods = {
    /**
     * Criar nova sessao
     */
    async create(data) {
      return await model.create({ data });
    },

    /**
     * Buscar por sala_id (chave unica)
     */
    async findBySalaId(salaId) {
      return await model.findUnique({
        where: { sala_id: salaId }
      });
    },

    /**
     * Buscar sessoes de uma historia
     */
    async findByHistoriaId(historiaId) {
      return await model.findMany({
        where: { historia_id: historiaId },
        orderBy: { atualizada_em: 'desc' }
      });
    },

    /**
     * Upsert snapshot — cria ou atualiza por sala_id
     * Operacao critica: chamada a cada N mensagens / mudanca de rodada
     */
    async upsertSnapshot(salaId, snapshotData) {
      return await model.upsert({
        where: { sala_id: salaId },
        create: {
          sala_id: salaId,
          historia_id: snapshotData.historia_id,
          estado: snapshotData.estado || {},
          mensagens: snapshotData.mensagens || [],
          resumos: snapshotData.resumos || [],
          jogadores: snapshotData.jogadores || {},
          status: snapshotData.status || 'ativa',
          rodada_atual: snapshotData.rodada_atual || 0,
          fase: snapshotData.fase || null,
          iniciada_em: snapshotData.iniciada_em || null,
          ultimo_snapshot: new Date()
        },
        update: {
          estado: snapshotData.estado || {},
          mensagens: snapshotData.mensagens || [],
          resumos: snapshotData.resumos || [],
          jogadores: snapshotData.jogadores || {},
          status: snapshotData.status || 'ativa',
          rodada_atual: snapshotData.rodada_atual || 0,
          fase: snapshotData.fase || null,
          ultimo_snapshot: new Date()
        }
      });
    },

    /**
     * Marcar sessao como finalizada e arquivar sala_id
     * Renomeia sala_id com sufixo timestamp para liberar o ID original
     * para futuras sessoes (evita upsert sobrescrever historico)
     */
    async finalize(salaId) {
      const archivedSalaId = `${salaId}_fin_${Date.now()}`;
      return await model.update({
        where: { sala_id: salaId },
        data: {
          sala_id: archivedSalaId,
          status: 'finalizada',
          finalizada_em: new Date(),
          ultimo_snapshot: new Date()
        }
      });
    },

    /**
     * Arquivar todas as sessoes ativas de uma historia (safety cleanup)
     * Chamado antes de criar nova sessao para evitar conflito de sala_id
     */
    async archiveActiveByHistoriaId(historiaId) {
      const activeSessions = await model.findMany({
        where: { historia_id: historiaId, status: 'ativa' }
      });
      for (const session of activeSessions) {
        const archivedSalaId = `${session.sala_id}_fin_${Date.now()}`;
        await model.update({
          where: { id: session.id },
          data: {
            sala_id: archivedSalaId,
            status: 'finalizada',
            finalizada_em: new Date(),
            ultimo_snapshot: new Date()
          }
        });
      }
      if (activeSessions.length > 0) {
        log.info({ count: activeSessions.length, historiaId }, 'Arquivadas sessoes stale');
      }
      return activeSessions.length;
    },

    /**
     * Listar sessoes ativas
     */
    async findActive() {
      return await model.findMany({
        where: { status: 'ativa' },
        orderBy: { atualizada_em: 'desc' },
        include: {
          historia: {
            select: { id: true, nome: true, id_usuario: true }
          }
        }
      });
    },

    /**
     * Listar sessoes salvas de um usuario (via historia.id_usuario)
     */
    async findByUsuarioId(usuarioId) {
      return await model.findMany({
        where: {
          historia: { id_usuario: usuarioId }
        },
        orderBy: { atualizada_em: 'desc' },
        include: {
          historia: {
            select: { id: true, nome: true, id_usuario: true }
          }
        }
      });
    },

    /**
     * Buscar sessao por ID numerico
     */
    async findById(id) {
      return await model.findUnique({
        where: { id: parseInt(id) }
      });
    },

    /**
     * Hard delete de sessao
     */
    async delete(salaId) {
      return await model.delete({
        where: { sala_id: salaId }
      });
    }
  };

  return Object.assign(model, SessaoJogoMethods);
};

export default SessaoJogo;
