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
          personagem_equipamento: {
            include: {
              equipamento: true
            }
          }
        }
      });
    },

    // Buscar personagens por nível
    async findByNivel(nivel) {
      return await model.findMany({
        where: { nivel },
        include: {
          classes: true,
          racas: true
        },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar personagens por classe
    async findByClasse(classe_id) {
      return await model.findMany({
        where: { classe_id },
        include: {
          classes: true,
          racas: true
        },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar personagens por raça
    async findByRaca(raca_id) {
      return await model.findMany({
        where: { raca_id },
        include: {
          classes: true,
          racas: true
        },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar personagens por nome
    async search(termo) {
      return await model.findMany({
        where: {
          OR: [
            { nome: { contains: termo, mode: 'insensitive' } },
            { background: { contains: termo, mode: 'insensitive' } }
          ]
        },
        include: {
          classes: true,
          racas: true
        },
        orderBy: { nome: 'asc' }
      });
    },

    // Criar personagem
    async create(data) {
      return await model.create({
        data: {
          ...data,
          criado_em: new Date(),
          atualizado_em: new Date()
        }
      });
    },

    // Atualizar personagem
    async update(id, data) {
      return await model.update({
        where: { id },
        data: {
          ...data,
          atualizado_em: new Date()
        }
      });
    },

    // Deletar personagem
    async delete(id) {
      return await model.delete({
        where: { id }
      });
    },

    // Listar todos os personagens
    async findAll() {
      return await model.findMany({
        include: {
          classes: true,
          racas: true
        },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar por ID
    async findById(id) {
      return await model.findUnique({
        where: { id }
      });
    },

    // Contar personagens
    async count(where = {}) {
      return await prisma.personagem.count({ where });
    }
  };

  // Retornar o modelo com métodos customizados
  return Object.assign(model, PersonagemMethods);
};

export default Personagem; 