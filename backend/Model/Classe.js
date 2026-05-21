/**
 * Modelo de Classes para RPG usando Prisma
 */
const Classe = (prisma) => {
  const model = prisma.classes;

  // Métodos customizados
  const ClasseMethods = {
    // Buscar classe por nome
    async findByNome(nome) {
      return await model.findUnique({
        where: { nome }
      });
    },

    // Buscar classes por custo
    async findByCusto(custo, sistema = 'lunaria') {
      return await model.findMany({
        where: { custo, sistema },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar classes por custo máximo
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

    // Buscar classes por termo
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

    // Criar classe
    async create(data) {
      return await prisma.classes.create({
        data
      });
    },

    // Atualizar classe
    async update(id, data) {
      return await prisma.classes.update({
        where: { id },
        data
      });
    },

    // Deletar classe
    async delete(id) {
      return await prisma.classes.delete({
        where: { id }
      });
    },

    // Listar todas as classes
    async findAll(sistema = 'lunaria') {
      return await model.findMany({
        where: { sistema },
        orderBy: { nome: 'asc' }
      });
    },

    // Listar classes com paginação DB-level
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

    // Buscar classes com personagens
    async findWithPersonagens(sistema = 'lunaria') {
      return await model.findMany({
        where: { sistema },
        include: {
          personagens: true
        },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar classe por ID com personagens
    async findByIdWithPersonagens(id) {
      return await model.findUnique({
        where: { id },
        include: {
          personagens: true
        }
      });
    },

    // Buscar classes gratuitas
    async findGratuitas(sistema = 'lunaria') {
      return await model.findMany({
        where: { custo: 0, sistema },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar classes pagas
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
  return Object.assign(model, ClasseMethods);
};

export default Classe; 