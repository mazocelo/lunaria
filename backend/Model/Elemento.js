/**
 * Modelo de Elemento - Tabela canonica de referencia
 * Usada para padronizar valores de elemento em equipamentos,
 * monstros, vantagens e desvantagens
 */
const Elemento = (prisma) => {
  const model = prisma.elementos;

  const ElementoMethods = {
    async findAll() {
      return await model.findMany({ orderBy: { ordem: 'asc' } });
    },

    async findById(id) {
      return await model.findUnique({ where: { id: parseInt(id) } });
    },

    async findByNome(nome) {
      return await model.findFirst({
        where: { nome: { equals: nome, mode: 'insensitive' } }
      });
    },

    async search(termo) {
      return await model.findMany({
        where: {
          OR: [
            { nome: { contains: termo, mode: 'insensitive' } },
            { descricao: { contains: termo, mode: 'insensitive' } }
          ]
        },
        orderBy: { ordem: 'asc' }
      });
    },

    /**
     * Valida uma lista de nomes de elementos contra a tabela canonica
     * @param {string[]} nomes - Lista de nomes para validar
     * @returns {{ validos: string[], invalidos: string[] }}
     */
    async validar(nomes) {
      if (!nomes || nomes.length === 0) return { validos: [], invalidos: [] };
      const registros = await model.findMany({
        where: { nome: { in: nomes } },
        select: { nome: true }
      });
      const nomesValidos = registros.map(e => e.nome);
      return {
        validos: nomesValidos,
        invalidos: nomes.filter(n => !nomesValidos.includes(n))
      };
    },

  };

  return Object.assign(model, ElementoMethods);
};

export default Elemento;
