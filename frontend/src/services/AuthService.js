import { ApiClient } from './ApiClient';

/**
 * Serviço para operações de autenticação
 */
export class AuthService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.baseEndpoint = '/auth';
  }

  /**
   * Realizar login do usuário
   * @param {Object} credentials - Credenciais do usuário
   * @param {string} credentials.email - Email do usuário
   * @param {string} credentials.password - Senha do usuário
   * @returns {Promise<Object>} Resposta da API com token e dados do usuário
   */
  async login(credentials) {
    try {
      const response = await this.apiClient.post(`${this.baseEndpoint}/login`, credentials);
      
      // Armazenar token no localStorage
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.usuario));
      }
      
      return response.data;
    } catch (error) {
      console.error('Erro no login:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Realizar logout do usuário
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      // Tentar fazer logout no servidor
      await this.apiClient.post(`${this.baseEndpoint}/logout`);
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      // Sempre limpar dados locais
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  }

  /**
   * Registrar novo usuário
   * @param {Object} userData - Dados do usuário
   * @param {string} userData.name - Nome do usuário
   * @param {string} userData.email - Email do usuário
   * @param {string} userData.password - Senha do usuário
   * @returns {Promise<Object>} Resposta da API
   */
  async register(userData) {
    try {
      const response = await this.apiClient.post(`${this.baseEndpoint}/registro`, userData);
      
      // Armazenar token no localStorage se retornado
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Erro no registro:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Verificar se o usuário está autenticado
   * @returns {boolean} True se autenticado
   */
  isAuthenticated() {
    const token = localStorage.getItem('authToken');
    return !!token;
  }

  /**
   * Obter token atual
   * @returns {string|null} Token de autenticação
   */
  getToken() {
    return localStorage.getItem('authToken');
  }

  /**
   * Obter dados do usuário atual
   * @returns {Object|null} Dados do usuário
   */
  getCurrentUser() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Validar token atual
   * @returns {Promise<boolean>} True se token válido
   */
  async validateToken() {
    try {
      // ✅ CORREÇÃO: Rota correta é /verificar não /validate
      const response = await this.apiClient.get(`${this.baseEndpoint}/verificar`);
      return response.status === 200;
    } catch (error) {
      console.error('Token inválido:', error);
      // Limpar dados se token inválido
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      return false;
    }
  }

  /**
   * Solicitar recuperação de senha
   * @param {string} email - Email do usuário
   * @returns {Promise<Object>} Resposta da API
   */
  async forgotPassword(email) {
    try {
      const response = await this.apiClient.post(`${this.baseEndpoint}/forgot-password`, { email });
      return response.data;
    } catch (error) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Redefinir senha
   * @param {Object} resetData - Dados para redefinir senha
   * @param {string} resetData.token - Token de redefinição
   * @param {string} resetData.password - Nova senha
   * @returns {Promise<Object>} Resposta da API
   */
  async resetPassword(resetData) {
    try {
      const response = await this.apiClient.post(`${this.baseEndpoint}/reset-password`, resetData);
      return response.data;
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Tratar erros de autenticação
   * @param {Error} error - Erro da API
   * @returns {Error} Erro tratado
   */
  handleAuthError(error) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          return new Error(data.message || 'Credenciais inválidas');
        case 403:
          return new Error(data.message || 'Acesso negado');
        case 422:
          return new Error(data.message || 'Dados inválidos');
        default:
          return new Error(data.message || 'Erro no servidor');
      }
    }
    
    return new Error('Erro de rede. Verifique sua conexão.');
  }
} 