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
   * Busca uma vantagem/desvantagem por ID
   * @param {number} id - ID da vantagem/desvantagem
   * @returns {Promise<Object>} Vantagem/desvantagem encontrada
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
      throw new Error(`Erro ao buscar vantagens/desvantagens por nome: ${error.message}`);
    }
  }
} 