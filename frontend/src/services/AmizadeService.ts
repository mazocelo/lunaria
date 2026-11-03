import type { ApiClient } from './ApiClient';

/**
 * Servico de Amizades — amigos, solicitacoes, busca e sugestoes.
 * Sem schema Zod dedicado (fora do escopo da Fase 1).
 * TODO Fase 3: criar `amizadeSchema` / `usuarioSchema`.
 */

interface PaginationParams {
  limit?: number;
  offset?: number;
}

export class AmizadeService {
  private readonly apiClient: ApiClient;
  private readonly baseUrl: string;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/amizades';
  }

  async fetchFriends(params: PaginationParams = {}): Promise<unknown> {
    const { limit = 50, offset = 0 } = params;
    return await this.apiClient.get(`${this.baseUrl}?limit=${limit}&offset=${offset}`);
  }

  async fetchPending(): Promise<unknown> {
    return await this.apiClient.get(`${this.baseUrl}/pendentes`);
  }

  async fetchSuggestions(limit = 10): Promise<unknown> {
    return await this.apiClient.get(`${this.baseUrl}/sugestoes?limit=${limit}`);
  }

  async searchUsers(query: string): Promise<unknown> {
    if (!query || query.length < 2) return { success: true, data: [] };
    return await this.apiClient.get(`${this.baseUrl}/pesquisar?q=${encodeURIComponent(query)}`);
  }

  async sendRequest(receiverId: number | string): Promise<unknown> {
    return await this.apiClient.post(this.baseUrl, { receiver_id: receiverId });
  }

  async acceptRequest(amizadeId: number | string): Promise<unknown> {
    return await this.apiClient.put(`${this.baseUrl}/${amizadeId}/aceitar`);
  }

  async rejectRequest(amizadeId: number | string): Promise<unknown> {
    return await this.apiClient.put(`${this.baseUrl}/${amizadeId}/rejeitar`);
  }

  async blockUser(amizadeId: number | string): Promise<unknown> {
    return await this.apiClient.put(`${this.baseUrl}/${amizadeId}/bloquear`);
  }

  async removeFriend(amizadeId: number | string): Promise<unknown> {
    return await this.apiClient.delete(`${this.baseUrl}/${amizadeId}`);
  }
}

export default AmizadeService;
