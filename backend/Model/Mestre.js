/**
 * Modelo de Mestre (Game Master) customizado para RPG usando Prisma
 */
const Mestre = (prisma) => {
  const model = prisma.mestres;

  const MestreMethods = {
    async findAll() {
      return await model.findMany({
        orderBy: { nome: 'asc' }
      });
    },

    async findById(id) {
      return await model.findUnique({
        where: { id }
      });
    },

    async findByUsuario(id_usuario) {
      return await model.findMany({
        where: { id_usuario: parseInt(id_usuario) },
        orderBy: { criado_em: 'desc' }
      });
    },

    async createMestre(data) {
      return await model.create({
        data: {
          ...data,
          criado_em: new Date(),
          atualizado_em: new Date()
        }
      });
    },

    async updateMestre(id, data) {
      return await model.update({
        where: { id },
        data: {
          ...data,
          atualizado_em: new Date()
        }
      });
    },

    // Soft delete
    async deleteMestre(id) {
      return await model.update({
        where: { id },
        data: { deleted_at: new Date() }
      });
    },

    // Restaurar soft-deleted
    async restoreMestre(id) {
      return await prisma.mestres.update({
        where: { id, deleted_at: { not: null } },
        data: { deleted_at: null }
      });
    }
  };

  return Object.assign(model, MestreMethods);
};

export default Mestre;
