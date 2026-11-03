import type { ApiClient, HttpError } from './ApiClient';

/**
 * Tipos locais minimos para o auth flow. TODO Fase 3: criar
 * `usuarioSchema` Zod em `src/types/api/usuario.ts` (fora do escopo da Fase 1).
 */
export interface UsuarioPayload {
  id: number | string;
  nome?: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

export interface AuthResponseData {
  socketToken?: string;
  usuario?: UsuarioPayload;
  lembrarDeMim?: boolean;
  [key: string]: unknown;
}

export interface LoginCredentials {
  email: string;
  senha: string;
  lembrarDeMim?: boolean;
}

export interface RegisterData {
  nome?: string;
  email: string;
  senha: string;
  [key: string]: unknown;
}

export interface ResetPasswordData {
  token: string;
  senha: string;
  [key: string]: unknown;
}

/**
 * Extrai o corpo util de uma resposta de auth: o backend envelopa em
 * `{ success, data }`, mas tambem aceitamos resposta nua para sobreviver a
 * variacoes do endpoint (alguns retornam direto). Sem schema validation aqui
 * — TODO Fase 3 quando `authResponseSchema` existir.
 */
function unwrapAuthResponse(response: unknown): AuthResponseData {
  if (typeof response === 'object' && response !== null) {
    const obj = response as { data?: unknown };
    if (obj.data && typeof obj.data === 'object') {
      return obj.data as AuthResponseData;
    }
    return response as AuthResponseData;
  }
  return {};
}

/**
 * Servico para operacoes de autenticacao. Gerencia tokens, login/logout,
 * registro e recuperacao de senha. O socketToken e o usuario sao retornados
 * para os contextos React; o refreshToken trafega via cookie HttpOnly.
 */
export class AuthService {
  private readonly apiClient: ApiClient;
  private readonly baseEndpoint: string;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.baseEndpoint = '/auth';
  }

  async login(credentials: LoginCredentials): Promise<AuthResponseData> {
    try {
      const response = await this.apiClient.post(`${this.baseEndpoint}/login`, credentials);
      const responseData = unwrapAuthResponse(response);

      if (responseData.usuario) {
        localStorage.setItem('user', JSON.stringify(responseData.usuario));
      }
      if (responseData.lembrarDeMim !== undefined) {
        localStorage.setItem('lembrarDeMim', String(responseData.lembrarDeMim));
      }

      return responseData;
    } catch (error) {
      console.error('Erro no login:', error);
      throw this.handleAuthError(error as HttpError);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.apiClient.post(`${this.baseEndpoint}/logout`);
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('lembrarDeMim');
    }
  }

  async register(userData: RegisterData): Promise<AuthResponseData> {
    try {
      const response = await this.apiClient.post(`${this.baseEndpoint}/registro`, userData);
      const responseData = unwrapAuthResponse(response);

      if (responseData.usuario) {
        localStorage.setItem('user', JSON.stringify(responseData.usuario));
      }

      return responseData;
    } catch (error) {
      console.error('Erro no registro:', error);
      throw this.handleAuthError(error as HttpError);
    }
  }

  /**
   * Verifica se o usuario esta autenticado consultando apenas o storage
   * local. O token real vive no cookie HttpOnly e nao e acessivel daqui.
   */
  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }

  getCurrentUser(): UsuarioPayload | null {
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    try {
      return JSON.parse(userData) as UsuarioPayload;
    } catch {
      return null;
    }
  }

  async validateToken(): Promise<boolean> {
    try {
      const response = await this.apiClient.get(`${this.baseEndpoint}/verificar`);
      if (typeof response === 'object' && response !== null && 'success' in response) {
        return (response as { success?: boolean }).success !== false;
      }
      return true;
    } catch (error) {
      console.error('Token inválido:', error);
      return false;
    }
  }

  /**
   * Renova access token via cookie HttpOnly. Em caso de falha limpa o
   * storage local e devolve `null` para o caller atualizar o estado.
   */
  async refreshAccessToken(): Promise<AuthResponseData | null> {
    try {
      const response = await this.apiClient.post(`${this.baseEndpoint}/renovar`);
      const responseData = unwrapAuthResponse(response);

      if (responseData.usuario) {
        localStorage.setItem('user', JSON.stringify(responseData.usuario));
      }

      return responseData;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('lembrarDeMim');
      return null;
    }
  }

  async forgotPassword(email: string): Promise<AuthResponseData> {
    try {
      const response = await this.apiClient.post(`${this.baseEndpoint}/forgot-password`, { email });
      return unwrapAuthResponse(response);
    } catch (error) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      throw this.handleAuthError(error as HttpError);
    }
  }

  async resetPassword(resetData: ResetPasswordData): Promise<AuthResponseData> {
    try {
      const response = await this.apiClient.post(`${this.baseEndpoint}/reset-password`, resetData);
      return unwrapAuthResponse(response);
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      throw this.handleAuthError(error as HttpError);
    }
  }

  /**
   * Traduz erros HTTP do ApiClient (que ja vem com `status` e `data`
   * preservados pelo interceptor) em mensagens user-friendly. O endpoint
   * `/auth` usa `data.error` em vez de `data.message`.
   */
  handleAuthError(error: HttpError): Error {
    const status =
      error.status ??
      (typeof error.response === 'object' && error.response !== null
        ? (error.response as { status?: number }).status
        : undefined);
    const data =
      error.data ??
      (typeof error.response === 'object' && error.response !== null
        ? (error.response as { data?: unknown }).data
        : undefined);

    if (status && data && typeof data === 'object') {
      const body = data as {
        error?: string | { details?: Array<{ msg?: string; message?: string }>; message?: string };
        message?: string;
        errors?: Array<{ msg?: string; message?: string }>;
      };
      const apiMessage =
        (typeof body.error === 'string' && body.error) || body.message || undefined;
      const messageOr = (fallback: string) => new Error(apiMessage || fallback);

      switch (status) {
        case 401:
          return messageOr('Credenciais inválidas');
        case 403:
          return messageOr('Acesso negado');
        case 422: {
          const details =
            (typeof body.error === 'object' && body.error?.details) || body.errors;
          if (Array.isArray(details) && details.length > 0) {
            return new Error(details.map((d) => d.msg || d.message).join('. '));
          }
          const errMessage =
            (typeof body.error === 'object' && body.error?.message) || apiMessage;
          return new Error(errMessage || 'Dados inválidos');
        }
        case 429:
          return messageOr('Muitas tentativas. Aguarde alguns minutos.');
        default:
          return messageOr('Erro no servidor');
      }
    }

    return new Error('Erro de rede. Verifique sua conexão.');
  }
}
