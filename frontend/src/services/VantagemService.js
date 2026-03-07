/**
 * Serviço para gerenciar operações de Vantagem e Desvantagem
 * Responsável pela comunicação com a API
 */
import generateGETparams from './generateGETparams';

export class VantagemService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/vantagens';
  }

  /**
   * Busca todas as vantagens e desvantagens
   * @returns {Promise<Array>} Lista de vantagens e desvantagens
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
      throw new Error(`Erro ao buscar vantagens: ${error.message}`);
    }
  }

  /**
   * Busca vantagens ativas
   * @returns {Promise<Array>} Lista de vantagens ativas
   */
  async getVantagens() {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}`);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.data?.message || 'Erro desconhecido');
      }
    } catch (error) {
      throw new Error(`Erro ao buscar vantagens: ${error.message}`);
    }
  }

  /**
   * Busca desvantagens ativas
   * @returns {Promise<Array>} Lista de desvantagens ativas
   */
  async getDesvantagens() {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}?tipo=desvantagem`);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.data?.message || 'Erro desconhecido');
      }
    } catch (error) {
      throw new Error(`Erro ao buscar desvantagens: ${error.message}`);
    }
  }

  /**
   * Busca uma vantagem/desvantagem por ID
   * @param {number} id - ID da vantagem/desvantagem
   * @returns {Promise<Object>} Vantagem/desvantagem encontrada
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
      throw new Error(`Erro ao buscar vantagem/desvantagem: ${error.message}`);
    }
  }

  /**
   * Busca vantagens/desvantagens por tipo
   * @param {string} tipo - Tipo (vantagem ou desvantagem)
   * @returns {Promise<Array>} Lista de vantagens/desvantagens do tipo
   */
  async getByTipo(tipo) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}?tipo=${encodeURIComponent(tipo)}`);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.data?.message || 'Erro desconhecido');
      }
    } catch (error) {
      throw new Error(`Erro ao buscar vantagens/desvantagens por tipo: ${error.message}`);
    }
  }

  /**
   * Busca vantagens/desvantagens por nome
   * @param {string} nome - Nome da vantagem/desvantagem
   * @returns {Promise<Array>} Lista de vantagens/desvantagens encontradas
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
      throw new Error(`Erro ao buscar vantagens/desvantagens por nome: ${error.message}`);
    }
  }

  async create(data) {
    try {
      const response = await this.apiClient.post(this.baseUrl, data);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.data?.message || 'Erro desconhecido');
      }
    } catch (error) {
      throw new Error(`Erro ao criar vantagem: ${error.message}`);
    }
  }

  async update(id, data) {
    try {
      const response = await this.apiClient.put(`${this.baseUrl}/${id}`, data);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.data?.message || 'Erro desconhecido');
      }
    } catch (error) {
      throw new Error(`Erro ao atualizar vantagem: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const response = await this.apiClient.delete(`${this.baseUrl}/${id}`);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.data?.message || 'Erro desconhecido');
      }
    } catch (error) {
      throw new Error(`Erro ao excluir vantagem: ${error.message}`);
    }
  }
}