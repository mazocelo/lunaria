/**
 * Model para gerenciar usuários
 * @param {PrismaClient} prisma - Cliente Prisma
 */
export default function Usuario(prisma) {
  return {
    /**
     * Criar um novo usuário
     */
    async create(userData) {
      return await prisma.usuarios.create({
        data: userData,
      });
    },

    /**
     * Buscar todos os usuários
     */
    async findAll(options = {}) {
      return await prisma.usuarios.findMany({
        where: { deleted_at: null, ...options.where },
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
        },
        ...options,
      });
    },

    /**
     * Buscar usuário por ID
     */
    async findById(id) {
      return await prisma.usuarios.findFirst({
        where: { id, deleted_at: null },
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          avatar: true,
          bio: true,
          preferencias: true,
          privacidade: true,
          historias: {
            where: { deleted_at: null },
            select: {
              id: true,
              nome: true,
              status: true,
              criada_em: true,
            },
          },
          personagens: {
            where: { deleted_at: null },
            select: {
              id: true,
              nome: true,
              nivel: true,
              classe_id: true,
              raca_id: true,
            },
          },
        },
      });
    },

    /**
     * Buscar usuário por email (para login)
     */
    async findByEmail(email) {
      return await prisma.usuarios.findFirst({
        where: { email, deleted_at: null },
      });
    },

    /**
     * Buscar usuário por email sem senha
     */
    async findByEmailPublic(email) {
      return await prisma.usuarios.findFirst({
        where: { email, deleted_at: null },
        select: {
          id: true,
          nome: true,
          email: true,
        },
      });
    },

    /**
     * Atualizar usuário
     */
    async update(id, userData) {
      return await prisma.usuarios.update({
        where: { id },
        data: userData,
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          avatar: true,
          bio: true,
          preferencias: true,
          privacidade: true,
        },
      });
    },

    /**
     * Soft delete usuário
     */
    async delete(id) {
      return await prisma.usuarios.update({
        where: { id },
        data: { deleted_at: new Date() },
      });
    },

    /**
     * Restaurar usuário soft-deleted
     */
    async restore(id) {
      return await prisma.usuarios.update({
        where: { id, deleted_at: { not: null } },
        data: { deleted_at: null },
      });
    },

    /**
     * Verificar se email já existe
     */
    async emailExists(email, excludeId = null) {
      const where = { email, deleted_at: null };
      if (excludeId) {
        where.NOT = { id: excludeId };
      }

      const count = await prisma.usuarios.count({ where });
      return count > 0;
    },

    /**
     * Contar total de usuários
     */
    async count() {
      return await prisma.usuarios.count({ where: { deleted_at: null } });
    },
  };
} 