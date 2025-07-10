/**
 * Cliente HTTP base para comunicação com a API
 * Responsável por gerenciar requisições HTTP
 
*/
let baseURL = 'https://role-chat-play-backend-562ca33432b0.herokuapp.com/'; // URL padrão da API
// let baseURL = 'http://localhost:3000';
export class ApiClient {
  constructor() {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Configura headers padrão
   * @param {Object} headers - Headers adicionais
   */
  setHeaders(headers) {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  /**
   * Adiciona token de autenticação
   * @param {string} token - Token JWT
   */
  setAuthToken(token) {
    if (token) {
      this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders['Authorization'];
    }
  }

  /**
   * Faz uma requisição HTTP
   * @param {string} method - Método HTTP
   * @param {string} url - URL da requisição
   * @param {Object} data - Dados da requisição
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} Resposta da requisição
   */
  async request(method, url, data = null, options = {}) {
    const config = {
      method,
      url: `${this.baseURL}${url}`,
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options
    };

    if (data) {
      config.data = data;
    }

    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.data ? JSON.stringify(config.data) : null,
        ...config
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return { data: await response.json() };
      }

      return { data: await response.text() };
    } catch (error) {
      throw new Error(`Erro na requisição: ${error.message}`);
    }
  }

  /**
   * Requisição GET
   * @param {string} url - URL da requisição
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} Resposta da requisição
   */
  async get(url, options = {}) {
    return this.request('GET', url, null, options);
  }

  /**
   * Requisição POST
   * @param {string} url - URL da requisição
   * @param {Object} data - Dados da requisição
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} Resposta da requisição
   */
  async post(url, data, options = {}) {
    return this.request('POST', url, data, options);
  }

  /**
   * Requisição PUT
   * @param {string} url - URL da requisição
   * @param {Object} data - Dados da requisição
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} Resposta da requisição
   */
  async put(url, data, options = {}) {
    return this.request('PUT', url, data, options);
  }

  /**
   * Requisição PATCH
   * @param {string} url - URL da requisição
   * @param {Object} data - Dados da requisição
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} Resposta da requisição
   */
  async patch(url, data, options = {}) {
    return this.request('PATCH', url, data, options);
  }

  /**
   * Requisição DELETE
   * @param {string} url - URL da requisição
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} Resposta da requisição
   */
  async delete(url, options = {}) {
    return this.request('DELETE', url, null, options);
  }
}

// Instância singleton do cliente API
export const apiClient = new ApiClient(); 