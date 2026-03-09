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
   * @param {boolean} credentials.lembrarDeMim - Se deve lembrar do usuário
   * @returns {Promise<Object>} Resposta da API com socketToken e dados do usuário
   */
  async login(credentials) {
    try {
      const response = await this.apiClient.post(`${this.baseEndpoint}/login`, credentials);
      
      // A resposta vem no formato: { success: true, message: "...", data: { socketToken, usuario, lembrarDeMim } }
      const responseData = response.data || response;
      
      // Armazenar apenas dados do usuário e preferência lembrarDeMim
      if (responseData.usuario) {
        localStorage.setItem('user', JSON.stringify(responseData.usuario));
      }
      
      if (responseData.lembrarDeMim !== undefined) {
        localStorage.setItem('lembrarDeMim', String(responseData.lembrarDeMim));
      }
      
      // Retornar socketToken para ser armazenado no Zustand
      return responseData;
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
      // Fazer logout no servidor (limpa cookies HttpOnly)
      await this.apiClient.post(`${this.baseEndpoint}/logout`);
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      // Limpar dados locais (usuário e preferências)
      localStorage.removeItem('user');
      localStorage.removeItem('lembrarDeMim');
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
      const responseData = response.data || response;

      // Armazenar dados do usuário se retornados
      if (responseData.usuario) {
        localStorage.setItem('user', JSON.stringify(responseData.usuario));
      }

      return responseData;
    } catch (error) {
      console.error('Erro no registro:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Verificar se o usuário está autenticado
   * Agora verifica apenas a existência dos dados do usuário
   * O token real está no cookie HttpOnly
   * @returns {boolean} True se autenticado
   */
  isAuthenticated() {
    const userData = this.getCurrentUser();
    return !!userData;
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
   * Validar access token atual
   * @returns {Promise<boolean>} True se token válido
   */
  async validateToken() {
    try {
      const response = await this.apiClient.get(`${this.baseEndpoint}/verificar`);
      return response.success !== false;
    } catch (error) {
      console.error('Token inválido:', error);
      return false;
    }
  }

  /**
   * Renovar tokens usando refresh token (via cookie HttpOnly)
   * @returns {Promise<Object|null>} Nova resposta com socketToken ou null se falhou
   */
  async refreshAccessToken() {
    try {
      // O refreshToken é enviado automaticamente via cookie HttpOnly
      const response = await this.apiClient.post(`${this.baseEndpoint}/renovar`);

      // A resposta vem no formato: { success: true, data: { socketToken, usuario } }
      const responseData = response.data || response;
      
      // Atualizar dados do usuário se fornecidos
      if (responseData.usuario) {
        localStorage.setItem('user', JSON.stringify(responseData.usuario));
      }

      // Retornar socketToken para ser armazenado no Zustand
      return responseData;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      // Se falhou ao renovar, limpar dados do usuário
      localStorage.removeItem('user');
      localStorage.removeItem('lembrarDeMim');
      return null;
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
      return response.data || response;
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
      return response.data || response;
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
        case 429:
          return new Error(data.message || 'Muitas tentativas. Aguarde alguns minutos.');
        default:
          return new Error(data.message || 'Erro no servidor');
      }
    }
    
    return new Error('Erro de rede. Verifique sua conexão.');
  }
} 