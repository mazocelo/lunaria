import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '../services/AuthService';
import { apiClient } from '../services/ApiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Instância do AuthService
  const authService = new AuthService(apiClient);

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
      
      const accessToken = authService.getAccessToken();
      const userData = authService.getCurrentUser();
      
      if (accessToken && userData) {
        // Verificar se o token está expirado
        if (authService.isTokenExpired(accessToken)) {
          // Token expirado, tentar renovar
          const refreshResult = await authService.refreshAccessToken();
          
          if (refreshResult) {
            setUser(refreshResult.usuario || userData);
            setIsAuthenticated(true);
          } else {
            // Falhou ao renovar, fazer logout
            await logout();
          }
        } else {
          // Token ainda válido
          setUser(userData);
          setIsAuthenticated(true);
        }
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
      
      // Verificar se recebemos os tokens necessários
      if (response.accessToken && response.refreshToken && response.usuario) {
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
   * Renovar token de acesso
   * @returns {Promise<boolean>} True se renovado com sucesso
   */
  const refreshToken = async () => {
    try {
      const result = await authService.refreshAccessToken();
      
      if (result && result.usuario) {
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

  /**
   * Verificar se o token está próximo do vencimento e renovar se necessário
   * @returns {Promise<boolean>} True se token válido ou renovado
   */
  const ensureTokenValidity = async () => {
    const accessToken = authService.getAccessToken();
    
    if (!accessToken) {
      return false;
    }

    // Se o token está próximo do vencimento, renovar
    if (authService.isTokenNearExpiry()) {
      return await refreshToken();
    }

    return true;
  };

  const contextValue = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    updateUser,
    refreshToken,
    ensureTokenValidity,
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