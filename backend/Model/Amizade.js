/**
 * Model para gerenciar amizades entre usuarios
 * @param {PrismaClient} prisma - Cliente Prisma
 */
export default function Amizade(prisma) {
  return {
    /**
     * Listar amigos aceitos de um usuario
     */
    async findFriends(userId, options = {}) {
      const { limit = 50, offset = 0 } = options;

      const amizades = await prisma.amizades.findMany({
        where: {
          status: 'aceita',
          OR: [
            { requester_id: userId },
            { receiver_id: userId }
          ]
        },
        include: {
          requester: { select: { id: true, nome: true, email: true } },
          receiver: { select: { id: true, nome: true, email: true } }
        },
        orderBy: { atualizado_em: 'desc' },
        take: limit + 1,
        skip: offset
      });

      const hasMore = amizades.length > limit;
      const results = hasMore ? amizades.slice(0, limit) : amizades;

      // Retornar o "outro" usuario como amigo
      const friends = results.map(a => ({
        amizadeId: a.id,
        usuario: a.requester_id === userId ? a.receiver : a.requester,
        desde: a.atualizado_em || a.criado_em
      }));

      return { friends, hasMore, total: friends.length };
    },

    /**
     * Listar IDs dos amigos aceitos (para queries de feed)
     */
    async findFriendIds(userId) {
      const amizades = await prisma.amizades.findMany({
        where: {
          status: 'aceita',
          OR: [
            { requester_id: userId },
            { receiver_id: userId }
          ]
        },
        select: { requester_id: true, receiver_id: true }
      });

      const ids = new Set();
      amizades.forEach(a => {
        if (a.requester_id !== userId) ids.add(a.requester_id);
        if (a.receiver_id !== userId) ids.add(a.receiver_id);
      });
      return [...ids];
    },

    /**
     * Listar solicitacoes pendentes recebidas
     */
    async findPendingReceived(userId) {
      return await prisma.amizades.findMany({
        where: {
          receiver_id: userId,
          status: 'pendente'
        },
        include: {
          requester: { select: { id: true, nome: true, email: true } }
        },
        orderBy: { criado_em: 'desc' }
      });
    },

    /**
     * Checar se relacao existe entre dois usuarios
     */
    async findByPair(userId1, userId2) {
      return await prisma.amizades.findFirst({
        where: {
          OR: [
            { requester_id: userId1, receiver_id: userId2 },
            { requester_id: userId2, receiver_id: userId1 }
          ]
        }
      });
    },

    /**
     * Sugerir usuarios que participaram das mesmas historias
     */
    async suggestFromStories(userId, limit = 10) {
      // Buscar historias do usuario
      const userStories = await prisma.historias_personagens.findMany({
        where: {
          personagens: { id_usuario: userId }
        },
        select: { historia_id: true }
      });

      if (userStories.length === 0) return [];

      const historiaIds = userStories.map(s => s.historia_id);

      // Buscar usuarios nessas historias (excluindo self)
      const candidates = await prisma.historias_personagens.findMany({
        where: {
          historia_id: { in: historiaIds },
          personagens: {
            id_usuario: { not: userId },
            usuarios: { deleted_at: null }
          }
        },
        select: {
          personagens: {
            select: {
              id_usuario: true,
              usuarios: { select: { id: true, nome: true, email: true } }
            }
          }
        }
      });

      // Dedupe por usuario
      const userMap = new Map();
      candidates.forEach(c => {
        const u = c.personagens?.usuarios;
        if (u && !userMap.has(u.id)) {
          userMap.set(u.id, u);
        }
      });

      // Filtrar quem ja e amigo
      const existingFriendIds = await this.findFriendIds(userId);
      const existingSet = new Set(existingFriendIds);

      // Filtrar quem ja tem solicitacao pendente
      const pendingRequests = await prisma.amizades.findMany({
        where: {
          OR: [
            { requester_id: userId },
            { receiver_id: userId }
          ]
        },
        select: { requester_id: true, receiver_id: true }
      });
      pendingRequests.forEach(p => {
        if (p.requester_id !== userId) existingSet.add(p.requester_id);
        if (p.receiver_id !== userId) existingSet.add(p.receiver_id);
      });

      const suggestions = [];
      for (const [id, user] of userMap) {
        if (!existingSet.has(id)) {
          suggestions.push(user);
        }
        if (suggestions.length >= limit) break;
      }

      return suggestions;
    },

    /**
     * Buscar usuarios por nome ou email
     */
    async searchUsers(query, currentUserId, limit = 20) {
      if (!query || query.length < 2) return [];

      const users = await prisma.usuarios.findMany({
        where: {
          deleted_at: null,
          id: { not: currentUserId },
          OR: [
            { nome: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: { id: true, nome: true, email: true },
        take: limit
      });

      // Adicionar status da relacao
      const results = [];
      for (const user of users) {
        const relation = await this.findByPair(currentUserId, user.id);
        results.push({
          ...user,
          relacao: relation ? relation.status : null,
          amizadeId: relation?.id || null
        });
      }

      return results;
    },

    /**
     * Criar solicitacao de amizade
     */
    async create(requesterId, receiverId) {
      return await prisma.amizades.create({
        data: {
          requester_id: requesterId,
          receiver_id: receiverId,
          status: 'pendente'
        },
        include: {
          receiver: { select: { id: true, nome: true, email: true } }
        }
      });
    },

    /**
     * Aceitar solicitacao
     */
    async accept(id, receiverId) {
      return await prisma.amizades.update({
        where: { id, receiver_id: receiverId, status: 'pendente' },
        data: { status: 'aceita', atualizado_em: new Date() },
        include: {
          requester: { select: { id: true, nome: true, email: true } },
          receiver: { select: { id: true, nome: true, email: true } }
        }
      });
    },

    /**
     * Rejeitar solicitacao (deleta o registro)
     */
    async reject(id, receiverId) {
      return await prisma.amizades.delete({
        where: { id, receiver_id: receiverId, status: 'pendente' }
      });
    },

    /**
     * Bloquear usuario
     */
    async block(requesterId, targetId) {
      // Buscar relacao existente
      const existing = await this.findByPair(requesterId, targetId);

      if (existing) {
        return await prisma.amizades.update({
          where: { id: existing.id },
          data: { status: 'bloqueada', atualizado_em: new Date() }
        });
      }

      return await prisma.amizades.create({
        data: {
          requester_id: requesterId,
          receiver_id: targetId,
          status: 'bloqueada'
        }
      });
    },

    /**
     * Remover amizade
     */
    async remove(userId, amizadeId) {
      return await prisma.amizades.delete({
        where: {
          id: amizadeId,
          OR: [
            { requester_id: userId },
            { receiver_id: userId }
          ]
        }
      });
    },

    /**
     * Contar solicitacoes pendentes
     */
    async countPending(userId) {
      return await prisma.amizades.count({
        where: { receiver_id: userId, status: 'pendente' }
      });
    }
  };
}
