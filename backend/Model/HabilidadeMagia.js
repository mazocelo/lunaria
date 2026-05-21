const HabilidadeMagia = (prisma) => {
  const model = prisma.habilidades_magias;

  const includeRelations = {
    classe: { select: { id: true, nome: true } },
    raca: { select: { id: true, nome: true } },
  };

  const HabilidadeMethods = {
    async findByTipo(tipo, sistema = 'lunaria') {
      return await model.findMany({
        where: { tipo, sistema },
        include: includeRelations,
        orderBy: { nome: 'asc' }
      });
    },

    async findByElemento(elemento, sistema = 'lunaria') {
      return await model.findMany({
        where: { elemento, sistema },
        include: includeRelations,
        orderBy: { nome: 'asc' }
      });
    },

    async findByCategoria(categoria, sistema = 'lunaria') {
      return await model.findMany({
        where: { categoria, sistema },
        include: includeRelations,
        orderBy: [{ nivel_requerido: 'asc' }, { nome: 'asc' }]
      });
    },

    async findByEscolaMagia(escola_magia, sistema = 'lunaria') {
      return await model.findMany({
        where: { escola_magia, sistema },
        include: includeRelations,
        orderBy: [{ nivel_requerido: 'asc' }, { nome: 'asc' }]
      });
    },

    async findByClasse(classe_id, sistema = 'lunaria') {
      return await model.findMany({
        where: {
          OR: [
            { classe_id: parseInt(classe_id) },
            { classe_id: null, raca_id: null }
          ],
          sistema
        },
        include: includeRelations,
        orderBy: [{ nivel_requerido: 'asc' }, { nome: 'asc' }]
      });
    },

    async findByRaca(raca_id, sistema = 'lunaria') {
      return await model.findMany({
        where: { raca_id: parseInt(raca_id), sistema },
        include: includeRelations,
        orderBy: [{ nivel_requerido: 'asc' }, { nome: 'asc' }]
      });
    },

    async search(termo, sistema = 'lunaria') {
      return await model.findMany({
        where: {
          OR: [
            { nome: { contains: termo, mode: 'insensitive' } },
            { descricao: { contains: termo, mode: 'insensitive' } }
          ],
          sistema
        },
        include: includeRelations,
        orderBy: { nome: 'asc' }
      });
    },

    async findPaginated({ limit = 50, offset = 0, tipo, elemento, classe_id, nivel, busca, categoria, escola_magia, raca_id, alcance, sistema = 'lunaria' } = {}) {
      const where = { sistema };
      if (tipo) where.tipo = tipo;
      if (elemento) where.elemento = elemento;
      if (classe_id) where.classe_id = parseInt(classe_id);
      if (nivel !== undefined) where.nivel_requerido = { lte: parseInt(nivel) };
      if (categoria) where.categoria = categoria;
      if (escola_magia) where.escola_magia = escola_magia;
      if (raca_id) where.raca_id = parseInt(raca_id);
      if (alcance) where.alcance = alcance;
      if (busca) {
        where.OR = [
          { nome: { contains: busca, mode: 'insensitive' } },
          { descricao: { contains: busca, mode: 'insensitive' } }
        ];
      }

      const [data, total] = await Promise.all([
        model.findMany({
          where,
          include: includeRelations,
          orderBy: [{ nivel_requerido: 'asc' }, { nome: 'asc' }],
          take: limit,
          skip: offset
        }),
        model.count({ where })
      ]);
      return { data, total };
    },

    async findById(id) {
      return await model.findUnique({
        where: { id },
        include: {
          ...includeRelations,
          receitas: {
            include: {
              ingredientes_rel: { include: { ingrediente: true } },
              ferramentas_rel: { include: { ferramenta: true } },
            }
          }
        }
      });
    },

    async create(data) {
      return await prisma.habilidades_magias.create({ data });
    },

    async update(id, data) {
      return await prisma.habilidades_magias.update({ where: { id }, data });
    },

    async delete(id) {
      return await prisma.habilidades_magias.delete({ where: { id } });
    },

    async findAll(sistema = 'lunaria') {
      return await model.findMany({
        where: { sistema },
        include: includeRelations,
        orderBy: [{ nivel_requerido: 'asc' }, { nome: 'asc' }]
      });
    },

    async getEstatisticas(sistema = 'lunaria') {
      const [total, porTipo, porElemento, porCategoria, porEscola] = await Promise.all([
        model.count({ where: { sistema } }),
        model.groupBy({ by: ['tipo'], _count: true, where: { sistema } }),
        model.groupBy({ by: ['elemento'], _count: true, where: { elemento: { not: null }, sistema } }),
        model.groupBy({ by: ['categoria'], _count: true, where: { sistema } }),
        model.groupBy({ by: ['escola_magia'], _count: true, where: { escola_magia: { not: null }, sistema } })
      ]);
      return { total, porTipo, porElemento, porCategoria, porEscola };
    }
  };

  return Object.assign(model, HabilidadeMethods);
};

export default HabilidadeMagia;
