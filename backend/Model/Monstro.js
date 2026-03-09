/**
 * Modelo de Monstro para RPG usando Prisma
 * Inclui formula de escalamento dinamico por nivel
 */
const Monstro = (prisma) => {
  const model = prisma.monstros;

  const includeRels = { raridade_rel: true, categoria_rel: true };

  const MonstroMethods = {
    // Buscar por ID
    async findById(id) {
      return await model.findUnique({
        where: { id: parseInt(id) },
        include: includeRels,
      });
    },

    // Listar todos
    async findAll() {
      return await model.findMany({
        include: includeRels,
        orderBy: { nome: 'asc' }
      });
    },

    // Listar monstros com paginação DB-level
    async findPaginated({ limit = 50, offset = 0, tipo, raridade_id, nivel, tema } = {}) {
      const where = {};
      if (tipo) where.tipo = { has: tipo };
      if (raridade_id) where.raridade_id = parseInt(raridade_id);
      if (nivel) {
        const n = parseInt(nivel);
        where.nivel_min = { lte: n };
        where.nivel_max = { gte: n };
      }
      if (tema) where.temas = { has: parseInt(tema) };
      const [data, total] = await Promise.all([
        model.findMany({ where, include: includeRels, orderBy: { nome: 'asc' }, take: limit, skip: offset }),
        model.count({ where })
      ]);
      return { data, total };
    },

    // Buscar por tipo (ex: 'besta', 'demonio')
    async findByTipo(tipo) {
      return await model.findMany({
        where: { tipo: { has: tipo } },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar por raridade (by ID)
    async findByRaridade(raridadeId) {
      return await model.findMany({
        where: { raridade_id: raridadeId },
        include: includeRels,
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

    // Buscar por tema compativel (tema = ID inteiro)
    async findByTema(tema) {
      return await model.findMany({
        where: { temas: { has: parseInt(tema) } },
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

    // Buscar por tamanho (ex: 'grande', 'pequeno')
    async findByTamanho(tamanho) {
      return await model.findMany({
        where: { tamanho },
        include: includeRels,
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar por habitat (ex: 'floresta', 'caverna')
    async findByHabitat(habitat) {
      return await model.findMany({
        where: { habitat: { has: habitat } },
        include: includeRels,
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar por imunidade (ex: 'veneno', 'fogo')
    async findByImunidade(elemento) {
      return await model.findMany({
        where: { imunidades: { has: elemento } },
        include: includeRels,
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar por categoria
    async findByCategoria(categoriaId) {
      return await model.findMany({
        where: { categoria_id: categoriaId },
        include: includeRels,
        orderBy: { nome: 'asc' }
      });
    },

    /**
     * Seleciona monstros adequados para combate baseado no contexto
     * @param {number} nivel - Nivel medio do grupo de jogadores
     * @param {(number|string)[]} temas - Temas da campanha (IDs ou nomes)
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
        // Resolver nomes para IDs se necessário
        let temasIds = temas.map(t => parseInt(t)).filter(n => !isNaN(n));
        if (temasIds.length === 0) {
          // Temas vieram como nomes — resolver via DB
          const temasDb = await prisma.temas.findMany({
            where: { nome: { in: temas.map(t => String(t)), mode: 'insensitive' } }
          });
          temasIds = temasDb.map(t => t.id);
        }

        if (temasIds.length > 0) {
          const comTema = monstros.filter(m =>
            m.temas.some(t => temasIds.includes(t))
          );
          if (comTema.length >= 2) {
            monstros = comTema;
          }
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
      const modAgi = Math.floor(((monstro.agilidade || 10) - 10) / 2);
      const modTam = this._getModTamanho(monstro.tamanho);
      return {
        hp_max: Math.round(monstro.hp_base + (n * monstro.constituicao * 0.5)),
        ataque: Math.round(monstro.ataque_base + Math.floor((monstro.forca - 10) / 2) + Math.floor(n * 0.7)),
        defesa: Math.round(monstro.defesa_base + modAgi + Math.floor(n * 0.4)),
        armadura: Math.max(0, Math.round(Math.floor(monstro.defesa_base * 0.3) + Math.floor(n * 0.2) + modTam.armadura)),
        esquiva: Math.min(30, Math.max(0, (modAgi * 3) + modTam.esquiva)),
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

    _getModTamanho(tamanho) {
      const mods = {
        minusculo:    { armadura: -2, esquiva: 10 },
        pequeno:      { armadura: -1, esquiva: 5 },
        medio:        { armadura: 0,  esquiva: 0 },
        grande:       { armadura: 3,  esquiva: -5 },
        enorme:       { armadura: 5,  esquiva: -10 },
        gargantuesco: { armadura: 7,  esquiva: -13 },
        colossal:     { armadura: 8,  esquiva: -15 },
      };
      return mods[tamanho] || mods.medio;
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
          habilidades: data.habilidades || [],
          tamanho: data.tamanho || 'medio',
          habitat: data.habitat || [],
          imunidades: data.imunidades || [],
          resistencias: data.resistencias || {},
          velocidade: data.velocidade || { terrestre: 30 }
        },
        include: includeRels
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

  };

  return Object.assign(model, MonstroMethods);
};

export default Monstro;
