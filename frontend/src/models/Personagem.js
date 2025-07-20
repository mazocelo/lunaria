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
    this.nivel = data.nivel || 1;
    this.hp = data.hp || 100;
    this.hp_maximo = data.hp_maximo || 100;
    this.forca = data.forca 
    this.destreza = data.destreza 
    this.constituicao = data.constituicao 
    this.inteligencia = data.inteligencia 
    this.agilidade = data.agilidade 
    this.carisma = data.carisma 
    this.sugestao_background = data.sugestao_background || 'guiado';
    this.background = data.background || '';
    this.vantagens = data.vantagens || [];
    this.desvantagens = data.desvantagens || [];
    this.equipamentos = data.equipamentos || '';
    this.historia_id = data.historia_id || null;
    this.pontos_iniciais = data.pontos_iniciais || 25;
    this.pontos_totais = data.pontos_totais || 0;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  /**
   * Getter para classe (compatibilidade)
   * @returns {string} ID da classe
   */
  get classe() {
    return this.classe_id;
  }

  /**
   * Getter para raca (compatibilidade)
   * @returns {string} ID da raça
   */
  get raca() {
    return this.raca_id;
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

    if (this.hp < 0) {
      errors.push('HP não pode ser negativo');
    }

    if (this.hp > this.hp_maximo) {
      errors.push('HP não pode ser maior que HP máximo');
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
   * Calcula a classe de armadura (CA)
   * @returns {number} Classe de armadura
   */
  getClasseArmadura() {
    return 10 + this.getModificador('destreza');
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
      nivel: this.nivel,
      hp: this.hp,
      hp_maximo: this.hp_maximo,
      forca: this.forca,
      destreza: this.destreza,
      constituicao: this.constituicao,
      inteligencia: this.inteligencia,
      agilidade: this.agilidade,
      carisma: this.carisma,
      sugestao_background: this.sugestao_background,
      background: this.background,
      atributos: this.atributos,
      vantagens: this.vantagens,
      desvantagens: this.desvantagens,
      equipamentos: this.equipamentos,
      historia_id: this.historia_id,
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
      nivel: apiData.nivel,
      hp: apiData.hp,
      hp_maximo: apiData.hp_maximo,
      forca: apiData.forca || 10,
      destreza: apiData.destreza || 10,
      constituicao: apiData.constituicao || 10,
      inteligencia: apiData.inteligencia || 10,
      agilidade: apiData.agilidade || 10,
      carisma: apiData.carisma || 10,
      sugestao_background: apiData.sugestao_background,
      background: apiData.background,
      atributos: apiData.atributos || {},
      vantagens: apiData.vantagens,
      desvantagens: apiData.desvantagens,
      equipamentos: apiData.equipamentos,
      historia_id: apiData.historia_id,
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