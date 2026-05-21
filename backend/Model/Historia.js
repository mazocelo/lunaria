/**
 * Modelo de Histórias para RPG usando Prisma
 */
const Historia = (prisma) => {
  const model = prisma.historias;

  // Métodos customizados
  const HistoriaMethods = {
    // Buscar histórias por tema
    async findByTema(tema) {
      return await prisma.historias.findMany({
        where: {
          deleted_at: null,
          temas: {
            has: tema
          }
        },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar histórias por status
    async findByStatus(status) {
      return await prisma.historias.findMany({
        where: { status, deleted_at: null },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar histórias ativas
    async findAtivas() {
      return await prisma.historias.findMany({
        where: { status: 'ativa', deleted_at: null },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar histórias por participante (personagem)
    async findByParticipante(personagemId) {
      const historiasPersonagens = await prisma.historias_personagens.findMany({
        where: {
          personagem_id: personagemId,
          historias: { deleted_at: null }
        },
        include: {
          historias: true
        }
      });

      return historiasPersonagens.map(hp => hp.historias);
    },

    // Buscar histórias por máximo de participantes
    async findByMaxParticipantes(max) {
      return await prisma.historias.findMany({
        where: {
          deleted_at: null,
          maximo_de_participantes: {
            lte: max
          }
        },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar histórias por termo
    async search(termo) {
      return await prisma.historias.findMany({
        where: {
          deleted_at: null,
          OR: [
            { nome: { contains: termo, mode: 'insensitive' } },
            { descricao: { contains: termo, mode: 'insensitive' } },
            { prologo: { contains: termo, mode: 'insensitive' } }
          ]
        },
        orderBy: { nome: 'asc' }
      });
    },

    // Criar história
    async createHistoria(data) {
      return await prisma.historias.create({
        data: {
          ...data,
          criada_em: new Date(),
          atualizada_em: new Date()
        },
        include: { mestres: true }
      });
    },

    // Atualizar história
    async updateHistoria(id, data) {
      return await prisma.historias.update({
        where: { id },
        data: {
          ...data,
          atualizada_em: new Date()
        },
        include: { mestres: true }
      });
    },

    // Soft delete história
    async deleteHistoria(id) {
      return await prisma.historias.update({
        where: { id },
        data: { deleted_at: new Date() }
      });
    },

    // Restaurar história soft-deleted
    async restoreHistoria(id) {
      return await prisma.historias.update({
        where: { id, deleted_at: { not: null } },
        data: { deleted_at: null }
      });
    },

    // Listar todas as histórias
    async findAll({ take = 50, skip = 0 } = {}) {
      return await prisma.historias.findMany({
        where: { deleted_at: null },
        orderBy: { nome: 'asc' },
        take,
        skip,
        include: { mestres: true }
      });
    },

    async countByUsuario(userId) {
      return await prisma.historias.count({ where: { id_usuario: userId, deleted_at: null } });
    },

    // Listar histórias públicas
    async findPublicas({ limit = 20, offset = 0, status, temas } = {}) {
      const where = { deleted_at: null, publica: true };
      if (status) where.status = status;
      if (temas) where.temas = { has: parseInt(temas) };
      const [data, total] = await Promise.all([
        prisma.historias.findMany({
          where,
          orderBy: { criada_em: 'desc' },
          include: {
            mestres: true,
            usuarios: { select: { id: true, nome: true } },
            _count: { select: { historias_personagens: true } },
          },
          skip: offset,
          take: limit,
        }),
        prisma.historias.count({ where }),
      ]);
      return { data, total };
    },

    // Buscar por ID (inclui mestre se vinculado)
    async findById(id) {
      return await prisma.historias.findFirst({
        where: { id, deleted_at: null },
        include: { mestres: true }
      });
    },

    // Adicionar participante (personagem) à história — com transaction para evitar race condition
    async addParticipante(historiaId, personagemId, papel = 'jogador') {
      return await prisma.$transaction(async (tx) => {
        const historia = await tx.historias.findFirst({
          where: { id: historiaId, deleted_at: null }
        });

        if (!historia) {
          throw new Error('História não encontrada');
        }

        // Verificar se personagem já está na história
        const jaParticipa = await tx.historias_personagens.findFirst({
          where: {
            historia_id: historiaId,
            personagem_id: personagemId
          }
        });

        if (jaParticipa) {
          throw new Error('Personagem já está na história');
        }

        // Verificar máximo de participantes
        if (historia.maximo_de_participantes) {
          const participantesAtuais = await tx.historias_personagens.count({
            where: { historia_id: historiaId }
          });

          if (participantesAtuais >= historia.maximo_de_participantes) {
            throw new Error('Máximo de participantes atingido');
          }
        }

        // Adicionar personagem à história
        return await tx.historias_personagens.create({
          data: {
            historia_id: historiaId,
            personagem_id: personagemId,
            papel: papel
          }
        });
      });
    },

    // Remover participante (personagem) da história
    async removeParticipante(historiaId, personagemId) {
      const vinculo = await prisma.historias_personagens.findFirst({
        where: {
          historia_id: historiaId,
          personagem_id: personagemId
        }
      });

      if (!vinculo) {
        throw new Error('Personagem não está na história');
      }

      return await prisma.historias_personagens.delete({
        where: {
          id: vinculo.id
        }
      });
    },


    // Buscar histórias com vagas disponíveis
    async findWithVagas() {
      const historias = await prisma.historias.findMany({
        where: { status: 'ativa', deleted_at: null },
        include: {
          _count: { select: { historias_personagens: { where: { personagens: { deleted_at: null } } } } }
        },
        orderBy: { nome: 'asc' }
      });

      return historias.filter(historia => {
        if (!historia.maximo_de_participantes) return true;
        return historia._count.historias_personagens < historia.maximo_de_participantes;
      });
    },

    // Buscar histórias por usuário (criadas por ele)
    async findByUsuario(usuario_id) {
      return await prisma.historias.findMany({
        where: { id_usuario: parseInt(usuario_id), deleted_at: null },
        orderBy: { criada_em: 'desc' }
      });
    },

    // Buscar histórias por usuário com paginação DB-level
    async findByUsuarioPaginated(usuario_id, { limit = 20, offset = 0, status } = {}) {
      const where = { id_usuario: parseInt(usuario_id), deleted_at: null };
      if (status) where.status = status;
      const [data, total] = await Promise.all([
        model.findMany({ where, orderBy: { criada_em: 'desc' }, take: limit, skip: offset, include: { mestres: true } }),
        prisma.historias.count({ where })
      ]);
      return { data, total };
    },

    // Buscar histórias onde personagens do usuário participam
    async findByPersonagensUsuario(usuario_id) {
      // Buscar histórias através da tabela historias_personagens onde os personagens pertencem ao usuário
      const historiasComPersonagens = await prisma.historias_personagens.findMany({
        where: {
          personagens: {
            id_usuario: parseInt(usuario_id),
            deleted_at: null
          },
          historias: { deleted_at: null }
        },
        include: {
          historias: true,
          personagens: {
            select: {
              id: true,
              nome: true
            }
          }
        }
      });

      // Retornar as histórias com informações dos personagens
      return historiasComPersonagens.map(vinculo => ({
        ...vinculo.historias,
        personagem_participante: {
          id: vinculo.personagens.id,
          nome: vinculo.personagens.nome,
          papel: vinculo.papel
        }
      }));
    },

    // Buscar histórias onde o usuário tem convites (pendentes ou aceitos)
    async findByConvites(usuario_id) {
      const convites = await prisma.historias_convite.findMany({
        where: {
          usuario_id: parseInt(usuario_id),
          status: {
            in: ['pendente', 'aceito']
          },
          historias: { deleted_at: null }
        },
        include: {
          historias: true
        }
      });

      return convites.filter(c => c.historias).map(convite => ({
        ...convite.historias,
        tipo_relacao: `convite_${convite.status}`,
        convite_status: convite.status,
        convite_criado_em: convite.criado_em,
        convite_respondido_em: convite.respondido_em
      }));
    },

    // Buscar todas as histórias relacionadas ao usuário (criadas por ele + onde seus personagens participam + convites)
    async findAllByUsuario(usuario_id, { take = 50, skip = 0 } = {}) {
      // Buscar histórias criadas pelo usuário
      const historiasCriadas = await this.findByUsuario(usuario_id);
      
      // Buscar histórias onde personagens do usuário participam
      const historiasComPersonagens = await this.findByPersonagensUsuario(usuario_id);
      
      // Buscar histórias onde o usuário tem convites (pendentes, aceitos ou null)
      const historiasComConvites = await this.findByConvites(usuario_id);
      
      // O(n) dedup using Maps instead of O(n²) with nested find()
      const criadasMap = new Map(historiasCriadas.map(h => [h.id, h]));
      const personagensMap = new Map(historiasComPersonagens.map(h => [h.id, h]));
      const convitesMap = new Map(historiasComConvites.map(h => [h.id, h]));

      const todasHistorias = [...historiasCriadas, ...historiasComPersonagens, ...historiasComConvites];
      const historiasMap = new Map();

      for (const historia of todasHistorias) {
        if (!historiasMap.has(historia.id)) {
          let tipoRelacao = 'participante';
          if (criadasMap.has(historia.id)) {
            tipoRelacao = 'criador';
          } else if (convitesMap.has(historia.id)) {
            tipoRelacao = historia.tipo_relacao;
          }

          historiasMap.set(historia.id, { ...historia, tipo_relacao: tipoRelacao });
        } else {
          const existe = historiasMap.get(historia.id);
          const tiposRelacao = [];
          if (criadasMap.has(historia.id)) tiposRelacao.push('criador');
          if (personagensMap.has(historia.id)) tiposRelacao.push('participante');
          if (convitesMap.has(historia.id)) {
            tiposRelacao.push(convitesMap.get(historia.id).tipo_relacao);
          }
          existe.tipo_relacao = tiposRelacao.join('_e_');

          const conviteHistoria = convitesMap.get(historia.id);
          if (conviteHistoria) {
            existe.convite_status = conviteHistoria.convite_status;
            existe.convite_criado_em = conviteHistoria.convite_criado_em;
            existe.convite_respondido_em = conviteHistoria.convite_respondido_em;
          }
        }
      }

      const historiasUnicas = Array.from(historiasMap.values());
      
      // Ordenar por data de criação (mais recente primeiro)
      historiasUnicas.sort((a, b) => new Date(b.criada_em) - new Date(a.criada_em));
      return historiasUnicas.slice(skip, skip + take);
    }
  };

  // Retornar o modelo com métodos customizados
  return Object.assign(model, HistoriaMethods);
};

export default Historia;