/**
 * Modelo de Raças para RPG usando Prisma
 */
const Raca = (prisma) => {
  const model = prisma.racas;

  // Métodos customizados
  const RacaMethods = {
    // Buscar raça por nome (chave unica e [nome, sistema])
    async findByNome(nome, sistema = 'lunaria') {
      return await model.findFirst({
        where: { nome, sistema }
      });
    },

    // Buscar raças por custo
    async findByCusto(custo, sistema = 'lunaria') {
      return await model.findMany({
        where: { custo, sistema },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar raças por custo máximo
    async findByCustoMax(custo, sistema = 'lunaria') {
      return await model.findMany({
        where: {
          custo: {
            lte: custo
          },
          sistema
        },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar raças por termo
    async search(termo, sistema = 'lunaria') {
      return await model.findMany({
        where: {
          OR: [
            { nome: { contains: termo, mode: 'insensitive' } },
            { descricao: { contains: termo, mode: 'insensitive' } }
          ],
          sistema
        },
        orderBy: { nome: 'asc' }
      });
    },

    // Criar raça
    async create(data) {
      return await prisma.racas.create({
        data
      });
    },

    // Atualizar raça
    async update(id, data) {
      return await prisma.racas.update({
        where: { id },
        data
      });
    },

    // Deletar raça
    async delete(id) {
      return await prisma.racas.delete({
        where: { id }
      });
    },

    // Listar todas as raças
    async findAll(sistema = 'lunaria') {
      return await model.findMany({
        where: { sistema },
        orderBy: { nome: 'asc' }
      });
    },

    // Listar raças com paginação DB-level
    async findPaginated({ limit = 50, offset = 0, sistema = 'lunaria' } = {}) {
      const where = { sistema };
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

    // Buscar raças com personagens
    async findWithPersonagens(sistema = 'lunaria') {
      return await model.findMany({
        where: { sistema },
        include: {
          personagens: true
        },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar raça por ID com personagens
    async findByIdWithPersonagens(id) {
      return await model.findUnique({
        where: { id },
        include: {
          personagens: true
        }
      });
    },

    // Buscar raças gratuitas
    async findGratuitas(sistema = 'lunaria') {
      return await model.findMany({
        where: { custo: 0, sistema },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar raças pagas
    async findPagas(sistema = 'lunaria') {
      return await model.findMany({
        where: {
          custo: {
            gt: 0
          },
          sistema
        },
        orderBy: { nome: 'asc' }
      });
    }
  };

  // Retornar o modelo com métodos customizados
  return Object.assign({ ...model }, RacaMethods);
};

export default Raca; 