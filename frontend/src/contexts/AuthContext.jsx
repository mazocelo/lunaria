import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '../services/AuthService';
import { apiClient } from '../services/ApiClient';
import { useSocketStore } from '../store/socket';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Instância do AuthService
  const authService = new AuthService(apiClient);
  
  // Acesso ao socket store para gerenciar socketToken
  const setSocketToken = useSocketStore(state => state.setSocketToken);
  const clearSocketToken = useSocketStore(state => state.clearSocketToken);
  const disconnectSocket = useSocketStore(state => state.disconnect);

  useEffect(() => {
    // Verificar se há usuário logado ao inicializar
    initializeAuth();
  }, []);

  /**
   * Inicializar estado de autenticação
   */
  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      const userData = authService.getCurrentUser();
      
      if (userData) {
        // Usuário existe no localStorage, considerar autenticado
        // O backend validará o cookie HttpOnly automaticamente
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Erro ao inicializar autenticação:', error);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Realizar login
   * @param {Object} credentials - Credenciais do usuário
   * @returns {Promise<Object>} Resultado do login
   */
  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authService.login(credentials);
      
      // Verificar se recebemos socketToken e dados do usuário
      if (response.socketToken && response.usuario) {
        // Armazenar socketToken no Zustand
        setSocketToken(response.socketToken);
        
        setUser(response.usuario);
        setIsAuthenticated(true);
        
        return { 
          success: true, 
          user: response.usuario,
          lembrarDeMim: response.lembrarDeMim
        };
      } else {
        throw new Error('Resposta de login inválida');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao fazer login' 
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Realizar logout
   */
  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      // Desconectar WebSocket e limpar token
      disconnectSocket();
      clearSocketToken();

      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  /**
   * Registrar novo usuário
   * @param {Object} userData - Dados do usuário
   * @returns {Promise<Object>} Resultado do registro
   */
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);
      
      setUser(response.user);
      setIsAuthenticated(true);
      
      return { success: true, user: response.user };
    } catch (error) {
      console.error('Erro no registro:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao registrar usuário' 
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Solicitar recuperação de senha
   * @param {string} email - Email do usuário
   * @returns {Promise<Object>} Resultado da solicitação
   */
  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      await authService.forgotPassword(email);
      
      return { 
        success: true, 
        message: 'Email de recuperação enviado com sucesso!' 
      };
    } catch (error) {
      console.error('Erro ao solicitar recuperação:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao solicitar recuperação de senha' 
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Redefinir senha
   * @param {Object} resetData - Dados para redefinir senha
   * @returns {Promise<Object>} Resultado da redefinição
   */
  const resetPassword = async (resetData) => {
    try {
      setLoading(true);
      await authService.resetPassword(resetData);
      
      return { 
        success: true, 
        message: 'Senha redefinida com sucesso!' 
      };
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao redefinir senha' 
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Atualizar dados do usuário
   * @param {Object} userData - Novos dados do usuário
   */
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  /**
   * Renovar token de acesso (via cookie HttpOnly)
   * @returns {Promise<boolean>} True se renovado com sucesso
   */
  const refreshToken = async () => {
    try {
      const result = await authService.refreshAccessToken();
      
      if (result && result.socketToken && result.usuario) {
        // Atualizar socketToken no Zustand
        setSocketToken(result.socketToken);
        
        setUser(result.usuario);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      await logout();
      return false;
    }
  };

  const isSuperAdmin = user?.role === 'superadmin';

  const contextValue = {
    user,
    loading,
    isAuthenticated,
    isSuperAdmin,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    updateUser,
    refreshToken,
    authService
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para usar o contexto de autenticação
 * @returns {Object} Contexto de autenticação
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
};

export default AuthProvider; 