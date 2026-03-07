import generateGETparams from './generateGETparams';

export class MestreService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/mestres';
  }

  async getAll(params) {
    try {
      const paramsString = generateGETparams(params);
      const response = await this.apiClient.get(this.baseUrl + paramsString);
      if (response.success) return response;
      throw new Error(response.data?.message || 'Erro desconhecido');
    } catch (error) {
      throw new Error(`Erro ao buscar mestres: ${error.message}`);
    }
  }

  async getById(id) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}/${id}`);
      if (response.success) return response;
      throw new Error(response.data?.message || 'Erro desconhecido');
    } catch (error) {
      throw new Error(`Erro ao buscar mestre: ${error.message}`);
    }
  }

  async create(data) {
    try {
      const response = await this.apiClient.post(this.baseUrl, data);
      if (response.success) return response;
      throw new Error(response.data?.message || 'Erro desconhecido');
    } catch (error) {
      throw new Error(`Erro ao criar mestre: ${error.message}`);
    }
  }

  async update(id, data) {
    try {
      const response = await this.apiClient.put(`${this.baseUrl}/${id}`, data);
      if (response.success) return response;
      throw new Error(response.data?.message || 'Erro desconhecido');
    } catch (error) {
      throw new Error(`Erro ao atualizar mestre: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const response = await this.apiClient.delete(`${this.baseUrl}/${id}`);
      if (response.success) return response;
      throw new Error(response.data?.message || 'Erro desconhecido');
    } catch (error) {
      throw new Error(`Erro ao excluir mestre: ${error.message}`);
    }
  }
}
