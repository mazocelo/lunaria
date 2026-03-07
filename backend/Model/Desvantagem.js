/**
 * Modelo de Desvantagens para RPG usando Prisma
 */
const Desvantagem = (prisma) => {
  const model = prisma.desvantagens;

  // Métodos customizados
  const DesvantagemMethods = {
    // Buscar desvantagem por tipo
    async findByTipo(tipo) {
      return await model.findMany({
        where: {
          tipo: {
            has: tipo
          }
        },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar desvantagem por elemento
    async findByElemento(elemento) {
      return await model.findMany({
        where: {
          elemento: {
            has: elemento
          }
        },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar desvantagem por nível
    async findByNivel(nivel) {
      return await model.findMany({
        where: { nivel },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar desvantagem por forma de usar
    async findByUsar(usar) {
      return await model.findMany({
        where: { usar },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar desvantagem por termo
    async search(termo) {
      return await model.findMany({
        where: {
          OR: [
            { nome: { contains: termo, mode: 'insensitive' } },
            { descricao: { contains: termo, mode: 'insensitive' } }
          ]
        },
        orderBy: { nome: 'asc' }
      });
    },

    // Criar desvantagem
    async create(data) {
      // Preparar dados com valores padrão
      const desvantagemData = {
        ...data,
        requisitos: data.requisitos || {},
        bonus: data.bonus || {},
        restricao: data.restricao || {},
        efeito: data.efeito || {},
        criada_em: new Date(),
        atualizada_em: new Date()
      };

      return await prisma.desvantagens.create({
        data: desvantagemData
      });
    },

    // Atualizar desvantagem
    async update(id, data) {
      return await prisma.desvantagens.update({
        where: { id },
        data: {
          ...data,
          atualizada_em: new Date()
        }
      });
    },

    // Deletar desvantagem
    async delete(id) {
      return await prisma.desvantagens.delete({
        where: { id }
      });
    },

    // Listar todas as desvantagens
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

    // Buscar desvantagens por nível máximo
    async findByNivelMax(nivel) {
      return await model.findMany({
        where: {
          nivel: {
            lte: nivel
          }
        },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar desvantagens por custo
    async findByCusto(custo) {
      return await model.findMany({
        where: { custo },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar desvantagens por custo máximo
    async findByCustoMax(custo) {
      return await model.findMany({
        where: {
          custo: {
            lte: custo
          }
        },
        orderBy: { nome: 'asc' }
      });
    },

    // Contar desvantagens
    async count(where = {}) {
      return await prisma.desvantagens.count({ where });
    },

    // Buscar desvantagens ativas
    async findAtivas() {
      return await model.findMany({
        where: {
          tipo: {
            has: 'ativa'
          }
        },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar desvantagens passivas
    async findPassivas() {
      return await model.findMany({
        where: {
          tipo: {
            has: 'passiva'
          }
        },
        orderBy: { nome: 'asc' }
      });
    }
  };

  // Retornar o modelo com métodos customizados
  return Object.assign(model, DesvantagemMethods);
};

export default Desvantagem; 