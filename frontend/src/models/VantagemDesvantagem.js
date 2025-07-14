/**
 * Modelo de Vantagem/Desvantagem
 * Representa uma vantagem ou desvantagem no sistema
 */
export class VantagemDesvantagem {
  constructor(data = {}) {
    this.id = data.id || null;
    this.nome = data.nome || '';
    this.descricao = data.descricao || '';
    this.custo = data.custo || 0;
    this.tipo = data.tipo || [];
    this.bonus = data.bonus || {};
    this.restricao = data.restricao || {};
    this.dano_base = data.dano_base || '';
    this.efeito = data.efeito || {};
    this.usar = data.usar || 0;
    this.elemento = data.elemento || [];
    this.nivel = data.nivel || 1;
    this.requisitos = data.requisitos || {};
    this.criada_em = data.criada_em || null;
    this.atualizada_em = data.atualizada_em || null;
  }

  /**
   * Converte o modelo para objeto simples
   * @returns {Object} Objeto com os dados da vantagem/desvantagem
   */
  toObject() {
    return {
      id: this.id,
      nome: this.nome,
      descricao: this.descricao,
      custo: this.custo,
      tipo: this.tipo,
      bonus: this.bonus,
      restricao: this.restricao,
      dano_base: this.dano_base,
      efeito: this.efeito,
      usar: this.usar,
      elemento: this.elemento,
      nivel: this.nivel,
      requisitos: this.requisitos,
      criada_em: this.criada_em,
      atualizada_em: this.atualizada_em
    };
  }

  /**
   * Cria uma instância a partir de dados da API
   * @param {Object} apiData - Dados vindos da API
   * @returns {VantagemDesvantagem} Nova instância de VantagemDesvantagem
   */
  static fromApi(apiData) {
    return new VantagemDesvantagem({
      id: apiData.id,
      nome: apiData.nome,
      descricao: apiData.descricao,
      custo: apiData.custo,
      tipo: apiData.tipo,
      bonus: apiData.bonus,
      restricao: apiData.restricao,
      dano_base: apiData.dano_base,
      efeito: apiData.efeito,
      usar: apiData.usar,
      elemento: apiData.elemento,
      nivel: apiData.nivel,
      requisitos: apiData.requisitos,
      criada_em: apiData.criada_em,
      atualizada_em: apiData.atualizada_em
    });
  }

  /**
   * Valida se os dados da vantagem/desvantagem estão corretos
   * @returns {Object} Objeto com status de validação e erros
   */
  validate() {
    const errors = [];

    if (!this.nome.trim()) {
      errors.push('Nome é obrigatório');
    }

    if (this.nome.length > 100) {
      errors.push('Nome deve ter no máximo 100 caracteres');
    }

    if (this.descricao.length > 1000) {
      errors.push('Descrição deve ter no máximo 1000 caracteres');
    }

    if (typeof this.custo !== 'number') {
      errors.push('Custo deve ser um número');
    }

    if (this.custo < -20 || this.custo > 20) {
      errors.push('Custo deve estar entre -20 e 20');
    }

    if (this.nivel < 1 || this.nivel > 10) {
      errors.push('Nível deve estar entre 1 e 10');
    }

    if (this.usar < 0 || this.usar > 10) {
      errors.push('Usar deve estar entre 0 e 10');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Verifica se é uma vantagem
   * @returns {boolean}
   */
  isVantagem() {
    return this.custo > 0;
  }

  /**
   * Verifica se é uma desvantagem
   * @returns {boolean}
   */
  isDesvantagem() {
    return this.custo < 0;
  }

  /**
   * Obtém o tipo de vantagem/desvantagem
   * @returns {string}
   */
  getTipo() {
    if (this.isVantagem()) return 'vantagem';
    if (this.isDesvantagem()) return 'desvantagem';
    return 'neutro';
  }
} 