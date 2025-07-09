/**
 * Modelo de dados para Personagem
 * Responsável pela estrutura e validação dos dados
 */
export class Personagem {
  constructor(data = {}) {
    this.id = data.id || null;
    this.nome = data.nome || '';
    this.classe = data.classe || 'Aventureiro';
    this.raca = data.raca || 'Humano';
    this.nivel = data.nivel || 1;
    this.hp = data.hp || 100;
    this.hp_maximo = data.hp_maximo || 100;
    this.forca = data.forca || 10;
    this.destreza = data.destreza || 10;
    this.constituicao = data.constituicao || 10;
    this.inteligencia = data.inteligencia || 10;
    this.sabedoria = data.sabedoria || 10;
    this.carisma = data.carisma || 10;
    this.historia_id = data.historia_id || null;
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

    if (this.hp < 0) {
      errors.push('HP não pode ser negativo');
    }

    if (this.hp > this.hp_maximo) {
      errors.push('HP não pode ser maior que HP máximo');
    }

    // Validar atributos (1-20)
    const atributos = ['forca', 'destreza', 'constituicao', 'inteligencia', 'sabedoria', 'carisma'];
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
      classe: this.classe,
      raca: this.raca,
      nivel: this.nivel,
      hp: this.hp,
      hp_maximo: this.hp_maximo,
      forca: this.forca,
      destreza: this.destreza,
      constituicao: this.constituicao,
      inteligencia: this.inteligencia,
      sabedoria: this.sabedoria,
      carisma: this.carisma,
      historia_id: this.historia_id,
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
      classe: apiData.classe,
      raca: apiData.raca,
      nivel: apiData.nivel,
      hp: apiData.hp,
      hp_maximo: apiData.hp_maximo,
      forca: apiData.forca,
      destreza: apiData.destreza,
      constituicao: apiData.constituicao,
      inteligencia: apiData.inteligencia,
      sabedoria: apiData.sabedoria,
      carisma: apiData.carisma,
      historia_id: apiData.historia_id,
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