/**
 * Modelo de Monstro para RPG usando Prisma
 * Inclui formula de escalamento dinamico por nivel
 */
const Monstro = (prisma) => {
  const model = prisma.monstros;

  const MonstroMethods = {
    // Buscar por ID
    async findById(id) {
      return await model.findUnique({
        where: { id: parseInt(id) }
      });
    },

    // Listar todos
    async findAll() {
      return await model.findMany({
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar por tipo (ex: 'besta', 'demonio')
    async findByTipo(tipo) {
      return await model.findMany({
        where: { tipo: { has: tipo } },
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

    // Buscar por faixa de nivel
    async findByNivelRange(min, max) {
      return await model.findMany({
        where: {
          nivel_min: { lte: max },
          nivel_max: { gte: min }
        },
        orderBy: { nivel_min: 'asc' }
      });
    },

    // Buscar por tema compativel
    async findByTema(tema) {
      return await model.findMany({
        where: { temas: { has: tema } },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar por nome/descricao
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

    // Buscar por elemento
    async findByElemento(elemento) {
      return await model.findMany({
        where: { elemento: { has: elemento } },
        orderBy: { nome: 'asc' }
      });
    },

    /**
     * Seleciona monstros adequados para combate baseado no contexto
     * @param {number} nivel - Nivel medio do grupo de jogadores
     * @param {string[]} temas - Temas da campanha
     * @param {string} dificuldade - facil | media | dificil | letal
     * @returns {Array} Monstros filtrados
     */
    async selecionarParaCombate(nivel, temas = [], dificuldade = 'media') {
      const nivelAjustado = this._ajustarNivelPorDificuldade(nivel, dificuldade);

      // Buscar monstros no range de nivel
      let monstros = await model.findMany({
        where: {
          nivel_min: { lte: nivelAjustado + 1 },
          nivel_max: { gte: Math.max(1, nivelAjustado - 1) }
        },
        orderBy: { nivel_min: 'asc' }
      });

      // Filtrar por temas se disponivel
      if (temas.length > 0 && monstros.length > 3) {
        const temasLower = temas.map(t => t.toLowerCase());
        const comTema = monstros.filter(m =>
          m.temas.some(t => temasLower.includes(t.toLowerCase()))
        );
        // Usar filtrado por tema se houver resultados suficientes
        if (comTema.length >= 2) {
          monstros = comTema;
        }
      }

      return monstros;
    },

    /**
     * Busca monstro por nome similar (para quando a IA sugere um nome)
     * @param {string} nomeSugerido - Nome sugerido pela IA
     * @returns {Object|null} Monstro encontrado ou null
     */
    async buscarPorNomeSimilar(nomeSugerido) {
      // Busca exata primeiro
      let monstro = await model.findFirst({
        where: { nome: { equals: nomeSugerido, mode: 'insensitive' } }
      });
      if (monstro) return monstro;

      // Busca parcial
      const palavras = nomeSugerido.split(' ').filter(p => p.length > 3);
      for (const palavra of palavras) {
        monstro = await model.findFirst({
          where: { nome: { contains: palavra, mode: 'insensitive' } }
        });
        if (monstro) return monstro;
      }

      return null;
    },

    /**
     * Aplica formula de escalamento dinamico
     * @param {Object} monstro - Monstro base do banco
     * @param {number} nivel - Nivel efetivo para escalar
     * @returns {Object} Stats efetivos calculados
     */
    calcularStats(monstro, nivel) {
      const n = Math.max(1, nivel);
      return {
        hp_max: Math.round(monstro.hp_base + (n * monstro.constituicao * 0.5)),
        ataque: Math.round(monstro.ataque_base + Math.floor((monstro.forca - 10) / 2) + Math.floor(n * 0.7)),
        defesa: Math.round(monstro.defesa_base + Math.floor((monstro.agilidade - 10) / 2) + Math.floor(n * 0.4)),
        dano_base: monstro.dano_base,
        xp: monstro.xp_base * n,
        forca: monstro.forca,
        destreza: monstro.destreza,
        inteligencia: monstro.inteligencia,
        constituicao: monstro.constituicao,
        agilidade: monstro.agilidade,
        carisma: monstro.carisma
      };
    },

    // Ajusta nivel baseado na dificuldade
    _ajustarNivelPorDificuldade(nivel, dificuldade) {
      switch (dificuldade) {
        case 'facil': return Math.max(1, nivel - 1);
        case 'media': return nivel;
        case 'dificil': return nivel + 1;
        case 'letal': return nivel + 2;
        default: return nivel;
      }
    },

    // CRUD padrao
    async create(data) {
      return await model.create({
        data: {
          ...data,
          tipo: data.tipo || ['besta'],
          elemento: data.elemento || [],
          temas: data.temas || [],
          habilidades: data.habilidades || []
        }
      });
    },

    async update(id, data) {
      return await model.update({
        where: { id: parseInt(id) },
        data: { ...data, atualizado_em: new Date() }
      });
    },

    async delete(id) {
      return await model.delete({
        where: { id: parseInt(id) }
      });
    },

    async count(where = {}) {
      return await model.count({ where });
    }
  };

  return Object.assign(model, MonstroMethods);
};

export default Monstro;
