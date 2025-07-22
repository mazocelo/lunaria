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
      
      const token = authService.getToken();
      const userData = authService.getCurrentUser();
      
      if (token && userData) {
        // Validar token com o servidor
        const isValid = await authService.validateToken();
        
        if (isValid) {
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // Token inválido, limpar dados
          await logout();
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
      
      setUser(response.usuario);
      setIsAuthenticated(true);
      
      return { success: true, user: response.usuario };
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