import generateGETparams from './generateGETparams';

export class MonstroService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/monstros';
  }

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
      throw new Error(`Erro ao buscar monstros: ${error.message}`);
    }
  }

  async getById(id) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}/${id}`);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.data?.message || 'Erro desconhecido');
      }
    } catch (error) {
      throw new Error(`Erro ao buscar monstro: ${error.message}`);
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
      throw new Error(`Erro ao criar monstro: ${error.message}`);
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
      throw new Error(`Erro ao atualizar monstro: ${error.message}`);
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
      throw new Error(`Erro ao excluir monstro: ${error.message}`);
    }
  }
}
