/**
 * Servico do Feed Social
 * Gerencia posts, curtidas e comentarios
 */
export class FeedService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/feed';
  }

  async fetchFeed(tab = 'amigos', params = {}) {
    const { limit = 20, offset = 0 } = params;
    const response = await this.apiClient.get(`${this.baseUrl}?tab=${tab}&limit=${limit}&offset=${offset}`);
    return response;
  }

  async createPost(data) {
    const response = await this.apiClient.post(this.baseUrl, data);
    return response;
  }

  async deletePost(postId) {
    const response = await this.apiClient.delete(`${this.baseUrl}/${postId}`);
    return response;
  }

  async toggleLike(postId) {
    const response = await this.apiClient.post(`${this.baseUrl}/${postId}/curtir`);
    return response;
  }

  async fetchComments(postId, params = {}) {
    const { limit = 20, offset = 0 } = params;
    const response = await this.apiClient.get(`${this.baseUrl}/${postId}/comentarios?limit=${limit}&offset=${offset}`);
    return response;
  }

  async addComment(postId, texto) {
    const response = await this.apiClient.post(`${this.baseUrl}/${postId}/comentarios`, { texto });
    return response;
  }

  async deleteComment(commentId) {
    const response = await this.apiClient.delete(`${this.baseUrl}/comentarios/${commentId}`);
    return response;
  }
}

export default FeedService;
