import axios from 'axios';

// Configuração da URL base da API
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Criação da instância do axios
const axiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para requisições
axiosInstance.interceptors.request.use(
  (config) => {
    // Adicionar token de autenticação se disponível
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para respostas
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Tratamento de erros de rede
    if (error.code === 'ECONNABORTED') {
      throw new Error('Timeout na requisição');
    }
    
    if (error.response) {
      // Erro com resposta do servidor
      const { status, data } = error.response;
      
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