/**
 * Servico de Amizades
 * Gerencia amigos, solicitacoes, busca e sugestoes
 */
export class AmizadeService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/amizades';
  }

  async fetchFriends(params = {}) {
    const { limit = 50, offset = 0 } = params;
    const response = await this.apiClient.get(`${this.baseUrl}?limit=${limit}&offset=${offset}`);
    return response;
  }

  async fetchPending() {
    const response = await this.apiClient.get(`${this.baseUrl}/pendentes`);
    return response;
  }

  async fetchSuggestions(limit = 10) {
    const response = await this.apiClient.get(`${this.baseUrl}/sugestoes?limit=${limit}`);
    return response;
  }

  async searchUsers(query) {
    if (!query || query.length < 2) return { success: true, data: [] };
    const response = await this.apiClient.get(`${this.baseUrl}/pesquisar?q=${encodeURIComponent(query)}`);
    return response;
  }

  async sendRequest(receiverId) {
    const response = await this.apiClient.post(this.baseUrl, { receiver_id: receiverId });
    return response;
  }

  async acceptRequest(amizadeId) {
    const response = await this.apiClient.put(`${this.baseUrl}/${amizadeId}/aceitar`);
    return response;
  }

  async rejectRequest(amizadeId) {
    const response = await this.apiClient.put(`${this.baseUrl}/${amizadeId}/rejeitar`);
    return response;
  }

  async blockUser(amizadeId) {
    const response = await this.apiClient.put(`${this.baseUrl}/${amizadeId}/bloquear`);
    return response;
  }

  async removeFriend(amizadeId) {
    const response = await this.apiClient.delete(`${this.baseUrl}/${amizadeId}`);
    return response;
  }
}

export default AmizadeService;
