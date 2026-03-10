import generateGETparams from './generateGETparams';

export class HabilidadeService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/habilidades';
  }

  async getAll(params) {
    try {
      const paramsString = generateGETparams(params);
      const response = await this.apiClient.get(this.baseUrl + paramsString);
      if (response.success) return response;
      throw new Error(response.data?.message || 'Erro desconhecido');
    } catch (error) {
      throw new Error(`Erro ao buscar habilidades: ${error.message}`);
    }
  }

  async getById(id) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}/${id}`);
      if (response.success) return response;
      throw new Error(response.data?.message || 'Erro desconhecido');
    } catch (error) {
      throw new Error(`Erro ao buscar habilidade: ${error.message}`);
    }
  }

  async getEstatisticas() {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}/estatisticas`);
      if (response.success) return response;
      throw new Error(response.data?.message || 'Erro desconhecido');
    } catch (error) {
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
    }
  }

  async create(data) {
    try {
      const response = await this.apiClient.post(this.baseUrl, data);
      if (response.success) return response;
      throw new Error(response.data?.message || 'Erro desconhecido');
    } catch (error) {
      throw new Error(`Erro ao criar habilidade: ${error.message}`);
    }
  }

  async update(id, data) {
    try {
      const response = await this.apiClient.put(`${this.baseUrl}/${id}`, data);
      if (response.success) return response;
      throw new Error(response.data?.message || 'Erro desconhecido');
    } catch (error) {
      throw new Error(`Erro ao atualizar habilidade: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const response = await this.apiClient.delete(`${this.baseUrl}/${id}`);
      if (response.success) return response;
      throw new Error(response.data?.message || 'Erro desconhecido');
    } catch (error) {
      throw new Error(`Erro ao excluir habilidade: ${error.message}`);
    }
  }
}
