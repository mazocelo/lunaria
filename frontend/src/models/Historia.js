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
    this.descricao = data.descricao || '';
    this.prologo = data.prologo || '';
    this.mestre_id = data.mestre_id || null;
    this.mestre = data.mestre || null;
    this.imagem = data.imagem || null;
    this.mapas = data.mapas || [];
    this.config = data.config || null;
    this.mestre_tier = data.mestre_tier || 'poeta';
    this.id_usuario = data.id_usuario || null;
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
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

    if (this.maximo_de_participantes < 1) {
      errors.push('Minimo de 1 participante');
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
      descricao: this.descricao,
      prologo: this.prologo,
      mestre_id: this.mestre_id,
      mestre_tier: this.mestre_tier,
      imagem: this.imagem,
      mapas: this.mapas,
      config: this.config,
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
      descricao: apiData.descricao || '',
      prologo: apiData.prologo || '',
      mestre_id: apiData.mestre_id || null,
      mestre: apiData.mestres || apiData.mestre || null,
      imagem: apiData.imagem || null,
      mapas: apiData.mapas || [],
      config: apiData.config || null,
      id_usuario: apiData.id_usuario,  // ID do usuário dono da história
      created_at: apiData.criada_em || apiData.created_at || null,
      updated_at: apiData.atualizada_em || apiData.updated_at || null
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
