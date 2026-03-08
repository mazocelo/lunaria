/**
 * Modelo de Temas para RPG usando Prisma
 */
const Temas = (prisma) => {
  const model = prisma.temas;

  // Métodos customizados
  const TemasMethods = {
    // Buscar tema por nome
    async findByNome(nome) {
      return await model.findUnique({
        where: { nome }
      });
    },

    // Buscar temas por termo
    async search(termo) {
      return await model.findMany({
        where: {
          nome: { contains: termo, mode: 'insensitive' }
        },
        orderBy: { nome: 'asc' }
      });
    },

    // Criar tema
    async create(data) {
      return await prisma.temas.create({
        data
      });
    },

    // Atualizar tema
    async update(id, data) {
      return await prisma.temas.update({
        where: { id },
        data
      });
    },

    // Deletar tema
    async delete(id) {
      return await prisma.temas.delete({
        where: { id }
      });
    },

    // Listar todos os temas
    async findAll() {
      return await model.findMany({
        orderBy: { nome: 'asc' }
      });
    },

    // Listar temas com paginação DB-level
    async findPaginated({ limit = 50, offset = 0 } = {}) {
      const [data, total] = await Promise.all([
        model.findMany({ orderBy: { nome: 'asc' }, take: limit, skip: offset }),
        model.count()
      ]);
      return { data, total };
    },

    // Buscar por ID
    async findById(id) {
      return await model.findUnique({
        where: { id }
      });
    },

    // Verificar se tema existe
    async exists(nome) {
      const tema = await model.findUnique({
        where: { nome }
      });
      return !!tema;
    },

    // Buscar temas ordenados
    async findAllOrdered() {
      return await model.findMany({
        orderBy: { nome: 'asc' }
      });
    }
  };

  // Retornar o modelo com métodos customizados
  return Object.assign(model, TemasMethods);
};

export default Temas;
