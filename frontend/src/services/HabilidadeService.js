import generateGETparams from './generateGETparams';

export class HabilidadeService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/habilidades';
  }

  async getAll(params) {
    try {
      const paramsString = generateGETparams(params);
      return await this.apiClient.get(this.baseUrl + paramsString);
    } catch (error) {
      throw new Error(`Erro ao buscar habilidades: ${error.message}`);
    }
  }

  async getById(id) {
    try {
      return await this.apiClient.get(`${this.baseUrl}/${id}`);
    } catch (error) {
      throw new Error(`Erro ao buscar habilidade: ${error.message}`);
    }
  }

  async getEstatisticas() {
    try {
      return await this.apiClient.get(`${this.baseUrl}/estatisticas`);
    } catch (error) {
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
    }
  }

  async create(data) {
    try {
      return await this.apiClient.post(this.baseUrl, data);
    } catch (error) {
      throw new Error(`Erro ao criar habilidade: ${error.message}`);
    }
  }

  async update(id, data) {
    try {
      return await this.apiClient.put(`${this.baseUrl}/${id}`, data);
    } catch (error) {
      throw new Error(`Erro ao atualizar habilidade: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      return await this.apiClient.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      throw new Error(`Erro ao excluir habilidade: ${error.message}`);
    }
  }
}
