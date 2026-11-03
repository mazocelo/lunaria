/**
 * Modelo de Desvantagens para RPG usando Prisma
 */
const Desvantagem = (prisma) => {
  const model = prisma.desvantagens;

  // Métodos customizados
  const DesvantagemMethods = {
    // Buscar desvantagem por tipo
    async findByTipo(tipo, sistema = 'lunaria', { take = 200, skip = 0 } = {}) {
      return await model.findMany({
        where: {
          tipo: {
            has: tipo
          },
          sistema
        },
        orderBy: { nome: 'asc' },
        take,
        skip
      });
    },

    // Buscar desvantagem por elemento
    async findByElemento(elemento, sistema = 'lunaria', { take = 200, skip = 0 } = {}) {
      return await model.findMany({
        where: {
          elemento: {
            has: elemento
          },
          sistema
        },
        orderBy: { nome: 'asc' },
        take,
        skip
      });
    },

    // Buscar desvantagem por nível
    async findByNivel(nivel, sistema = 'lunaria', { take = 200, skip = 0 } = {}) {
      return await model.findMany({
        where: { nivel, sistema },
        orderBy: { nome: 'asc' },
        take,
        skip
      });
    },

    // Buscar desvantagem por forma de usar
    async findByUsar(usar, sistema = 'lunaria', { take = 200, skip = 0 } = {}) {
      return await model.findMany({
        where: { usar, sistema },
        orderBy: { nome: 'asc' },
        take,
        skip
      });
    },

    // Buscar desvantagem por termo
    async search(termo, sistema = 'lunaria', { take = 200, skip = 0 } = {}) {
      return await model.findMany({
        where: {
          OR: [
            { nome: { contains: termo, mode: 'insensitive' } },
            { descricao: { contains: termo, mode: 'insensitive' } }
          ],
          sistema
        },
        orderBy: { nome: 'asc' },
        take,
        skip
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
    async findAll(sistema = 'lunaria', { take = 200, skip = 0 } = {}) {
      return await model.findMany({
        where: { sistema },
        orderBy: { nome: 'asc' },
        take,
        skip
      });
    },

    // Listar desvantagens com paginação DB-level
    async findPaginated({ limit = 50, offset = 0, tipo, elemento, nivel, usar, search, sistema = 'lunaria' } = {}) {
      const where = { sistema };
      if (tipo) where.tipo = { has: tipo };
      if (elemento) where.elemento = { has: elemento };
      if (nivel !== undefined) where.nivel = { lte: parseInt(nivel) };
      if (usar !== undefined) where.usar = parseInt(usar);
      if (search) {
        where.OR = [
          { nome: { contains: search, mode: 'insensitive' } },
          { descricao: { contains: search, mode: 'insensitive' } },
        ];
      }
      const [data, total] = await Promise.all([
        model.findMany({ where, orderBy: { nome: 'asc' }, take: limit, skip: offset }),
        model.count({ where })
      ]);
      return { data, total };
    },

    // Buscar por ID
    async findById(id) {
      return await model.findUnique({
        where: { id }
      });
    },

    // Buscar desvantagens por nível máximo
    async findByNivelMax(nivel, sistema = 'lunaria', { take = 200, skip = 0 } = {}) {
      return await model.findMany({
        where: {
          nivel: {
            lte: nivel
          },
          sistema
        },
        orderBy: { nome: 'asc' },
        take,
        skip
      });
    },

    // Buscar desvantagens por custo
    async findByCusto(custo, sistema = 'lunaria', { take = 200, skip = 0 } = {}) {
      return await model.findMany({
        where: { custo, sistema },
        orderBy: { nome: 'asc' },
        take,
        skip
      });
    },

    // Buscar desvantagens por custo máximo
    async findByCustoMax(custo, sistema = 'lunaria', { take = 200, skip = 0 } = {}) {
      return await model.findMany({
        where: {
          custo: {
            lte: custo
          },
          sistema
        },
        orderBy: { nome: 'asc' },
        take,
        skip
      });
    },

    // Buscar desvantagens ativas
    async findAtivas(sistema = 'lunaria', { take = 200, skip = 0 } = {}) {
      return await model.findMany({
        where: {
          tipo: {
            has: 'ativa'
          },
          sistema
        },
        orderBy: { nome: 'asc' },
        take,
        skip
      });
    },

    // Buscar desvantagens passivas
    async findPassivas(sistema = 'lunaria', { take = 200, skip = 0 } = {}) {
      return await model.findMany({
        where: {
          tipo: {
            has: 'passiva'
          },
          sistema
        },
        orderBy: { nome: 'asc' },
        take,
        skip
      });
    }
  };

  // Retornar o modelo com métodos customizados
  return Object.assign({ ...model }, DesvantagemMethods);
};

export default Desvantagem; 