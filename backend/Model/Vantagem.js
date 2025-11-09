/**
 * Modelo de Vantagens para RPG usando Prisma
 */
const Vantagem = (prisma) => {
  const model = prisma.vantagens;

  // Métodos customizados
  const VantagemMethods = {
    // Buscar vantagem por tipo
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

    // Buscar vantagem por elemento
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

    // Buscar vantagem por nível
    async findByNivel(nivel) {
      return await model.findMany({
        where: { nivel },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar vantagem por forma de usar
    async findByUsar(usar) {
      return await model.findMany({
        where: { usar },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar vantagem por termo
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

    // Criar vantagem
    async create(data) {
      // Preparar dados com valores padrão
      const vantagemData = {
        ...data,
        requisitos: data.requisitos || {},
        bonus: data.bonus || {},
        restricao: data.restricao || {},
        efeito: data.efeito || {},
        criada_em: new Date(),
        atualizada_em: new Date()
      };

      return await prisma.vantagens.create({
        data: vantagemData
      });
    },

    // Atualizar vantagem
    async update(id, data) {
      return await prisma.vantagens.update({
        where: { id },
        data: {
          ...data,
          atualizada_em: new Date()
        }
      });
    },

    // Deletar vantagem
    async delete(id) {
      return await prisma.vantagens.delete({
        where: { id }
      });
    },

    // Listar todas as vantagens
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

    // Buscar vantagens por nível máximo
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

    // Buscar vantagens por custo
    async findByCusto(custo) {
      return await model.findMany({
        where: { custo },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar vantagens por custo máximo
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

    // Contar vantagens
    async count(where = {}) {
      return await prisma.vantagem.count({ where });
    },

    // Buscar vantagens ativas
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

    // Buscar vantagens passivas
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
  return Object.assign(model, VantagemMethods);
};

export default Vantagem; 