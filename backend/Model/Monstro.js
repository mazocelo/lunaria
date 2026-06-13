/**
 * Modelo de Monstro para RPG usando Prisma
 * Inclui formula de escalamento dinamico por nivel
 */
import { getAtributo, getAtributosMap } from '../helpers/atributosHelper.js';

const Monstro = (prisma) => {
  const model = prisma.monstros;

  const includeRels = { raridade_rel: true, categoria_rel: true, atributos_monstro: true };

  const MonstroMethods = {
    // Buscar por ID
    async findById(id) {
      return await model.findUnique({
        where: { id: parseInt(id) },
        include: includeRels,
      });
    },

    // Buscar monstro por nome exato (chave unica [nome, sistema])
    async findByNome(nome, sistema = 'lunaria') {
      return await model.findFirst({
        where: { nome, sistema }
      });
    },

    // Listar todos
    async findAll(sistema = 'lunaria') {
      return await model.findMany({
        where: { sistema },
        include: includeRels,
        orderBy: { nome: 'asc' }
      });
    },

    // Listar monstros com paginação DB-level
    async findPaginated({ limit = 50, offset = 0, tipo, raridade_id, nivel, tema, sistema = 'lunaria' } = {}) {
      const where = { sistema };
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
    async findByTipo(tipo, sistema = 'lunaria') {
      return await model.findMany({
        where: { tipo: { has: tipo }, sistema },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar por raridade (by ID)
    async findByRaridade(raridadeId, sistema = 'lunaria') {
      return await model.findMany({
        where: { raridade_id: raridadeId, sistema },
        include: includeRels,
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar por faixa de nivel
    async findByNivelRange(min, max, sistema = 'lunaria') {
      return await model.findMany({
        where: {
          nivel_min: { lte: max },
          nivel_max: { gte: min },
          sistema
        },
        orderBy: { nivel_min: 'asc' }
      });
    },

    // Buscar por tema compativel (tema = ID inteiro)
    async findByTema(tema, sistema = 'lunaria') {
      return await model.findMany({
        where: { temas: { has: parseInt(tema) }, sistema },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar por nome/descricao
    async search(termo, sistema = 'lunaria') {
      return await model.findMany({
        where: {
          OR: [
            { nome: { contains: termo, mode: 'insensitive' } },
            { descricao: { contains: termo, mode: 'insensitive' } }
          ],
          sistema
        },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar por elemento
    async findByElemento(elemento, sistema = 'lunaria') {
      return await model.findMany({
        where: { elemento: { has: elemento }, sistema },
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar por tamanho (ex: 'grande', 'pequeno')
    async findByTamanho(tamanho, sistema = 'lunaria') {
      return await model.findMany({
        where: { tamanho, sistema },
        include: includeRels,
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar por habitat (ex: 'floresta', 'caverna')
    async findByHabitat(habitat, sistema = 'lunaria') {
      return await model.findMany({
        where: { habitat: { has: habitat }, sistema },
        include: includeRels,
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar por imunidade (ex: 'veneno', 'fogo')
    async findByImunidade(elemento, sistema = 'lunaria') {
      return await model.findMany({
        where: { imunidades: { has: elemento }, sistema },
        include: includeRels,
        orderBy: { nome: 'asc' }
      });
    },

    // Buscar por categoria
    async findByCategoria(categoriaId, sistema = 'lunaria') {
      return await model.findMany({
        where: { categoria_id: categoriaId, sistema },
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
    async selecionarParaCombate(nivel, temas = [], dificuldade = 'media', sistema = 'lunaria') {
      const nivelAjustado = this._ajustarNivelPorDificuldade(nivel, dificuldade);

      // Buscar monstros no range de nivel
      let monstros = await model.findMany({
        where: {
          nivel_min: { lte: nivelAjustado + 1 },
          nivel_max: { gte: Math.max(1, nivelAjustado - 1) },
          sistema
        },
        include: { atributos_monstro: true },
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
     * @param {string} sistema - Sistema de jogo (obrigatorio; ex.: 'lunaria', 'tresdet')
     * @returns {Object|null} Monstro encontrado ou null
     */
    async buscarPorNomeSimilar(nomeSugerido, sistema) {
      if (!sistema) {
        throw new Error('buscarPorNomeSimilar: parametro "sistema" e obrigatorio');
      }
      // Busca exata primeiro
      let monstro = await model.findFirst({
        where: { nome: { equals: nomeSugerido, mode: 'insensitive' }, sistema },
        include: { atributos_monstro: true }
      });
      if (monstro) return monstro;

      // Busca parcial
      const palavras = nomeSugerido.split(' ').filter(p => p.length > 3);
      for (const palavra of palavras) {
        monstro = await model.findFirst({
          where: { nome: { contains: palavra, mode: 'insensitive' }, sistema },
          include: { atributos_monstro: true }
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
      const agilidade = getAtributo(monstro, 'agilidade');
      const constituicao = getAtributo(monstro, 'constituicao');
      const forca = getAtributo(monstro, 'forca');
      const modAgi = Math.floor((agilidade - 10) / 2);
      const modTam = this._getModTamanho(monstro.tamanho);
      const attrMap = getAtributosMap(monstro);
      return {
        hp_max: Math.round(monstro.hp_base + (n * constituicao * 0.5)),
        ataque: Math.round(monstro.ataque_base + Math.floor((forca - 10) / 2) + Math.min(2, Math.floor(n / 6))),
        defesa: Math.round(monstro.defesa_base + modAgi + Math.floor(n * 0.4)),
        armadura: Math.max(0, Math.round(Math.floor(monstro.defesa_base * 0.3) + Math.floor(n * 0.2) + modTam.armadura)),
        esquiva: Math.min(30, Math.max(0, (modAgi * 3) + modTam.esquiva)),
        dano_base: monstro.dano_base,
        xp: monstro.xp_base * n,
        forca: attrMap.forca ?? 10,
        destreza: attrMap.destreza ?? 10,
        inteligencia: attrMap.inteligencia ?? 10,
        constituicao: attrMap.constituicao ?? 10,
        agilidade: attrMap.agilidade ?? 10,
        carisma: attrMap.carisma ?? 10
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

  return Object.assign({ ...model }, MonstroMethods);
};

export default Monstro;
