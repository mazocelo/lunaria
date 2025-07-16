/**
 * Modelo de Histórias para RPG usando Prisma
 */
const Historia = (prisma) => {
  const model = prisma.historias;

  // Métodos customizados
  const HistoriaMethods = {
    // Buscar histórias por tema
    async findByTema(tema) {
      return await model.findMany({
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
      return await model.findMany({
        where: { status },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar histórias ativas
    async findAtivas() {
      return await model.findMany({
        where: { status: 'ativa' },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar histórias por participante
    async findByParticipante(participante) {
      return await model.findMany({
        where: {
          participantes: {
            has: participante
          }
        },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar histórias por máximo de participantes
    async findByMaxParticipantes(max) {
      return await model.findMany({
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
      return await model.findMany({
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
    async create(data) {
      return await model.create({
        data: {
          ...data,
          criada_em: new Date(),
          atualizada_em: new Date()
        }
      });
    },

    // Atualizar história
    async update(id, data) {
      return await model.update({
        where: { id },
        data: {
          ...data,
          atualizada_em: new Date()
        }
      });
    },

    // Deletar história
    async delete(id) {
      return await model.delete({
        where: { id }
      });
    },

    // Listar todas as histórias
    async findAll() {
      return await model.findMany({
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar por ID
    async findById(id) {
      return await model.findUnique({
        where: { id }
      });
    },

    // Adicionar participante à história
    async addParticipante(id, participante) {
      const historia = await model.findUnique({
        where: { id }
      });

      if (!historia) {
        throw new Error('História não encontrada');
      }

      const participantesAtuais = historia.participantes || [];
      
      if (participantesAtuais.includes(participante)) {
        throw new Error('Participante já está na história');
      }

      if (historia.maximo_de_participantes && participantesAtuais.length >= historia.maximo_de_participantes) {
        throw new Error('Máximo de participantes atingido');
      }

      return await model.update({
        where: { id },
        data: {
          participantes: [...participantesAtuais, participante],
          atualizada_em: new Date()
        }
      });
    },

    // Remover participante da história
    async removeParticipante(id, participante) {
      const historia = await model.findUnique({
        where: { id }
      });

      if (!historia) {
        throw new Error('História não encontrada');
      }

      const participantesAtuais = historia.participantes || [];
      const novosParticipantes = participantesAtuais.filter(p => p !== participante);

      return await model.update({
        where: { id },
        data: {
          participantes: novosParticipantes,
          atualizada_em: new Date()
        }
      });
    },

    // Contar histórias
    async count(where = {}) {
      return await prisma.historias.count({ where });
    },

    // Buscar histórias com vagas disponíveis
    async findWithVagas() {
      return await model.findMany({
        where: {
          OR: [
            { maximo_de_participantes: null },
            {
              AND: [
                { maximo_de_participantes: { not: null } },
                // Usando raw query para comparar array length
                { participantes: { isEmpty: false } }
              ]
            }
          ]
        },
        orderBy: { nome: 'asc' }
      });
    }
  };

  // Retornar o modelo com métodos customizados
  return Object.assign(model, HistoriaMethods);
};

export default Historia;