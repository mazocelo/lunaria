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
    async findByCusto(custo) {
      return await model.findMany({
        where: { custo },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar classes por custo máximo
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

    // Buscar classes por termo
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

    // Buscar classes com personagens
    async findWithPersonagens() {
      return await model.findMany({
        include: {
          personagem: true,
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
          personagem: true,
          personagens: true
        }
      });
    },

    // Contar classes
    async count(where = {}) {
      return await prisma.classe.count({ where });
    },

    // Buscar classes gratuitas
    async findGratuitas() {
      return await model.findMany({
        where: { custo: 0 },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar classes pagas
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
  return Object.assign(model, ClasseMethods);
};

export default Classe; 