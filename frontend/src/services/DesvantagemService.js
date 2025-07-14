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
    console.log('DesvantagemService.getAll - params:', params);
    try {
      const paramsString = generateGETparams(params);
      console.log('DesvantagemService.getAll - fazendo requisição para:', this.baseUrl + paramsString);
      const response = await this.apiClient.get(this.baseUrl + paramsString);
      console.log('DesvantagemService.getAll - resposta completa:', response);
      console.log('DesvantagemService.getAll - response.data:', response.data);
      
      if (response.data) {
        if (response.data.success !== undefined) {
          if (response.data.success) {
            console.log('DesvantagemService.getAll - dados retornados:', response.data?.data);
            return response.data?.data || [];
          } else {
            console.log('DesvantagemService.getAll - erro na resposta:', response.data?.message);
            throw new Error(response.data?.message || 'Erro desconhecido');
          }
        } else {
          console.log('DesvantagemService.getAll - resposta direta:', response.data);
          return Array.isArray(response.data) ? response.data : [response.data];
        }
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (error) {
      console.error('DesvantagemService.getAll - erro:', error);
      throw new Error(`Erro ao buscar desvantagens: ${error.message}`);
    }
  }

  /**
   * Busca desvantagens ativas
   * @param {Object} params - Parâmetros de busca (page, limit, search)
   * @returns {Promise<Array>} Lista de desvantagens ativas
   */
  async getDesvantagens(params = {}) {
    try {
      const paramsString = generateGETparams(params);
      const response = await this.apiClient.get(`${this.baseUrl}${paramsString}`);
      if (response.data) {
        if (response.data.success !== undefined) {
          if (response.data.success) {
            return response.data?.data || [];
          } else {
            throw new Error(response.data?.message || 'Erro desconhecido');
          }
        } else {
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
      if (response.data) {
        if (response.data.success !== undefined) {
          if (response.data.success) {
            return response.data?.data;
          } else {
            throw new Error(response.data?.message || 'Erro desconhecido');
          }
        } else {
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
   * Busca desvantagens por nome
   * @param {string} nome - Nome da desvantagem
   * @returns {Promise<Array>} Lista de desvantagens encontradas
   */
  async getByNome(nome) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}?nome=${encodeURIComponent(nome)}`);
      if (response.data) {
        if (response.data.success !== undefined) {
          if (response.data.success) {
            return response.data?.data || [];
          } else {
            throw new Error(response.data?.message || 'Erro desconhecido');
          }
        } else {
          return Array.isArray(response.data) ? response.data : [response.data];
        }
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (error) {
      throw new Error(`Erro ao buscar desvantagens por nome: ${error.message}`);
    }
  }
} 