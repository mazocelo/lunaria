/**
 * Modelo de dados para Tema
 * Responsável pela estrutura e validação dos dados
 */
export class Tema {
  constructor(data = {}) {
    this.id = data.id || null;
    this.nome = data.nome || '';
    this.descricao = data.descricao || '';
    this.cor = data.cor || '#8b5cf6';
    this.ativo = data.ativo !== undefined ? data.ativo : true;
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
      errors.push('Nome do tema é obrigatório');
    }

    if (this.nome && this.nome.trim().length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres');
    }

    if (this.nome && this.nome.trim().length > 50) {
      errors.push('Nome deve ter no máximo 50 caracteres');
    }

    if (this.descricao && this.descricao.length > 200) {
      errors.push('Descrição deve ter no máximo 200 caracteres');
    }

    // Validar cor (formato hexadecimal)
    if (this.cor && !/^#[0-9A-F]{6}$/i.test(this.cor)) {
      errors.push('Cor deve estar no formato hexadecimal (#RRGGBB)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Converte para objeto plano
   * @returns {Object} Dados do tema
   */
  toJSON() {
    return {
      id: this.id,
      nome: this.nome,
      descricao: this.descricao,
      cor: this.cor,
      ativo: this.ativo,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  /**
   * Cria uma nova instância a partir de dados da API
   * @param {Object} apiData - Dados da API
   * @returns {Tema} Nova instância
   */
  static fromAPI(apiData) {
    return new Tema({
      id: apiData.id,
      nome: apiData.nome,
      descricao: apiData.descricao,
      cor: apiData.cor,
      ativo: apiData.ativo,
      created_at: apiData.created_at,
      updated_at: apiData.updated_at
    });
  }

  /**
   * Cria uma cópia do modelo
   * @returns {Tema} Cópia do modelo
   */
  clone() {
    return new Tema(this.toJSON());
  }

  /**
   * Atualiza os dados do modelo
   * @param {Object} updates - Dados para atualizar
   */
  update(updates) {
    Object.assign(this, updates);
    this.updated_at = new Date();
  }

  /**
   * Ativa o tema
   */
  ativar() {
    this.ativo = true;
    this.updated_at = new Date();
  }

  /**
   * Desativa o tema
   */
  desativar() {
    this.ativo = false;
    this.updated_at = new Date();
  }
} 