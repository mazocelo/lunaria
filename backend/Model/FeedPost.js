/**
 * Model para gerenciar posts do feed social
 * @param {PrismaClient} prisma - Cliente Prisma
 */
export default function FeedPost(prisma) {
  return {
    /**
     * Buscar feed por tab (amigos ou comunidade)
     */
    async findFeed(userId, friendIds, tab = 'amigos', options = {}) {
      const { limit = 20, offset = 0 } = options;

      let where = { deleted_at: null };

      if (tab === 'amigos') {
        // Posts de amigos + proprios
        const userIds = [userId, ...friendIds];
        where.user_id = { in: userIds };
      } else {
        // Comunidade: posts com visibilidade 'comunidade'
        where.visibilidade = 'comunidade';
      }

      const posts = await prisma.feed_posts.findMany({
        where,
        include: {
          usuario: { select: { id: true, nome: true } },
          _count: { select: { curtidas: true, comentarios: true } }
        },
        orderBy: { criado_em: 'desc' },
        take: limit + 1,
        skip: offset
      });

      const hasMore = posts.length > limit;
      const results = hasMore ? posts.slice(0, limit) : posts;

      // Verificar se o usuario curtiu cada post
      const postIds = results.map(p => p.id);
      const userLikes = await prisma.feed_curtidas.findMany({
        where: { post_id: { in: postIds }, user_id: userId },
        select: { post_id: true }
      });
      const likedSet = new Set(userLikes.map(l => l.post_id));

      const formatted = results.map(p => ({
        id: p.id,
        usuario: p.usuario,
        tipo: p.tipo,
        conteudo: p.conteudo,
        entidade_tipo: p.entidade_tipo,
        entidade_id: p.entidade_id,
        visibilidade: p.visibilidade,
        criado_em: p.criado_em,
        curtidas: p._count.curtidas,
        comentarios: p._count.comentarios,
        curtidoPorMim: likedSet.has(p.id)
      }));

      return { posts: formatted, hasMore };
    },

    /**
     * Buscar post por ID
     */
    async findById(id) {
      return await prisma.feed_posts.findFirst({
        where: { id, deleted_at: null },
        include: {
          usuario: { select: { id: true, nome: true } },
          _count: { select: { curtidas: true, comentarios: true } }
        }
      });
    },

    /**
     * Criar post manual
     */
    async create(data) {
      return await prisma.feed_posts.create({
        data: {
          user_id: data.userId,
          tipo: 'post',
          conteudo: { texto: data.texto },
          entidade_tipo: data.entidade_tipo || null,
          entidade_id: data.entidade_id || null,
          visibilidade: data.visibilidade || 'amigos'
        },
        include: {
          usuario: { select: { id: true, nome: true } }
        }
      });
    },

    /**
     * Criar evento automatico do sistema
     */
    async createAutoEvent(userId, eventoTipo, eventoDados = {}, entidadeTipo = null, entidadeId = null) {
      try {
        return await prisma.feed_posts.create({
          data: {
            user_id: userId,
            tipo: 'evento',
            conteudo: { evento_tipo: eventoTipo, evento_dados: eventoDados },
            entidade_tipo: entidadeTipo,
            entidade_id: entidadeId,
            visibilidade: 'comunidade'
          }
        });
      } catch (error) {
        // Evento automatico nao deve quebrar o fluxo principal
        console.error('Erro ao criar evento de feed:', error.message);
        return null;
      }
    },

    /**
     * Soft delete de um post (apenas dono)
     */
    async softDelete(id, userId) {
      return await prisma.feed_posts.update({
        where: { id, user_id: userId },
        data: { deleted_at: new Date() }
      });
    },

    /**
     * Toggle curtida (curtir/descurtir)
     */
    async toggleCurtida(postId, userId) {
      const existing = await prisma.feed_curtidas.findUnique({
        where: { post_id_user_id: { post_id: postId, user_id: userId } }
      });

      if (existing) {
        await prisma.feed_curtidas.delete({
          where: { id: existing.id }
        });
        return { curtido: false };
      }

      await prisma.feed_curtidas.create({
        data: { post_id: postId, user_id: userId }
      });
      return { curtido: true };
    },

    /**
     * Listar comentarios de um post
     */
    async getComentarios(postId, options = {}) {
      const { limit = 20, offset = 0 } = options;

      const comentarios = await prisma.feed_comentarios.findMany({
        where: { post_id: postId, deleted_at: null },
        include: {
          usuario: { select: { id: true, nome: true } }
        },
        orderBy: { criado_em: 'asc' },
        take: limit + 1,
        skip: offset
      });

      const hasMore = comentarios.length > limit;
      return {
        comentarios: hasMore ? comentarios.slice(0, limit) : comentarios,
        hasMore
      };
    },

    /**
     * Adicionar comentario
     */
    async addComentario(postId, userId, texto) {
      return await prisma.feed_comentarios.create({
        data: {
          post_id: postId,
          user_id: userId,
          texto
        },
        include: {
          usuario: { select: { id: true, nome: true } }
        }
      });
    },

    /**
     * Deletar comentario (apenas dono)
     */
    async deleteComentario(id, userId) {
      return await prisma.feed_comentarios.update({
        where: { id, user_id: userId },
        data: { deleted_at: new Date() }
      });
    }
  };
}
