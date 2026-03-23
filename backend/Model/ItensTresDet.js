const ItensTresDet = (prisma) => {
  const model = prisma.itens_tresdet;

  return {
    buscarTodos: () => model.findMany({ orderBy: { nome: 'asc' } }),

    buscarPorId: (id) => model.findUnique({ where: { id } }),

    buscarPorTipo: (tipo) => model.findMany({
      where: { tipo },
      orderBy: { nome: 'asc' }
    }),

    buscarPorNome: (nome) => model.findFirst({
      where: { nome: { contains: nome, mode: 'insensitive' } }
    }),

    criar: (data) => model.create({ data }),

    criarVarios: (data) => model.createMany({ data, skipDuplicates: true }),
  };
};

export default ItensTresDet;
