import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  AuthService,
  type UsuarioPayload,
  type LoginCredentials,
  type RegisterData,
  type ResetPasswordData,
} from '../services/AuthService';
import { apiClient } from '../services/ApiClient';
import { useSocketStore } from '../store/socket';

export interface AuthSuccessResult {
  success: true;
  user: UsuarioPayload | undefined;
  lembrarDeMim?: boolean;
}

export interface AuthFailureResult {
  success: false;
  error: string;
}

export interface AuthMessageResult {
  success: true;
  message: string;
}

export type AuthOperationResult = AuthSuccessResult | AuthFailureResult;
export type AuthPasswordResult = AuthMessageResult | AuthFailureResult;

export interface AuthContextValue {
  user: UsuarioPayload | null;
  loading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthOperationResult>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<AuthOperationResult>;
  forgotPassword: (email: string) => Promise<AuthPasswordResult>;
  resetPassword: (resetData: ResetPasswordData) => Promise<AuthPasswordResult>;
  updateUser: (userData: UsuarioPayload) => void;
  refreshToken: () => Promise<boolean>;
  authService: AuthService;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UsuarioPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Instancia do AuthService
  const authService = new AuthService(apiClient);

  // Acesso ao socket store para gerenciar socketToken
  const setSocketToken = useSocketStore((state) => state.setSocketToken);
  const clearSocketToken = useSocketStore((state) => state.clearSocketToken);
  const disconnectSocket = useSocketStore((state) => state.disconnect);

  useEffect(() => {
    // Verificar se ha usuario logado ao inicializar
    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Inicializar estado de autenticacao
   */
  const initializeAuth = async () => {
    try {
      setLoading(true);

      const userData = authService.getCurrentUser();

      if (userData) {
        // Usuario existe no localStorage, considerar autenticado.
        // O backend validara o cookie HttpOnly automaticamente.
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
   * Realizar login.
   *
   * `loading` global controla a verificacao inicial de auth (App.jsx troca a
   * tela inteira por ele). O login NAO deve mexer nele: isso desmontaria a
   * tela de login durante a requisicao e descartaria o feedback de erro.
   */
  const login = async (credentials: LoginCredentials): Promise<AuthOperationResult> => {
    try {
      const response = await authService.login(credentials);

      // Verificar se recebemos socketToken e dados do usuario
      if (response.socketToken && response.usuario) {
        // Armazenar socketToken no Zustand
        setSocketToken(response.socketToken);

        setUser(response.usuario);
        setIsAuthenticated(true);

        return {
          success: true,
          user: response.usuario,
          lembrarDeMim: response.lembrarDeMim,
        };
      } else {
        throw new Error('Resposta de login inválida');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      const message = error instanceof Error ? error.message : 'Erro ao fazer login';
      return { success: false, error: message };
    }
  };

  /**
   * Realizar logout
   */
  const logout = async (): Promise<void> => {
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
   * Registrar novo usuario.
   *
   * Mesmo motivo do `login`: nao mexer no `loading` global para nao desmontar
   * a tela de registro durante a requisicao.
   */
  const register = async (userData: RegisterData): Promise<AuthOperationResult> => {
    try {
      const response = await authService.register(userData);

      setUser(response.usuario ?? null);
      setIsAuthenticated(true);

      return { success: true, user: response.usuario };
    } catch (error) {
      console.error('Erro no registro:', error);
      const message = error instanceof Error ? error.message : 'Erro ao registrar usuário';
      return { success: false, error: message };
    }
  };

  /**
   * Solicitar recuperacao de senha
   */
  const forgotPassword = async (email: string): Promise<AuthPasswordResult> => {
    try {
      setLoading(true);
      await authService.forgotPassword(email);

      return {
        success: true,
        message: 'Email de recuperação enviado com sucesso!',
      };
    } catch (error) {
      console.error('Erro ao solicitar recuperação:', error);
      const message =
        error instanceof Error ? error.message : 'Erro ao solicitar recuperação de senha';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Redefinir senha
   */
  const resetPassword = async (resetData: ResetPasswordData): Promise<AuthPasswordResult> => {
    try {
      setLoading(true);
      await authService.resetPassword(resetData);

      return {
        success: true,
        message: 'Senha redefinida com sucesso!',
      };
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      const message = error instanceof Error ? error.message : 'Erro ao redefinir senha';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Atualizar dados do usuario
   */
  const updateUser = (userData: UsuarioPayload): void => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  /**
   * Renovar token de acesso (via cookie HttpOnly).
   * Retorna true se renovado com sucesso.
   */
  const refreshToken = async (): Promise<boolean> => {
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

  const contextValue: AuthContextValue = {
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
    authService,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

/**
 * Hook para usar o contexto de autenticacao — fail-loud fora do Provider.
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
};

export default AuthProvider;
