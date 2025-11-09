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
   * @returns {Promise<Object>} Resposta da API com tokens e dados do usuário
   */
  async login(credentials) {
    try {
      const response = await this.apiClient.post(`${this.baseEndpoint}/login`, credentials);
      
      // A resposta agora vem no formato: { success: true, message: "...", data: { accessToken, refreshToken, ... } }
      const responseData = response.data || response;
      
      // Armazenar tokens baseado no campo lembrarDeMim
      if (responseData.accessToken && responseData.refreshToken) {
        this.setTokens({
          accessToken: responseData.accessToken,
          refreshToken: responseData.refreshToken,
          lembrarDeMim: responseData.lembrarDeMim || false
        });
        
        localStorage.setItem('user', JSON.stringify(responseData.usuario));
      }
      
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
      // Tentar fazer logout no servidor
      await this.apiClient.post(`${this.baseEndpoint}/logout`);
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      // Sempre limpar dados locais
      this.clearTokens();
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
    const accessToken = this.getAccessToken();
    return !!accessToken;
  }

  /**
   * Obter access token atual
   * @returns {string|null} Access token de autenticação
   */
  getToken() {
    return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  }

  /**
   * Obter access token atual
   * @returns {string|null} Access token de autenticação
   */
  getAccessToken() {
    return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  }

  /**
   * Obter refresh token atual
   * @returns {string|null} Refresh token de autenticação
   */
  getRefreshToken() {
    return localStorage.getItem('refreshToken');
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
      return response.status === 200;
    } catch (error) {
      console.error('Token inválido:', error);
      return false;
    }
  }

  /**
   * Renovar access token usando refresh token
   * @returns {Promise<Object|null>} Nova resposta com tokens ou null se falhou
   */
  async refreshAccessToken() {
    try {
      const refreshToken = this.getRefreshToken();
      
      if (!refreshToken) {
        console.warn('Refresh token não encontrado');
        return null;
      }

      const response = await this.apiClient.post(`${this.baseEndpoint}/renovar`, {
        refreshToken
      });

      // A resposta vem no formato: { success: true, data: { accessToken, refreshToken } }
      const responseData = response.data || response;
      
      // Armazenar novos tokens
      if (responseData.accessToken) {
        this.setTokens({
          accessToken: responseData.accessToken,
          refreshToken: responseData.refreshToken,
          lembrarDeMim: false // Novos tokens sempre com duração padrão
        });

        // Atualizar dados do usuário se fornecidos
        if (responseData.usuario) {
          localStorage.setItem('user', JSON.stringify(responseData.usuario));
        }
      }

      return responseData;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      // Se falhou ao renovar, limpar tokens
      this.clearTokens();
      return null;
    }
  }

  /**
   * Armazenar tokens baseado na preferência do usuário
   * @param {Object} tokenData - Dados dos tokens
   * @param {string} tokenData.accessToken - Access token
   * @param {string} tokenData.refreshToken - Refresh token
   * @param {boolean} tokenData.lembrarDeMim - Se deve lembrar do usuário
   */
  setTokens({ accessToken, refreshToken, lembrarDeMim }) {
    if (lembrarDeMim) {
      // Lembrar de mim: usar localStorage para ambos
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('lembrarDeMim', 'true');
    } else {
      // Não lembrar: usar sessionStorage para accessToken
      sessionStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('lembrarDeMim', 'false');
    }
  }

  /**
   * Limpar todos os tokens e dados do usuário
   */
  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('lembrarDeMim');
    sessionStorage.removeItem('accessToken');
  }

  /**
   * Decodificar JWT token para obter payload
   * @param {string} token - Token JWT
   * @returns {Object|null} Payload decodificado ou null se inválido
   */
  decodeJWT(token) {
    try {
      if (!token) return null;
      
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = parts[1];
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch (error) {
      console.error('Erro ao decodificar JWT:', error);
      return null;
    }
  }

  /**
   * Verificar se o token está expirado
   * @param {string} token - Token JWT
   * @returns {boolean} True se expirado
   */
  isTokenExpired(token) {
    const decoded = this.decodeJWT(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  }

  /**
   * Verificar se o access token está próximo do vencimento
   * @param {number} bufferMinutes - Minutos de buffer antes do vencimento (padrão: 5)
   * @returns {boolean} True se próximo do vencimento
   */
  isTokenNearExpiry(bufferMinutes = 5) {
    const accessToken = this.getAccessToken();
    const decoded = this.decodeJWT(accessToken);
    
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    const bufferSeconds = bufferMinutes * 60;
    
    return decoded.exp - currentTime < bufferSeconds;
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