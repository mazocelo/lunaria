/**
 * Modelo de Equipamento para RPG usando Prisma
 */
const Equipamento = (prisma) => {
  const model = prisma.equipamentos;

  // Métodos customizados
  const EquipamentoMethods = {
    // Buscar equipamento com relacionamentos
    async findByIdWithRelations(id) {
      return await model.findUnique({
        where: { id },
        include: {
          personagem_equipamento: {
            include: {
              personagem: true
            }
          }
        }
      });
    },

    // Buscar equipamentos por tipo
    async findByTipo(tipo) {
      return await model.findMany({
        where: {
          tipo: {
            has: tipo
          }
        },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar equipamentos por elemento
    async findByElemento(elemento) {
      return await model.findMany({
        where: {
          elemento: {
            has: elemento
          }
        },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar por raridade
    async findByRaridade(raridade) {
      return await model.findMany({
        where: { raridade },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar por categoria
    async findByCategoria(categoria) {
      return await model.findMany({
        where: { categoria },
        orderBy: { numero: 'asc' }
      });
    },

    // Buscar por numero
    async findByNumero(numero) {
      return await model.findFirst({
        where: { numero }
      });
    },

    // Buscar por nome exato
    async findByNome(nome) {
      return await model.findFirst({
        where: { nome: { equals: nome, mode: 'insensitive' } }
      });
    },

    // Buscar equipamentos por nome
    async search(termo) {
      return await model.findMany({
        where: {
          OR: [
            { nome: { contains: termo, mode: 'insensitive' } },
            { descricao: { contains: termo, mode: 'insensitive' } },
            { categoria: { contains: termo, mode: 'insensitive' } },
            { raridade: { contains: termo, mode: 'insensitive' } }
          ]
        },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar por propriedade
    async findByPropriedade(propriedade) {
      return await model.findMany({
        where: {
          propriedades: {
            has: propriedade
          }
        },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar equipamentos com cargas
    async findComCargas() {
      return await model.findMany({
        where: {
          cargas: { not: null }
        },
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
        }
      });
    },

    // Atualizar equipamento
    async update(id, data) {
      return await prisma.equipamentos.update({
        where: { id },
        data
      });
    },

    // Deletar equipamento
    async delete(id) {
      return await prisma.equipamentos.delete({
        where: { id }
      });
    },

    // Listar todos os equipamentos
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

    // Contar equipamentos
    async count(where = {}) {
      return await model.count({ where });
    }
  };

  // Retornar o modelo com métodos customizados
  return Object.assign(model, EquipamentoMethods);
};

export default Equipamento; 