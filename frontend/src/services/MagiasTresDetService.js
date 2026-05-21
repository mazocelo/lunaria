import generateGETparams from './generateGETparams';

export class MagiasTresDetService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/magias-tresdet';
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
      throw new Error(`Erro ao buscar magias: ${error.message}`);
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
      throw new Error(`Erro ao buscar magia: ${error.message}`);
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
      throw new Error(`Erro ao criar magia: ${error.message}`);
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
      throw new Error(`Erro ao atualizar magia: ${error.message}`);
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
      throw new Error(`Erro ao excluir magia: ${error.message}`);
    }
  }
}
