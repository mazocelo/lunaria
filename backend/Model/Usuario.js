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
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          // Excluir senha por segurança
        },
        ...options,
      });
    },

    /**
     * Buscar usuário por ID
     */
    async findById(id) {
      return await prisma.usuarios.findUnique({
        where: { id },
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          historias: {
            select: {
              id: true,
              nome: true,
              status: true,
              criada_em: true,
            },
          },
          personagens: {
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
      return await prisma.usuarios.findUnique({
        where: { email },
      });
    },

    /**
     * Buscar usuário por email sem senha
     */
    async findByEmailPublic(email) {
      return await prisma.usuarios.findUnique({
        where: { email },
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
        },
      });
    },

    /**
     * Deletar usuário
     */
    async delete(id) {
      return await prisma.usuarios.delete({
        where: { id },
      });
    },

    /**
     * Verificar se email já existe
     */
    async emailExists(email, excludeId = null) {
      const where = { email };
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
      return await prisma.usuarios.count();
    },
  };
} 