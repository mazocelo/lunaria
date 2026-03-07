/**
 * Servico para gerenciar operacoes de Equipamento
 * Responsavel pela comunicacao com a API
 */
import generateGETparams from './generateGETparams';

export class EquipamentoService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/equipamentos';
  }

  /**
   * Busca todos os equipamentos
   * @returns {Promise<Array>} Lista de equipamentos
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
      throw new Error(`Erro ao buscar equipamentos: ${error.message}`);
    }
  }

  /**
   * Busca um equipamento por ID
   * @param {number} id - ID do equipamento
   * @returns {Promise<Object>} Equipamento encontrado
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
      throw new Error(`Erro ao buscar equipamento: ${error.message}`);
    }
  }

  /**
   * Cria um novo equipamento
   * @param {Object} data - Dados do equipamento
   * @returns {Promise<Object>} Equipamento criado
   */
  async create(data) {
    try {
      const response = await this.apiClient.post(this.baseUrl, data);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.data?.message || 'Erro desconhecido');
      }
    } catch (error) {
      throw new Error(`Erro ao criar equipamento: ${error.message}`);
    }
  }

  /**
   * Atualiza um equipamento existente
   * @param {number} id - ID do equipamento
   * @param {Object} data - Dados atualizados
   * @returns {Promise<Object>} Equipamento atualizado
   */
  async update(id, data) {
    try {
      const response = await this.apiClient.put(`${this.baseUrl}/${id}`, data);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.data?.message || 'Erro desconhecido');
      }
    } catch (error) {
      throw new Error(`Erro ao atualizar equipamento: ${error.message}`);
    }
  }

  /**
   * Remove um equipamento
   * @param {number} id - ID do equipamento
   * @returns {Promise<Object>} Resultado da operacao
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
      throw new Error(`Erro ao excluir equipamento: ${error.message}`);
    }
  }

  /**
   * Busca equipamentos por termo
   * @param {string} term - Termo de busca
   * @returns {Promise<Array>} Lista de equipamentos encontrados
   */
  async search(term) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}?nome=${encodeURIComponent(term)}`);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.data?.message || 'Erro desconhecido');
      }
    } catch (error) {
      throw new Error(`Erro ao buscar equipamentos: ${error.message}`);
    }
  }
}
