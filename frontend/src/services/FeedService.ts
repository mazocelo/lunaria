import type { ApiClient } from './ApiClient';

/**
 * Servico do Feed Social. Posts, curtidas e comentarios.
 * Sem schema Zod dedicado (fora do escopo da Fase 1) — retornos sao
 * `unknown` no boundary e o caller continua acessando as propriedades.
 * TODO Fase 3: criar `feedPostSchema` / `comentarioSchema`.
 */

interface PaginationParams {
  limit?: number;
  offset?: number;
}

type FeedTab = 'amigos' | 'todos' | string;

export class FeedService {
  private readonly apiClient: ApiClient;
  private readonly baseUrl: string;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/feed';
  }

  async fetchFeed(tab: FeedTab = 'amigos', params: PaginationParams = {}): Promise<unknown> {
    const { limit = 20, offset = 0 } = params;
    return await this.apiClient.get(`${this.baseUrl}?tab=${tab}&limit=${limit}&offset=${offset}`);
  }

  async createPost(data: Record<string, unknown>): Promise<unknown> {
    return await this.apiClient.post(this.baseUrl, data);
  }

  async deletePost(postId: number | string): Promise<unknown> {
    return await this.apiClient.delete(`${this.baseUrl}/${postId}`);
  }

  async toggleLike(postId: number | string): Promise<unknown> {
    return await this.apiClient.post(`${this.baseUrl}/${postId}/curtir`);
  }

  async fetchComments(postId: number | string, params: PaginationParams = {}): Promise<unknown> {
    const { limit = 20, offset = 0 } = params;
    return await this.apiClient.get(`${this.baseUrl}/${postId}/comentarios?limit=${limit}&offset=${offset}`);
  }

  async addComment(postId: number | string, texto: string): Promise<unknown> {
    return await this.apiClient.post(`${this.baseUrl}/${postId}/comentarios`, { texto });
  }

  async deleteComment(commentId: number | string): Promise<unknown> {
    return await this.apiClient.delete(`${this.baseUrl}/comentarios/${commentId}`);
  }
}

export default FeedService;
