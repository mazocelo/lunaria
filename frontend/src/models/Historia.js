/**
 * Modelo de dados para História
 * Responsável pela estrutura e validação dos dados
 */
export class Historia {
  constructor(data = {}) {
    this.id = data.id || null;
    this.nome = data.nome || '';
    this.temas = data.temas || [];
    this.maximo_de_participantes = data.maximo_de_participantes || 3;
    this.prologo = data.prologo || '';
    this.mestre_id = data.mestre_id || null;
    this.mestre = data.mestre || null;
    this.id_usuario = data.id_usuario || null;  // ID do usuário dono da história
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  /**
   * Valida se o modelo está correto
   * @returns {Object} Resultado da validação
   */
  validate() {
    const errors = [];

    if (this.nome && this.nome.trim().length > 0 && this.nome.trim().length < 3) {
      errors.push('Nome deve ter pelo menos 3 caracteres');
    }

    if (this.maximo_de_participantes < 2) {
      errors.push('Mínimo de 2 participantes');
    }

    if (this.maximo_de_participantes > 10) {
      errors.push('Máximo de 10 participantes');
    }

    if (this.temas && this.temas.length > 3) {
      errors.push('Máximo de 3 temas permitidos');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Converte para objeto plano
   * @returns {Object} Dados da história
   */
  toJSON() {
    return {
      id: this.id,
      nome: this.nome,
      temas: this.temas,
      maximo_de_participantes: this.maximo_de_participantes,
      prologo: this.prologo,
      mestre_id: this.mestre_id,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  /**
   * Cria uma nova instância a partir de dados da API
   * @param {Object} apiData - Dados da API
   * @returns {Historia} Nova instância
   */
  static fromAPI(apiData) {
    return new Historia({
      id: apiData.id,
      nome: apiData.nome,
      temas: apiData.temas || [],
      maximo_de_participantes: apiData.maximo_de_participantes,
      prologo: apiData.prologo || '',
      mestre_id: apiData.mestre_id || null,
      mestre: apiData.mestres || apiData.mestre || null,
      id_usuario: apiData.id_usuario,  // ID do usuário dono da história
      created_at: apiData.created_at,
      updated_at: apiData.updated_at
    });
  }

  /**
   * Cria uma cópia do modelo
   * @returns {Historia} Cópia do modelo
   */
  clone() {
    return new Historia(this.toJSON());
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