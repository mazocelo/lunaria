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
    this.forca = data.forca || 10;
    this.destreza = data.destreza || 10;
    this.constituicao = data.constituicao || 10;
    this.inteligencia = data.inteligencia || 10;
    this.agilidade = data.agilidade || 10;
    this.carisma = data.carisma || 10;
    this.sugestao_background = data.sugestao_background || 'guiado';
    this.background = data.background || '';
    this.vantagens = data.vantagens || [];
    this.desvantagens = data.desvantagens || [];
    this.equipamentos = data.equipamentos || [];
    this.xp_atual = data.xp_atual || 0;
    this.xp_proximo_nivel = data.xp_proximo_nivel || 100;
    this.hp_max = data.hp_max || data.hp_maximo || this.calcularHPMaximo();
    this.hp = data.hp_atual ?? data.hp ?? this.hp_max;
    this.mp = data.mp_atual ?? data.mp ?? null;
    this.pontos_atributo_pendentes = data.pontos_atributo_pendentes || 0;
    this.pontos_iniciais = data.pontos_iniciais || 25;
    this.pontos_totais = data.pontos_totais || 0;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }


  /**
   * Valida se o modelo está correto
   * @returns {Object} Resultado da validação
   */
  validate() {
    const errors = [];

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

    // Validar atributos (1-20)
    const atributos = ['forca', 'destreza', 'constituicao', 'inteligencia', 'agilidade', 'carisma'];
    atributos.forEach(atributo => {
      if (this[atributo] < 1 || this[atributo] > 20) {
        errors.push(`${atributo.charAt(0).toUpperCase() + atributo.slice(1)} deve estar entre 1 e 20`);
      }
    });

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
    const hpBase = 10;
    const modificadorConstituicao = this.getModificador('constituicao');
    return hpBase + (modificadorConstituicao * this.nivel);
  }

  /**
   * Converte para objeto plano
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
      xp_atual: this.xp_atual,
      xp_proximo_nivel: this.xp_proximo_nivel,
      hp: this.hp,
      hp_max: this.hp_max,
      mp: this.mp,
      pontos_atributo_pendentes: this.pontos_atributo_pendentes,
      pontos_iniciais: this.pontos_iniciais,
      pontos_totais: this.pontos_totais,
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
      forca: apiData.forca || 10,
      destreza: apiData.destreza || 10,
      constituicao: apiData.constituicao || 10,
      inteligencia: apiData.inteligencia || 10,
      agilidade: apiData.agilidade || 10,
      carisma: apiData.carisma || 10,
      sugestao_background: apiData.sugestao_background,
      background: apiData.background,
      vantagens: apiData.vantagens,
      desvantagens: apiData.desvantagens,
      equipamentos: apiData.equipamentos,
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