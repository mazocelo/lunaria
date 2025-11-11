import axios from 'axios';

// Configuração da URL base da API

// const baseURL = 'http://localhost:3001/';

const baseURL = 'https://lunaria-backend-3754d2d676ff.herokuapp.com';

// Criação da instância do axios
const axiosInstance = axios.create({
  baseURL,
  timeout: 25000,
  withCredentials: true, // Enviar cookies automaticamente
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor de requisições não é mais necessário
// Os cookies HttpOnly são enviados automaticamente pelo navegador

// Flag para evitar loop infinito de refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, success = null) => {
  failedQueue.forEach(prom => {
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
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Tratamento de erros de rede
    if (error.code === 'ECONNABORTED') {
      throw new Error('Timeout na requisição');
    }
    
    if (error.response) {
      // Erro com resposta do servidor
      const { status, data } = error.response;
      
      // Se for 401 e não for uma tentativa de refresh/login, tentar renovar token
      if (status === 401 && !originalRequest._retry && 
          !originalRequest.url.includes('/auth/login') && 
          !originalRequest.url.includes('/auth/renovar')) {
        
        if (isRefreshing) {
          // Se já está renovando, adicionar à fila
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(() => {
            // Cookie já foi atualizado, apenas repetir a requisição
            return axiosInstance(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Tentar renovar o token (refreshToken vem automaticamente do cookie)
          const response = await axiosInstance.post('/auth/renovar');

          // A resposta vem no formato: { success: true, data: { socketToken, usuario } }
          const responseData = response.data.data || response.data;
          
          // Cookies são atualizados automaticamente pelo backend
          // Processar fila de requisições pendentes
          processQueue(null, true);
          
          // Repetir requisição original (cookie atualizado automaticamente)
          return axiosInstance(originalRequest);
          
        } catch (refreshError) {
          // Falhou ao renovar token, limpar dados e processar fila
          processQueue(refreshError, null);
          localStorage.removeItem('user');
          localStorage.removeItem('lembrarDeMim');
          
          // Redirecionar para login se necessário
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          
          throw new Error('Sessão expirada. Faça login novamente.');
        } finally {
          isRefreshing = false;
        }
      }
      
      switch (status) {
        case 401:
          throw new Error('Não autorizado');
        case 403:
          throw new Error('Acesso negado');
        case 404:
          throw new Error('Recurso não encontrado');
        case 422:
          throw new Error(data?.message || 'Dados inválidos');
        case 500:
          throw new Error('Erro interno do servidor');
        default:
          throw new Error(data?.message || `Erro ${status}`);
      }
    } else if (error.request) {
      // Erro de rede
      throw new Error('Erro de conexão com o servidor');
    } else {
      // Outro tipo de erro
      throw new Error('Erro desconhecido');
    }
  }
);

// Classe principal do ApiClient
export class ApiClient {
  constructor() {
    this.client = axiosInstance;
  }

  async request(config) {
    try {
      const response = await this.client.request(config);
      
      // Processar resposta
      const contentType = response.headers['content-type'];
      let data = response.data;

      // Se for JSON, retornar diretamente
      if (contentType && contentType.includes('application/json')) {
        return data;
      }

      // Se for texto, tentar fazer parse como JSON
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          // Se não conseguir fazer parse, retornar como texto
          return data;
        }
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async get(url, config = {}) {
    return this.request({
      method: 'GET',
      url,
      ...config
    });
  }

  async post(url, data = {}, config = {}) {
    return this.request({
      method: 'POST',
      url,
      data,
      ...config
    });
  }

  async put(url, data = {}, config = {}) {
    return this.request({
      method: 'PUT',
      url,
      data,
      ...config
    });
  }

  async delete(url, config = {}) {
    return this.request({
      method: 'DELETE',
      url,
      ...config
    });
  }

  async patch(url, data = {}, config = {}) {
    return this.request({
      method: 'PATCH',
      url,
      data,
      ...config
    });
  }
}

// Instância exportada
export const apiClient = new ApiClient(); 