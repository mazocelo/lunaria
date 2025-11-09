/**
 * Modelo de Raças para RPG usando Prisma
 */
const Raca = (prisma) => {
  const model = prisma.racas;

  // Métodos customizados
  const RacaMethods = {
    // Buscar raça por nome
    async findByNome(nome) {
      return await model.findUnique({
        where: { nome }
      });
    },

    // Buscar raças por custo
    async findByCusto(custo) {
      return await model.findMany({
        where: { custo },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar raças por custo máximo
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

    // Buscar raças por termo
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

    // Buscar raças com personagens
    async findWithPersonagens() {
      return await model.findMany({
        include: {
          personagem: true,
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
          personagem: true,
          personagens: true
        }
      });
    },

    // Contar raças
    async count(where = {}) {
      return await prisma.raca.count({ where });
    },

    // Buscar raças gratuitas
    async findGratuitas() {
      return await model.findMany({
        where: { custo: 0 },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar raças pagas
    async findPagas() {
      return await model.findMany({
        where: {
          custo: {
            gt: 0
          }
        },
        orderBy: { nome: 'asc' }
      });
    }
  };

  // Retornar o modelo com métodos customizados
  return Object.assign(model, RacaMethods);
};

export default Raca; 