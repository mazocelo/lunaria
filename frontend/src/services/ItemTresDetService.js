export class ItemTresDetService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/itens-tresdet';
  }

  async getAll() {
    try {
      const response = await this.apiClient.get(this.baseUrl);
      if (response.success) return response;
      throw new Error(response.data?.message || 'Erro desconhecido');
    } catch (error) {
      throw new Error(`Erro ao buscar itens 3D&T: ${error.message}`);
    }
  }

  async getById(id) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}/${id}`);
      if (response.success) return response;
      throw new Error(response.data?.message || 'Erro desconhecido');
    } catch (error) {
      throw new Error(`Erro ao buscar item 3D&T: ${error.message}`);
    }
  }

  async create(data) {
    try {
      const response = await this.apiClient.post(this.baseUrl, data);
      if (response.success) return response;
      throw new Error(response.data?.message || 'Erro desconhecido');
    } catch (error) {
      throw new Error(`Erro ao criar item 3D&T: ${error.message}`);
    }
  }

  async update(id, data) {
    try {
      const response = await this.apiClient.put(`${this.baseUrl}/${id}`, data);
      if (response.success) return response;
      throw new Error(response.data?.message || 'Erro desconhecido');
    } catch (error) {
      throw new Error(`Erro ao atualizar item 3D&T: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const response = await this.apiClient.delete(`${this.baseUrl}/${id}`);
      if (response.success) return response;
      throw new Error(response.data?.message || 'Erro desconhecido');
    } catch (error) {
      throw new Error(`Erro ao excluir item 3D&T: ${error.message}`);
    }
  }
}
