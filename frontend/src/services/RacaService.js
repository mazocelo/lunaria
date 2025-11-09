/**
 * Serviço para gerenciar operações de Raça
 * Responsável pela comunicação com a API
 */
import generateGETparams from './generateGETparams';

export class RacaService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/racas';
  }

  /**
   * Busca todas as raças
   * @returns {Promise<Array>} Lista de raças
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
      throw new Error(`Erro ao buscar raças: ${error.message}`);
    }
  }

  /**
   * Busca uma raça por ID
   * @param {number} id - ID da raça
   * @returns {Promise<Object>} Raça encontrada
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
      throw new Error(`Erro ao buscar raça: ${error.message}`);
    }
  }

  /**
   * Cria uma nova raça
   * @param {Object} raca - Dados da raça
   * @returns {Promise<Object>} Raça criada
   */
  async create(raca) {
    try {
      const response = await this.apiClient.post(this.baseUrl, raca);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.data?.message || 'Erro desconhecido');
      }
    } catch (error) {
      throw new Error(`Erro ao criar raça: ${error.message}`);
    }
  }

  /**
   * Atualiza uma raça
   * @param {number} id - ID da raça
   * @param {Object} raca - Dados da raça
   * @returns {Promise<Object>} Raça atualizada
   */
  async update(id, raca) {
    try {
      const response = await this.apiClient.put(`${this.baseUrl}/${id}`, raca);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.data?.message || 'Erro desconhecido');
      }
    } catch (error) {
      throw new Error(`Erro ao atualizar raça: ${error.message}`);
    }
  }

  /**
   * Remove uma raça
   * @param {number} id - ID da raça
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
      throw new Error(`Erro ao remover raça: ${error.message}`);
    }
  }
} 