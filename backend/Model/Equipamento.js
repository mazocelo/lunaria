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

    // Buscar equipamentos por nome
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

    // Criar equipamento
    async create(data) {
      return await model.create({
        data: {
          ...data,
          bonus: data.bonus || [],
          elemento: data.elemento || [],
          tipo: data.tipo || []
        }
      });
    },

    // Atualizar equipamento
    async update(id, data) {
      return await model.update({
        where: { id },
        data
      });
    },

    // Deletar equipamento
    async delete(id) {
      return await model.delete({
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