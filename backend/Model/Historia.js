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
        where: { status },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar histórias ativas
    async findAtivas() {
      return await prisma.historias.findMany({
        where: { status: 'ativa' },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar histórias por participante (personagem)
    async findByParticipante(personagemId) {
      // Buscar através da tabela de relacionamento historias_personagens
      const historiasPersonagens = await prisma.historias_personagens.findMany({
        where: {
          personagem_id: personagemId
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
        }
      });
    },

    // Atualizar história
    async updateHistoria(id, data) {
      return await prisma.historias.update({
        where: { id },
        data: {
          ...data,
          atualizada_em: new Date()
        }
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
    async findAll() {
      return await prisma.historias.findMany({
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar por ID (inclui mestre se vinculado)
    async findById(id) {
      return await prisma.historias.findUnique({
        where: { id },
        include: { mestres: true }
      });
    },

    // Adicionar participante (personagem) à história
    async addParticipante(historiaId, personagemId, papel = 'jogador') {
      const historia = await prisma.historias.findUnique({
        where: { id: historiaId }
      });

      if (!historia) {
        throw new Error('História não encontrada');
      }

      // Verificar se personagem já está na história
      const jaParticipa = await prisma.historias_personagens.findFirst({
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
        const participantesAtuais = await prisma.historias_personagens.count({
          where: { historia_id: historiaId }
        });

        if (participantesAtuais >= historia.maximo_de_participantes) {
          throw new Error('Máximo de participantes atingido');
        }
      }

      // Adicionar personagem à história
      return await prisma.historias_personagens.create({
        data: {
          historia_id: historiaId,
          personagem_id: personagemId,
          papel: papel
        }
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

    // Contar histórias
    async count(where = {}) {
      return await prisma.historias.count({ where });
    },

    // Buscar histórias com vagas disponíveis
    async findWithVagas() {
      // Buscar todas as histórias ativas
      const historias = await prisma.historias.findMany({
        where: {
          status: 'ativa'
        },
        include: {
          historias_personagens: true
        },
        orderBy: { nome: 'asc' }
      });

      // Filtrar as que têm vagas
      return historias.filter(historia => {
        if (!historia.maximo_de_participantes) return true; // Sem limite
        return historia.historias_personagens.length < historia.maximo_de_participantes;
      });
    },

    // Buscar histórias por usuário (criadas por ele)
    async findByUsuario(usuario_id) {
      return await prisma.historias.findMany({
        where: { id_usuario: parseInt(usuario_id) },
        orderBy: { criada_em: 'desc' }
      });
    },

    // Buscar histórias onde personagens do usuário participam
    async findByPersonagensUsuario(usuario_id) {
      // Buscar histórias através da tabela historias_personagens onde os personagens pertencem ao usuário
      const historiasComPersonagens = await prisma.historias_personagens.findMany({
        where: {
          personagens: {
            id_usuario: parseInt(usuario_id)
          }
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
          }
        },
        include: {
          historias: true
        }
      });

      return convites.map(convite => ({
        ...convite.historias,
        tipo_relacao: `convite_${convite.status}`,
        convite_status: convite.status,
        convite_criado_em: convite.criado_em,
        convite_respondido_em: convite.respondido_em
      }));
    },

    // Buscar todas as histórias relacionadas ao usuário (criadas por ele + onde seus personagens participam + convites)
    async findAllByUsuario(usuario_id) {
      // Buscar histórias criadas pelo usuário
      const historiasCriadas = await this.findByUsuario(usuario_id);
      
      // Buscar histórias onde personagens do usuário participam
      const historiasComPersonagens = await this.findByPersonagensUsuario(usuario_id);
      
      // Buscar histórias onde o usuário tem convites (pendentes, aceitos ou null)
      const historiasComConvites = await this.findByConvites(usuario_id);
      
      // Combinar e remover duplicatas (caso o usuário tenha criado uma história e também tenha personagens nela ou convites)
      const todasHistorias = [...historiasCriadas, ...historiasComPersonagens, ...historiasComConvites];
      const historiasUnicas = todasHistorias.reduce((acc, historia) => {
        const existe = acc.find(h => h.id === historia.id);
        if (!existe) {
          // Determinar o tipo de relação baseado na origem
          let tipoRelacao = 'participante';
          if (historiasCriadas.find(h => h.id === historia.id)) {
            tipoRelacao = 'criador';
          } else if (historiasComConvites.find(h => h.id === historia.id)) {
            tipoRelacao = historia.tipo_relacao; // Já vem com convite_pendente, convite_aceito, etc.
          }
          
          acc.push({
            ...historia,
            tipo_relacao: tipoRelacao
          });
        } else {
          // Se já existe, combinar os tipos de relação
          const tiposRelacao = [];
          if (historiasCriadas.find(h => h.id === historia.id)) {
            tiposRelacao.push('criador');
          }
          if (historiasComPersonagens.find(h => h.id === historia.id)) {
            tiposRelacao.push('participante');
          }
          if (historiasComConvites.find(h => h.id === historia.id)) {
            const conviteHistoria = historiasComConvites.find(h => h.id === historia.id);
            tiposRelacao.push(conviteHistoria.tipo_relacao);
          }
          
          existe.tipo_relacao = tiposRelacao.join('_e_');
          
          // Preservar informações do convite se existir
          const conviteHistoria = historiasComConvites.find(h => h.id === historia.id);
          if (conviteHistoria) {
            existe.convite_status = conviteHistoria.convite_status;
            existe.convite_criado_em = conviteHistoria.convite_criado_em;
            existe.convite_respondido_em = conviteHistoria.convite_respondido_em;
          }
        }
        return acc;
      }, []);
      
      // Ordenar por data de criação (mais recente primeiro)
      return historiasUnicas.sort((a, b) => new Date(b.criada_em) - new Date(a.criada_em));
    }
  };

  // Retornar o modelo com métodos customizados
  return Object.assign(model, HistoriaMethods);
};

export default Historia;