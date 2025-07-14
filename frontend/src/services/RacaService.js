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
      
      // Verificação mais robusta da estrutura de resposta
      if (response.data) {
        // Se a resposta tem a estrutura esperada (success + data)
        if (response.data.success !== undefined) {
          if (response.data.success) {
            return response.data?.data || [];
          } else {
            throw new Error(response.data?.message || 'Erro desconhecido');
          }
        } else {
          // Se não tem a estrutura success, assume que a resposta é direta
          return Array.isArray(response.data) ? response.data : [response.data];
        }
      } else {
        throw new Error('Resposta inválida da API');
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
      return response.data;
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
      return response.data;
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
      return response.data;
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
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao remover raça: ${error.message}`);
    }
  }
} 