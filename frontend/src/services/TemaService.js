/**
 * Serviço para gerenciar operações de Tema
 * Responsável pela comunicação com a API
 * 
 * Nota: Temas são gerenciados pelo TemaStore (store/tema)
 * Este service é usado apenas pelo store para comunicação com a API
 */
export class TemaService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/temas';
  }

  /**
   * Busca todos os temas
   * @returns {Promise<Object>} Response com lista de temas
   */
  async getAll() {
    try {
      const response = await this.apiClient.get(this.baseUrl);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.data?.message || 'Erro desconhecido');
      }
    } catch (error) {
      throw new Error(`Erro ao buscar temas: ${error.message}`);
    }
  }

  /**
   * Busca temas ativos
   * @returns {Promise<Object>} Response com lista de temas ativos
   */
  async getAtivos() {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}?ativo=true`);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.data?.message || 'Erro desconhecido');
      }
    } catch (error) {
      throw new Error(`Erro ao buscar temas ativos: ${error.message}`);
    }
  }

  /**
   * Busca um tema por ID
   * @param {number} id - ID do tema
   * @returns {Promise<Object>} Response com tema encontrado
   */
  async getById(id) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}/${id}`);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.data?.message || 'Erro desconhecido');
      }
    } catch (error) {
      throw new Error(`Erro ao buscar tema: ${error.message}`);
    }
  }

  /**
   * Cria um novo tema
   * @param {Object} temaData - Dados do tema
   * @returns {Promise<Object>} Response com tema criado
   */
  async create(temaData) {
    try {
      const response = await this.apiClient.post(this.baseUrl, temaData);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.data?.message || 'Erro desconhecido');
      }
    } catch (error) {
      throw new Error(`Erro ao criar tema: ${error.message}`);
    }
  }

  /**
   * Atualiza um tema existente
   * @param {number} id - ID do tema
   * @param {Object} temaData - Dados atualizados
   * @returns {Promise<Object>} Response com tema atualizado
   */
  async update(id, temaData) {
    try {
      const response = await this.apiClient.put(`${this.baseUrl}/${id}`, temaData);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.data?.message || 'Erro desconhecido');
      }
    } catch (error) {
      throw new Error(`Erro ao atualizar tema: ${error.message}`);
    }
  }

  /**
   * Remove um tema
   * @param {number} id - ID do tema
   * @returns {Promise<Object>} Response da operação
   */
  async delete(id) {
    try {
      const response = await this.apiClient.delete(`${this.baseUrl}/${id}`);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.data?.message || 'Erro desconhecido');
      }
    } catch (error) {
      throw new Error(`Erro ao remover tema: ${error.message}`);
    }
  }

  /**
   * Ativa um tema
   * @param {number} id - ID do tema
   * @returns {Promise<Object>} Response com tema ativado
   */
  async ativar(id) {
    try {
      const response = await this.apiClient.patch(`${this.baseUrl}/${id}/ativar`);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.data?.message || 'Erro desconhecido');
      }
    } catch (error) {
      throw new Error(`Erro ao ativar tema: ${error.message}`);
    }
  }

  /**
   * Desativa um tema
   * @param {number} id - ID do tema
   * @returns {Promise<Object>} Response com tema desativado
   */
  async desativar(id) {
    try {
      const response = await this.apiClient.patch(`${this.baseUrl}/${id}/desativar`);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.data?.message || 'Erro desconhecido');
      }
    } catch (error) {
      throw new Error(`Erro ao desativar tema: ${error.message}`);
    }
  }

  /**
   * Busca temas por nome
   * @param {string} nome - Nome do tema
   * @returns {Promise<Object>} Response com lista de temas encontrados
   */
  async getByNome(nome) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}?nome=${encodeURIComponent(nome)}`);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.data?.message || 'Erro desconhecido');
      }
    } catch (error) {
      throw new Error(`Erro ao buscar temas por nome: ${error.message}`);
    }
  }
} 