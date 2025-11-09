/**
 * Serviço para gerenciar operações de Classe
 * Responsável pela comunicação com a API
 */
import generateGETparams from './generateGETparams';

export class ClasseService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/classes';
  }

  /**
   * Busca todas as classes
   * @returns {Promise<Array>} Lista de classes
   */
  async getAll(params) {
    try {
      const paramsString = generateGETparams(params);
      const response = await this.apiClient.get(this.baseUrl + paramsString);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.data?.message || 'Erro desconhecido');
      }
    } catch (error) {
      throw new Error(`Erro ao buscar classes: ${error.message}`);
    }
  }

  /**
   * Busca uma classe por ID
   * @param {number} id - ID da classe
   * @returns {Promise<Object>} Classe encontrada
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
      throw new Error(`Erro ao buscar classe: ${error.message}`);
    }
  }

  /**
   * Cria uma nova classe
   * @param {Object} classe - Dados da classe
   * @returns {Promise<Object>} Classe criada
   */
  async create(classe) {
    try {
      const response = await this.apiClient.post(this.baseUrl, classe);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.data?.message || 'Erro desconhecido');
      }
    } catch (error) {
      throw new Error(`Erro ao criar classe: ${error.message}`);
    }
  }

  /**
   * Atualiza uma classe
   * @param {number} id - ID da classe
   * @param {Object} classe - Dados da classe
   * @returns {Promise<Object>} Classe atualizada
   */
  async update(id, classe) {
    try {
      const response = await this.apiClient.put(`${this.baseUrl}/${id}`, classe);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.data?.message || 'Erro desconhecido');
      }
    } catch (error) {
      throw new Error(`Erro ao atualizar classe: ${error.message}`);
    }
  }

  /**
   * Remove uma classe
   * @param {number} id - ID da classe
   * @returns {Promise<Object>} Confirmação da remoção
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
      throw new Error(`Erro ao remover classe: ${error.message}`);
    }
  }
} 