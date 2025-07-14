/**
 * Modelo de Classe
 * Representa uma classe no sistema
 */
export class Classe {
  constructor(data = {}) {
    this.id = data.id || null;
    this.nome = data.nome || '';
    this.descricao = data.descricao || '';
    this.custo = data.custo || 0;
    this.atributos_bonus = data.atributos_bonus || {};
    this.vantagens_iniciais = data.vantagens_iniciais || [];
    this.desvantagens_iniciais = data.desvantagens_iniciais || [];
    this.habilidades_especiais = data.habilidades_especiais || [];
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
  }

  /**
   * Converte o modelo para objeto simples
   * @returns {Object} Objeto com os dados da classe
   */
  toObject() {
    return {
      id: this.id,
      nome: this.nome,
      descricao: this.descricao,
      custo: this.custo,
      atributos_bonus: this.atributos_bonus,
      vantagens_iniciais: this.vantagens_iniciais,
      desvantagens_iniciais: this.desvantagens_iniciais,
      habilidades_especiais: this.habilidades_especiais,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  /**
   * Cria uma instância a partir de dados da API
   * @param {Object} apiData - Dados vindos da API
   * @returns {Classe} Nova instância de Classe
   */
  static fromApi(apiData) {
    return new Classe({
      id: apiData.id,
      nome: apiData.nome,
      descricao: apiData.descricao,
      custo: apiData.custo,
      atributos_bonus: apiData.atributos_bonus,
      vantagens_iniciais: apiData.vantagens_iniciais,
      desvantagens_iniciais: apiData.desvantagens_iniciais,
      habilidades_especiais: apiData.habilidades_especiais,
      created_at: apiData.created_at,
      updated_at: apiData.updated_at
    });
  }

  /**
   * Valida se os dados da classe estão corretos
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

    if (this.custo < -10 || this.custo > 10) {
      errors.push('Custo deve estar entre -10 e 10');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 