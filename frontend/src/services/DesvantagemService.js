/**
 * Serviço para gerenciar operações de Desvantagem
 * Responsável pela comunicação com a API
 */
import generateGETparams from './generateGETparams';

export class DesvantagemService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/desvantagens';
  }

  /**
   * Busca todas as desvantagens
   * @returns {Promise<Array>} Lista de desvantagens
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
      throw new Error(`Erro ao buscar desvantagens: ${error.message}`);
    }
  }

  /**
   * Busca desvantagens ativas
   * @returns {Promise<Array>} Lista de desvantagens ativas
   */
  async getDesvantagens(params = {}) {
    try {
      const paramsString = generateGETparams(params);
      const response = await this.apiClient.get(`${this.baseUrl}${paramsString}`);
      
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
      throw new Error(`Erro ao buscar desvantagens: ${error.message}`);
    }
  }

  /**
   * Busca uma desvantagem por ID
   * @param {number} id - ID da desvantagem
   * @returns {Promise<Object>} Desvantagem encontrada
   */
  async getById(id) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}/${id}`);
      
      // Verificação mais robusta da estrutura de resposta
      if (response.data) {
        // Se a resposta tem a estrutura esperada (success + data)
        if (response.data.success !== undefined) {
          if (response.data.success) {
            return response.data?.data;
          } else {
            throw new Error(response.data?.message || 'Erro desconhecido');
          }
        } else {
          // Se não tem a estrutura success, assume que a resposta é direta
          return response.data;
        }
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (error) {
      throw new Error(`Erro ao buscar desvantagem: ${error.message}`);
    }
  }

  /**
   * Busca desvantagens por tipo
   * @param {string} tipo - Tipo da desvantagem
   * @returns {Promise<Array>} Lista de desvantagens do tipo
   */
  async getByTipo(tipo) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}?tipo=${encodeURIComponent(tipo)}`);
      
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
      throw new Error(`Erro ao buscar desvantagens por tipo: ${error.message}`);
    }
  }

  /**
   * Busca desvantagens por nome
   * @param {string} nome - Nome da desvantagem
   * @returns {Promise<Array>} Lista de desvantagens encontradas
   */
  async getByNome(nome) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}?nome=${encodeURIComponent(nome)}`);
      
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
      throw new Error(`Erro ao buscar desvantagens por nome: ${error.message}`);
    }
  }

  /**
   * Atualiza uma desvantagem
   * @param {number} id - ID da desvantagem
   * @param {Object} data - Dados da desvantagem
   * @returns {Promise<Object>} Desvantagem atualizada
   */
  async update(id, data) {
    try {
      const response = await this.apiClient.put(`${this.baseUrl}/${id}`, data);
      
      // Verificação mais robusta da estrutura de resposta
      if (response.data) {
        // Se a resposta tem a estrutura esperada (success + data)
        if (response.data.success !== undefined) {
          if (response.data.success) {
            return response.data?.data;
          } else {
            throw new Error(response.data?.message || 'Erro desconhecido');
          }
        } else {
          // Se não tem a estrutura success, assume que a resposta é direta
          return response.data;
        }
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (error) {
      throw new Error(`Erro ao atualizar desvantagem: ${error.message}`);
    }
  }

  /**
   * Exclui uma desvantagem
   * @param {number} id - ID da desvantagem
   * @returns {Promise<Object>} Resultado da exclusão
   */
  async delete(id) {
    try {
      const response = await this.apiClient.delete(`${this.baseUrl}/${id}`);
      
      // Verificação mais robusta da estrutura de resposta
      if (response.data) {
        // Se a resposta tem a estrutura esperada (success + data)
        if (response.data.success !== undefined) {
          if (response.data.success) {
            return response.data?.data;
          } else {
            throw new Error(response.data?.message || 'Erro desconhecido');
          }
        } else {
          // Se não tem a estrutura success, assume que a resposta é direta
          return response.data;
        }
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (error) {
      throw new Error(`Erro ao excluir desvantagem: ${error.message}`);
    }
  }
} 