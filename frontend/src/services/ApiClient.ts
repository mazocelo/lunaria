import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

// Configuracao da URL base da API
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Criacao da instancia do axios
const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  timeout: 25000,
  withCredentials: true, // Enviar cookies automaticamente
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor de requisicoes nao e mais necessario
// Os cookies HttpOnly sao enviados automaticamente pelo navegador

/**
 * Erro HTTP enriquecido — o interceptor preserva status/data/response
 * para que consumidores (AuthService, validacoes 422 etc.) leiam a
 * mensagem real da API em vez de cair no fallback de rede.
 */
export interface HttpError extends Error {
  status?: number;
  data?: unknown;
  response?: unknown;
}

type RetryableRequestConfig = AxiosRequestConfig & { _retry?: boolean };

type QueuedRequest = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

// Flag para evitar loop infinito de refresh
let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 2;

const processQueue = (error: unknown, success: unknown = null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(success);
    }
  });

  failedQueue = [];
};

// Interceptor para respostas
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string }>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    // Tratamento de erros de rede
    if (error.code === 'ECONNABORTED') {
      throw new Error('Timeout na requisição');
    }

    if (error.response) {
      // Erro com resposta do servidor
      const { status, data } = error.response;

      // Se for 401 e nao for uma tentativa de refresh/login, tentar renovar token
      if (
        status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !originalRequest.url?.includes('/auth/login') &&
        !originalRequest.url?.includes('/auth/renovar')
      ) {
        if (isRefreshing) {
          // Se ja esta renovando, adicionar a fila
          return new Promise<unknown>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => {
              // Cookie ja foi atualizado, apenas repetir a requisicao
              return axiosInstance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        // Protecao contra loop infinito de refresh
        if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
          refreshAttempts = 0;
          localStorage.removeItem('user');
          localStorage.removeItem('lembrarDeMim');
          // Recarregar para voltar a tela de login (AuthContext detecta !isAuthenticated)
          window.location.reload();
          throw new Error('Sessão expirada. Faça login novamente.');
        }

        originalRequest._retry = true;
        isRefreshing = true;
        refreshAttempts++;

        try {
          // Tentar renovar o token (refreshToken vem automaticamente do cookie)
          await axiosInstance.post('/auth/renovar');

          // Cookies sao atualizados automaticamente pelo backend
          // Processar fila de requisicoes pendentes
          processQueue(null, true);
          refreshAttempts = 0; // Reset on success

          // Repetir requisicao original (cookie atualizado automaticamente)
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Falhou ao renovar token, limpar dados e processar fila
          processQueue(refreshError, null);
          refreshAttempts = 0;
          localStorage.removeItem('user');
          localStorage.removeItem('lembrarDeMim');

          // Recarregar para voltar a tela de login
          window.location.reload();
          throw new Error('Sessão expirada. Faça login novamente.');
        } finally {
          isRefreshing = false;
        }
      }

      let message: string;
      const body = (data ?? {}) as { message?: string };
      switch (status) {
        case 401: message = 'Não autorizado'; break;
        case 403: message = 'Acesso negado'; break;
        case 404: message = 'Recurso não encontrado'; break;
        case 422: message = body?.message || 'Dados inválidos'; break;
        case 429: message = body?.message || 'Muitas tentativas. Aguarde alguns minutos.'; break;
        case 500: message = 'Erro interno do servidor'; break;
        default: message = body?.message || `Erro ${status}`;
      }

      // Preserva status e corpo do erro para que os consumidores (ex.: AuthService)
      // possam extrair a mensagem real da API em vez de cair no fallback de rede.
      const httpError: HttpError = new Error(message);
      httpError.status = status;
      httpError.data = data;
      httpError.response = error.response;
      throw httpError;
    } else if (error.request) {
      // Erro de rede
      throw new Error('Erro de conexão com o servidor');
    } else {
      // Outro tipo de erro
      throw new Error('Erro desconhecido');
    }
  }
);

/**
 * Cliente HTTP base. Os metodos retornam `Promise<unknown>` PROPOSITALMENTE:
 * a validacao do shape e responsabilidade do service que faz a chamada,
 * via `parseEnvelope`/`parseRaw` dos schemas Zod em `@/types/api`. Tipar
 * aqui como `Promise<T>` esconderia o boundary de validacao e abriria
 * espaco para drift entre o que a API devolve e o que o front consome.
 */
export class ApiClient {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axiosInstance;
  }

  async request(config: AxiosRequestConfig): Promise<unknown> {
    const response = await this.client.request(config);

    // Processar resposta
    const contentType = response.headers['content-type'];
    let data: unknown = response.data;

    // Se for JSON, retornar diretamente
    if (typeof contentType === 'string' && contentType.includes('application/json')) {
      return data;
    }

    // Se for texto, tentar fazer parse como JSON
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        // Se nao conseguir fazer parse, retornar como texto
        return data;
      }
    }

    return data;
  }

  async get(url: string, config: AxiosRequestConfig = {}): Promise<unknown> {
    return this.request({
      method: 'GET',
      url,
      ...config
    });
  }

  async post(url: string, data: unknown = {}, config: AxiosRequestConfig = {}): Promise<unknown> {
    return this.request({
      method: 'POST',
      url,
      data,
      ...config
    });
  }

  async put(url: string, data: unknown = {}, config: AxiosRequestConfig = {}): Promise<unknown> {
    return this.request({
      method: 'PUT',
      url,
      data,
      ...config
    });
  }

  async delete(url: string, config: AxiosRequestConfig = {}): Promise<unknown> {
    return this.request({
      method: 'DELETE',
      url,
      ...config
    });
  }

  async patch(url: string, data: unknown = {}, config: AxiosRequestConfig = {}): Promise<unknown> {
    return this.request({
      method: 'PATCH',
      url,
      data,
      ...config
    });
  }
}

// Instancia exportada
export const apiClient = new ApiClient();
