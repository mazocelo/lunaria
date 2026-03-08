/**
 * Modelo de Personagem para RPG usando Prisma
 */
const Personagem = (prisma) => {
  const model = prisma.personagens;

  // Métodos customizados
  const PersonagemMethods = {
    // Buscar personagem com relacionamentos
    async findByIdWithRelations(id) {
      return await model.findUnique({
        where: { id },
        include: {
          classes: true,
          racas: true,
          personagem_desvantagem: true,
          personagem_equipamento: true
        }
      });
    },

    // Criar personagem
    async createPersonagem(data) {
      return await model.create({
        data: {
          ...data
        }
      });
    },

    // Atualizar personagem
    async updatePersonagem(id, data) {
      // Separar relacionamentos de campos diretos
      const { classes, racas, ...camposDiretos } = data;
      
      const updateData = { ...camposDiretos };
      
      // Se tiver relacionamentos, adicionar
      if (classes) updateData.classes = classes;
      if (racas) updateData.racas = racas;
      
      return await model.update({
        where: { id },
        data: updateData
      });
    },

    // Soft delete personagem
    async deletePersonagem(id) {
      return await model.update({
        where: { id },
        data: { deleted_at: new Date() }
      });
    },

    // Restaurar personagem soft-deleted
    async restorePersonagem(id) {
      return await prisma.personagens.update({
        where: { id, deleted_at: { not: null } },
        data: { deleted_at: null }
      });
    },

    // Listar todos os personagens
    async findAllPersonagens() {
      return await model.findMany({
        where: { deleted_at: null },
        include: {
          classes: true,
          racas: true
        },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar por ID
    async findPersonagemById(id) {
      return await model.findFirst({
        where: { id, deleted_at: null }
      });
    },

    // Alias para findById (compatibilidade com middleware)
    async findById(id) {
      return await this.findPersonagemById(id);
    },

    // Contar personagens
    async countPersonagens(where = {}) {
      return await prisma.personagens.count({ where });
    },

    // Métodos para gerenciar vínculos com vantagens
    async adicionarVantagem(personagem_id, vantagem_id) {
      return await prisma.personagem_vantagem.create({
        data: {
          personagem_id: parseInt(personagem_id),
          desvantagem_id: parseInt(vantagem_id) // Usa desvantagem_id para vantagens
        }
      });
    },

    async removerVantagem(personagem_id, vantagem_id) {
      return await prisma.personagem_vantagem.deleteMany({
        where: {
          personagem_id: parseInt(personagem_id),
          desvantagem_id: parseInt(vantagem_id)
        }
      });
    },

    async listarVantagens(personagem_id) {
      const vinculos = await prisma.personagem_vantagem.findMany({
        where: { personagem_id: parseInt(personagem_id) }
      });

      if (vinculos.length === 0) return [];

      // Batch query: 1 query instead of N
      const ids = vinculos.map(v => v.desvantagem_id);
      const vantagens = await prisma.vantagens.findMany({
        where: { id: { in: ids } }
      });

      return vantagens.map(vantagem => ({ vantagem }));
    },

    // Métodos para gerenciar vínculos com desvantagens
    async adicionarDesvantagem(personagem_id, desvantagem_id) {
      return await prisma.personagem_desvantagem.create({
        data: {
          personagem_id: parseInt(personagem_id),
          habilidade_id: parseInt(desvantagem_id)
        }
      });
    },

    async removerDesvantagem(personagem_id, desvantagem_id) {
      return await prisma.personagem_desvantagem.deleteMany({
        where: {
          personagem_id: parseInt(personagem_id),
          habilidade_id: parseInt(desvantagem_id)
        }
      });
    },

    async listarDesvantagens(personagem_id) {
      const vinculos = await prisma.personagem_desvantagem.findMany({
        where: { personagem_id: parseInt(personagem_id) }
      });

      if (vinculos.length === 0) return [];

      // Batch query: 1 query instead of N
      const ids = vinculos.map(v => v.habilidade_id);
      const desvantagens = await prisma.desvantagens.findMany({
        where: { id: { in: ids } }
      });

      return desvantagens.map(desvantagem => ({ desvantagem }));
    },

    // Métodos para gerenciar vínculos com equipamentos
    async adicionarEquipamento(personagem_id, equipamento_id) {
      return await prisma.personagem_equipamento.create({
        data: {
          personagem_id: parseInt(personagem_id),
          equipamento_id: parseInt(equipamento_id)
        }
      });
    },

    async removerEquipamento(personagem_id, equipamento_id) {
      return await prisma.personagem_equipamento.delete({
        where: {
          personagem_id_equipamento_id: {
            personagem_id: parseInt(personagem_id),
            equipamento_id: parseInt(equipamento_id)
          }
        }
      });
    },

    async listarEquipamentos(personagem_id) {
      const vinculos = await prisma.personagem_equipamento.findMany({
        where: { personagem_id: parseInt(personagem_id) }
      });

      if (vinculos.length === 0) return [];

      // Batch query: 1 query instead of N
      const ids = vinculos.map(v => v.equipamento_id);
      const equipamentos = await prisma.equipamentos.findMany({
        where: { id: { in: ids } }
      });

      return equipamentos.map(equipamento => ({ equipamento }));
    },

    // Métodos para gerenciar vínculos com histórias
    async vincularHistoria(personagem_id, historia_id, papel = null) {
      return await prisma.historias_personagens.create({
        data: {
          personagem_id: parseInt(personagem_id),
          historia_id: parseInt(historia_id),
          papel: papel
        }
      });
    },

    async desvincularHistoria(personagem_id, historia_id) {
      return await prisma.historias_personagens.deleteMany({
        where: {
          historia_id: parseInt(historia_id),
          personagem_id: parseInt(personagem_id)
        }
      });
    },

    async listarHistoriasPersonagem(personagem_id) {
      return await prisma.historias_personagens.findMany({
        where: { personagem_id: parseInt(personagem_id) },
        include: {
          historias: true
        }
      });
    },

    async listarPersonagensHistoriaByUsuario(historia_id, usuario_id) {
      return await prisma.historias_personagens.findMany({
        where: { historia_id: parseInt(historia_id), personagens: { id_usuario: parseInt(usuario_id) } },
        include: {
          personagens: {
            include: {
              classes: true,
              racas: true
            }
          }
        }
      });
    }
  };

  // Retornar o modelo com métodos customizados
  return Object.assign(model, PersonagemMethods);
};

export default Personagem; 