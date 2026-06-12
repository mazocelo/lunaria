/**
 * Modelo de Mestre (Game Master) customizado para RPG usando Prisma
 */
const Mestre = (prisma) => {
  const model = prisma.mestres;

  const MestreMethods = {
    async findAll() {
      return await model.findMany({
        where: { deleted_at: null },
        orderBy: { nome: 'asc' }
      });
    },

    async findById(id) {
      return await model.findFirst({
        where: { id, deleted_at: null }
      });
    },

    async findByUsuario(id_usuario, { limit, offset = 0 } = {}) {
      const where = { id_usuario: parseInt(id_usuario, 10), deleted_at: null };
      const query = { where, orderBy: { criado_em: 'desc' } };
      if (limit !== undefined) {
        query.take = limit;
        query.skip = offset;
      }
      const [mestres, total] = await Promise.all([
        model.findMany(query),
        model.count({ where })
      ]);
      return { data: mestres, total };
    },

    async createMestre(data) {
      return await model.create({
        data: {
          nome: data.nome,
          descricao: data.descricao,
          personalidade: data.personalidade,
          tags: data.tags ?? [],
          modelo: data.modelo,
          temperatura: data.temperatura,
          max_tokens: data.max_tokens,
          tom_narrativo: data.tom_narrativo,
          regras_especiais: data.regras_especiais,
          imagem: data.imagem,
          voice_id: data.voice_id,
          voice_provider: data.voice_provider,
          id_usuario: data.id_usuario,
          criado_em: new Date(),
          atualizado_em: new Date()
        }
      });
    },

    async updateMestre(id, data) {
      return await model.update({
        where: { id },
        data: {
          ...(data.nome !== undefined && { nome: data.nome }),
          ...(data.descricao !== undefined && { descricao: data.descricao }),
          ...(data.personalidade !== undefined && { personalidade: data.personalidade }),
          ...(data.tags !== undefined && { tags: data.tags }),
          ...(data.modelo !== undefined && { modelo: data.modelo }),
          ...(data.temperatura !== undefined && { temperatura: data.temperatura }),
          ...(data.max_tokens !== undefined && { max_tokens: data.max_tokens }),
          ...(data.tom_narrativo !== undefined && { tom_narrativo: data.tom_narrativo }),
          ...(data.regras_especiais !== undefined && { regras_especiais: data.regras_especiais }),
          ...(data.imagem !== undefined && { imagem: data.imagem }),
          ...(data.voice_id !== undefined && { voice_id: data.voice_id }),
          ...(data.voice_provider !== undefined && { voice_provider: data.voice_provider }),
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
      const restored = await prisma.mestres.updateMany({
        where: { id, deleted_at: { not: null } },
        data: { deleted_at: null }
      });

      if (!restored.count) {
        return null;
      }

      return await model.findUnique({
        where: { id }
      });
    }
  };

  return Object.assign({ ...model }, MestreMethods);
};

export default Mestre;
