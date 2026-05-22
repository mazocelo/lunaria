import { calcularHPMaximo as _calcHPMax } from '../utils/rpgHelpers.js';

/**
 * Modelo de dados para Personagem
 * Responsável pela estrutura e validação dos dados
 */
export class Personagem {
  constructor(data = {}) {
    this.id = data.id || null;
    this.nome = data.nome || '';
    this.classe_id = data.classe_id || null;
    this.raca_id = data.raca_id || null;
    this.classe = data.classe || null; // Nome da classe (string)
    this.raca = data.raca || null; // Nome da raça (string)
    this.historia_nome = data.historia_nome || null; // Nome da primeira história (compatibilidade)
    this.historia_id = data.historia_id || null; // ID da primeira história (compatibilidade)
    this.historias = data.historias || []; // Array de histórias vinculadas
    this.racas = data.racas || null; // Objeto completo da raça (com bonus)
    this.classes = data.classes || null; // Objeto completo da classe (com bonus)
    this.imagem = data.imagem || null;
    this.nivel = data.nivel || 1;
    this.sistema = data.sistema || 'lunaria';
    this.atributos = data.atributos || {};
    // JSON especifico do sistema (D&D 5e: classeKey, metodo, skillProficiencies).
    this.stats_sistema = data.stats_sistema || null;
    // Atributos individuais: prioriza o mapa data.atributos (fonte do backend),
    // fallback para campos escalares (usados na criacao Lunaria).
    // NAO cair para 10 quando nao ha fonte real: falhar explicito > mascarar
    // atributo ausente e gravar 10/10/10 silenciosamente.
    this.forca = data.atributos?.forca ?? data.forca ?? null;
    this.destreza = data.atributos?.destreza ?? data.destreza ?? null;
    this.constituicao = data.atributos?.constituicao ?? data.constituicao ?? null;
    this.inteligencia = data.atributos?.inteligencia ?? data.inteligencia ?? null;
    this.agilidade = data.atributos?.agilidade ?? data.agilidade ?? null;
    this.carisma = data.atributos?.carisma ?? data.carisma ?? null;
    this.sugestao_background = data.sugestao_background || 'guiado';
    this.background = data.background || '';
    this.vantagens = data.vantagens || [];
    this.desvantagens = data.desvantagens || [];
    this.equipamentos = data.equipamentos || [];
    this.habilidadesClasse = data.habilidadesClasse || [];
    this.magias = data.magias || [];
    this.xp_atual = data.xp_atual || 0;
    this.xp_proximo_nivel = data.xp_proximo_nivel || 100;
    this.hp_max = data.hp_max || data.hp_maximo || this.calcularHPMaximo();
    this.hp = data.hp_atual ?? data.hp ?? this.hp_max;
    this.mp = data.mp_atual ?? data.mp ?? null;
    this.pontos_atributo_pendentes = data.pontos_atributo_pendentes || 0;
    this.pontos_iniciais = data.pontos_iniciais || 0;
    this.pontos_totais = data.pontos_totais || 0;
    this.voice_id = data.voice_id || null;
    this.voice_provider = data.voice_provider || null;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }


  /**
   * Valida se o modelo está correto
   * @returns {Object} Resultado da validação
   */
  validate(options = {}) {
    const errors = [];
    const { context = 'default' } = options;

    if (!this.nome || this.nome.trim().length === 0) {
      errors.push('Nome do personagem é obrigatório');
    }

    if (this.nome && this.nome.trim().length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres');
    }

    if (this.nivel < 1) {
      errors.push('Nível deve ser pelo menos 1');
    }

    if (this.nivel > 20) {
      errors.push('Nível máximo é 20');
    }

    // Validar atributos (1-20) — deve receber valores BASE (sem bônus)
    const atributos = ['forca', 'destreza', 'constituicao', 'inteligencia', 'agilidade', 'carisma'];
    const atributosNumericos = atributos.map((atributo) => ({
      atributo,
      valor: Number(this[atributo]),
    }));

    if (context === 'criacao') {
      if (!this.raca_id) {
        errors.push('Selecione uma raça para o personagem');
      }
      if (!this.classe_id) {
        errors.push('Selecione uma classe para o personagem');
      }

      atributosNumericos.forEach(({ atributo, valor }) => {
        if (!Number.isFinite(valor) || valor < 5 || valor > 16) {
          errors.push(`${atributo.charAt(0).toUpperCase() + atributo.slice(1)} deve estar entre 5 e 16 na criacao`);
        }
      });

      const somaAtributos = atributosNumericos.reduce(
        (sum, item) => sum + (Number.isFinite(item.valor) ? item.valor : 0),
        0
      );

      if (somaAtributos !== 60) {
        errors.push('A distribuicao inicial deve somar 60 pontos');
      }
    } else {
      // Fora da criacao os atributos nao sao editaveis (PUT nao os altera) e
      // podem estar ausentes quando a ficha foi carregada via mapa `atributos`.
      // So validar a faixa quando ha um valor escalar real — nunca tratar
      // ausencia (null/undefined) como erro nem mascarar com default.
      atributos.forEach((atributo) => {
        const bruto = this[atributo];
        if (bruto === null || bruto === undefined) return;
        const valor = Number(bruto);
        if (!Number.isFinite(valor) || valor < 1 || valor > 20) {
          errors.push(`${atributo.charAt(0).toUpperCase() + atributo.slice(1)} deve estar entre 1 e 20`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calcula o modificador de um atributo
   * @param {string} atributo - Nome do atributo
   * @returns {number} Modificador
   */
  getModificador(atributo) {
    const valor = this[atributo] || 10;
    return Math.floor((valor - 10) / 2);
  }

  /**
   * Calcula taxa de esquiva base (%)
   * Formula: (ModAGI + floor(ModDEX/2)) * 5, cap 0-50
   * @returns {number} Taxa de esquiva em porcentagem
   */
  getEsquiva() {
    const modAgi = this.getModificador('agilidade');
    const modDex = this.getModificador('destreza');
    return Math.min(50, Math.max(0, (modAgi + Math.floor(modDex / 2)) * 5));
  }

  /**
   * Calcula pontos de vida máximos
   * @returns {number} HP máximo
   */
  calcularHPMaximo() {
    return _calcHPMax(this);
  }

  /**
   * Payload para o PUT /personagens/:id.
   * O PUT nao altera mais atributos (mudam so na criacao e em distribuir-pontos),
   * entao este payload NAO inclui os campos escalares de atributo nem o mapa
   * `atributos` — apenas os campos que o PUT realmente atualiza. Enviar atributo
   * aqui seria uma porta de corrupcao da ficha.
   * @returns {Object} Campos editaveis via PUT
   */
  toUpdatePayload() {
    return {
      nome: this.nome,
      imagem: this.imagem,
      background: this.background,
      sugestao_background: this.sugestao_background,
      historias: this.historias,
      vantagens: this.vantagens,
      desvantagens: this.desvantagens,
      equipamentos: this.equipamentos,
    };
  }

  /**
   * Converte para objeto plano. Usado como payload de CRIACAO (POST), que
   * aceita os atributos escalares. NAO usar para o PUT — use toUpdatePayload().
   * @returns {Object} Dados do personagem
   */
  toJSON() {
    return {
      id: this.id,
      nome: this.nome,
      classe_id: this.classe_id,
      raca_id: this.raca_id,
      classe: this.classe,
      raca: this.raca,
      historia_nome: this.historia_nome,
      historia_id: this.historia_id,
      historias: this.historias,
      racas: this.racas,
      classes: this.classes,
      imagem: this.imagem,
      nivel: this.nivel,
      sistema: this.sistema,
      atributos: this.atributos,
      stats_sistema: this.stats_sistema,
      forca: this.forca,
      destreza: this.destreza,
      constituicao: this.constituicao,
      inteligencia: this.inteligencia,
      agilidade: this.agilidade,
      carisma: this.carisma,
      sugestao_background: this.sugestao_background,
      background: this.background,
      vantagens: this.vantagens,
      desvantagens: this.desvantagens,
      equipamentos: this.equipamentos,
      habilidadesClasse: this.habilidadesClasse,
      magias: this.magias,
      xp_atual: this.xp_atual,
      xp_proximo_nivel: this.xp_proximo_nivel,
      hp: this.hp,
      hp_max: this.hp_max,
      mp: this.mp,
      pontos_atributo_pendentes: this.pontos_atributo_pendentes,
      pontos_iniciais: this.pontos_iniciais,
      pontos_totais: this.pontos_totais,
      voice_id: this.voice_id,
      voice_provider: this.voice_provider,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  /**
   * Cria uma nova instância a partir de dados da API
   * @param {Object} apiData - Dados da API
   * @returns {Personagem} Nova instância
   */
  static fromAPI(apiData) {
    return new Personagem({
      id: apiData.id,
      nome: apiData.nome,
      classe_id: apiData.classe_id,
      raca_id: apiData.raca_id,
      classe: apiData.classe, // Nome da classe
      raca: apiData.raca, // Nome da raça
      historia_nome: apiData.historia_nome, // Nome da primeira história (compatibilidade)
      historia_id: apiData.historia_id, // ID da primeira história (compatibilidade)
      historias: apiData.historias || [], // Array de histórias vinculadas
      racas: apiData.racas || null,
      classes: apiData.classes || null,
      imagem: apiData.imagem || null,
      nivel: apiData.nivel,
      sistema: apiData.sistema || 'lunaria',
      atributos: apiData.atributos || {},
      stats_sistema: apiData.stats_sistema || null,
      forca: apiData.forca,
      destreza: apiData.destreza,
      constituicao: apiData.constituicao,
      inteligencia: apiData.inteligencia,
      agilidade: apiData.agilidade,
      carisma: apiData.carisma,
      sugestao_background: apiData.sugestao_background,
      background: apiData.background,
      vantagens: apiData.vantagens,
      desvantagens: apiData.desvantagens,
      equipamentos: apiData.equipamentos,
      habilidadesClasse: apiData.habilidadesClasse,
      magias: apiData.magias,
      xp_atual: apiData.xp_atual || 0,
      xp_proximo_nivel: apiData.xp_proximo_nivel || 100,
      hp_max: apiData.hp_max || apiData.hp_maximo,
      hp_atual: apiData.hp_atual,
      hp: apiData.hp,
      mp_atual: apiData.mp_atual,
      mp: apiData.mp,
      pontos_atributo_pendentes: apiData.pontos_atributo_pendentes || 0,
      pontos_iniciais: apiData.pontos_iniciais,
      pontos_totais: apiData.pontos_totais,
      voice_id: apiData.voice_id,
      voice_provider: apiData.voice_provider,
      created_at: apiData.created_at,
      updated_at: apiData.updated_at
    });
  }

  /**
   * Cria uma cópia do modelo
   * @returns {Personagem} Cópia do modelo
   */
  clone() {
    return new Personagem(this.toJSON());
  }

  /**
   * Atualiza os dados do modelo
   * @param {Object} updates - Dados para atualizar
   */
  update(updates) {
    Object.assign(this, updates);
    this.updated_at = new Date();
  }
} 
