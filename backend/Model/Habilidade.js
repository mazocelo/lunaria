/**
 * Modelo de Habilidades V2 para RPG usando Prisma
 */
const Habilidade = (prisma) => {
  const model = prisma.habilidades;

  const includeRelations = {
    classe: { select: { id: true, nome: true } },
    raca: { select: { id: true, nome: true } },
  };

  const HabilidadeMethods = {
    async findByTipo(tipo) {
      return await model.findMany({
        where: { tipo },
        include: includeRelations,
        orderBy: { nome: 'asc' }
      });
    },

    async findByElemento(elemento) {
      return await model.findMany({
        where: { elemento },
        include: includeRelations,
        orderBy: { nome: 'asc' }
      });
    },

    async findByCategoria(categoria) {
      return await model.findMany({
        where: { categoria },
        include: includeRelations,
        orderBy: [{ nivel_requerido: 'asc' }, { nome: 'asc' }]
      });
    },

    async findByEscolaMagia(escola_magia) {
      return await model.findMany({
        where: { escola_magia },
        include: includeRelations,
        orderBy: [{ nivel_requerido: 'asc' }, { nome: 'asc' }]
      });
    },

    async findByClasse(classe_id) {
      return await model.findMany({
        where: {
          OR: [
            { classe_id: parseInt(classe_id) },
            { classe_id: null }
          ]
        },
        include: includeRelations,
        orderBy: [{ nivel_requerido: 'asc' }, { nome: 'asc' }]
      });
    },

    async findByRaca(raca_id) {
      return await model.findMany({
        where: { raca_id: parseInt(raca_id) },
        include: includeRelations,
        orderBy: [{ nivel_requerido: 'asc' }, { nome: 'asc' }]
      });
    },

    async search(termo) {
      return await model.findMany({
        where: {
          OR: [
            { nome: { contains: termo, mode: 'insensitive' } },
            { descricao: { contains: termo, mode: 'insensitive' } }
          ]
        },
        include: includeRelations,
        orderBy: { nome: 'asc' }
      });
    },

    async findPaginated({ limit = 50, offset = 0, tipo, elemento, classe_id, nivel, busca, categoria, escola_magia, raca_id, alcance } = {}) {
      const where = {};
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
      return await prisma.habilidades.create({ data });
    },

    async update(id, data) {
      return await prisma.habilidades.update({ where: { id }, data });
    },

    async delete(id) {
      return await prisma.habilidades.delete({ where: { id } });
    },

    async findAll() {
      return await model.findMany({
        include: includeRelations,
        orderBy: [{ nivel_requerido: 'asc' }, { nome: 'asc' }]
      });
    },

    async getEstatisticas() {
      const [total, porTipo, porElemento, porCategoria, porEscola] = await Promise.all([
        model.count(),
        model.groupBy({ by: ['tipo'], _count: true }),
        model.groupBy({ by: ['elemento'], _count: true, where: { elemento: { not: null } } }),
        model.groupBy({ by: ['categoria'], _count: true }),
        model.groupBy({ by: ['escola_magia'], _count: true, where: { escola_magia: { not: null } } })
      ]);
      return { total, porTipo, porElemento, porCategoria, porEscola };
    }
  };

  return Object.assign(model, HabilidadeMethods);
};

export default Habilidade;
