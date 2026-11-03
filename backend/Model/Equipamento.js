/**
 * Modelo de Equipamento para RPG usando Prisma
 */
const Equipamento = (prisma) => {
  const model = prisma.equipamentos;

  const includeRels = {
    raridade_rel: true,
    categoria_rel: true,
  };

  // Métodos customizados
  const EquipamentoMethods = {
    // Buscar equipamento com relacionamentos
    async findByIdWithRelations(id) {
      return await model.findUnique({
        where: { id },
        include: {
          ...includeRels,
          personagem_equipamento: {
            include: {
              personagens: true
            }
          }
        }
      });
    },

    // Buscar equipamentos por tipo
    async findByTipo(tipo, sistema = 'lunaria') {
      return await model.findMany({
        where: { tipo: { has: tipo }, sistema },
        include: includeRels,
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar equipamentos por elemento
    async findByElemento(elemento, sistema = 'lunaria') {
      return await model.findMany({
        where: { elemento: { has: elemento }, sistema },
        include: includeRels,
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar por raridade (by ID)
    async findByRaridade(raridadeId, sistema = 'lunaria') {
      return await model.findMany({
        where: { raridade_id: raridadeId, sistema },
        include: includeRels,
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar por categoria (by ID)
    async findByCategoria(categoriaId, sistema = 'lunaria') {
      return await model.findMany({
        where: { categoria_id: categoriaId, sistema },
        include: includeRels,
        orderBy: { numero: 'asc' }
      });
    },

    // Buscar por numero
    async findByNumero(numero) {
      return await model.findFirst({
        where: { numero },
        include: includeRels,
      });
    },

    // Buscar por nome exato (chave unica e [nome, sistema]); sistema opcional
    // para chamadas em sessao (acoesProcessor) que buscam em qualquer sistema.
    async findByNome(nome, sistema) {
      const where = { nome: { equals: nome, mode: 'insensitive' } };
      if (sistema) where.sistema = sistema;
      return await model.findFirst({
        where,
        include: includeRels,
      });
    },

    // Buscar equipamentos por nome/descricao
    async search(termo, sistema = 'lunaria') {
      return await model.findMany({
        where: {
          OR: [
            { nome: { contains: termo, mode: 'insensitive' } },
            { descricao: { contains: termo, mode: 'insensitive' } },
            { raridade_rel: { nome: { contains: termo, mode: 'insensitive' } } },
            { categoria_rel: { nome: { contains: termo, mode: 'insensitive' } } },
          ],
          sistema
        },
        include: includeRels,
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar por propriedade
    async findByPropriedade(propriedade, sistema = 'lunaria') {
      return await model.findMany({
        where: { propriedades: { has: propriedade }, sistema },
        include: includeRels,
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar equipamentos com cargas
    async findComCargas(sistema = 'lunaria') {
      return await model.findMany({
        where: { cargas: { not: null }, sistema },
        include: includeRels,
        orderBy: { nome: 'asc' }
      });
    },

    // Criar equipamento
    async create(data) {
      return await prisma.equipamentos.create({
        data: {
          ...data,
          bonus: data.bonus || [],
          elemento: data.elemento || [],
          tipo: data.tipo || [],
          propriedades: data.propriedades || []
        },
        include: includeRels,
      });
    },

    // Atualizar equipamento
    async update(id, data) {
      return await prisma.equipamentos.update({
        where: { id },
        data,
        include: includeRels,
      });
    },

    // Deletar equipamento
    async delete(id) {
      return await prisma.equipamentos.delete({
        where: { id }
      });
    },

    // Listar todos os equipamentos
    async findAll(sistema = 'lunaria') {
      return await model.findMany({
        where: { sistema },
        include: includeRels,
        orderBy: { nome: 'asc' }
      });
    },

    // Listar equipamentos com paginação DB-level
    async findPaginated({ limit = 50, offset = 0, search, sistema = 'lunaria' } = {}) {
      const where = { sistema };
      if (search) {
        where.OR = [
          { nome: { contains: search, mode: 'insensitive' } },
          { descricao: { contains: search, mode: 'insensitive' } },
        ];
      }
      const [data, total] = await Promise.all([
        model.findMany({ where, include: includeRels, orderBy: { nome: 'asc' }, take: limit, skip: offset }),
        model.count({ where })
      ]);
      return { data, total };
    },

    // Buscar por ID
    async findById(id) {
      return await model.findUnique({
        where: { id },
        include: includeRels,
      });
    },

  };

  // Retornar o modelo com métodos customizados
  return Object.assign({ ...model }, EquipamentoMethods);
};

export default Equipamento;
