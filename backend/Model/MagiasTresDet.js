const MagiasTresDet = (prisma) => {
  const model = prisma.magias_tresdet;

  return {
    buscarTodos: () => model.findMany({ orderBy: { nome: 'asc' } }),

    buscarPorId: (id) => model.findUnique({ where: { id } }),

    buscarPorEscola: (escola) => model.findMany({
      where: { escola: { contains: escola, mode: 'insensitive' } },
      orderBy: { nome: 'asc' }
    }),

    buscarPorNome: (nome) => model.findFirst({
      where: { nome: { contains: nome, mode: 'insensitive' } }
    }),

    buscarPorNomeExato: (nome) => model.findFirst({
      where: { nome: { equals: nome, mode: 'insensitive' } }
    }),

    buscarPorTipo: (tipo) => model.findMany({
      where: { tipo },
      orderBy: { nome: 'asc' }
    }),

    buscarFiltrado: ({ escola, tipo } = {}) => {
      const where = {};
      if (escola) where.escola = { contains: escola, mode: 'insensitive' };
      if (tipo) where.tipo = tipo;
      return model.findMany({ where, orderBy: { nome: 'asc' } });
    },

    criar: (data) => model.create({ data }),

    atualizar: (id, data) => model.update({ where: { id }, data }),

    deletar: (id) => model.delete({ where: { id } }),
  };
};

export default MagiasTresDet;
