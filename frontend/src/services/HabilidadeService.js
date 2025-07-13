/**
 * Serviço para gerenciar operações de Habilidade
 * Responsável pela comunicação com a API
  */
import generateGETparams from './generateGETparams';
export class HabilidadeService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/habilidades';
  }

  /**
   * Busca todas as habilidades
   * @returns {Promise<Array>} Lista de habilidades
   */
  async getAll(params) {
    
    try {
      const paramsString = generateGETparams(params);
      const response = await this.apiClient.get(this.baseUrl+paramsString);
      if(response.data?.success){ 
        return response.data?.data;
      }
      else{
        throw new Error(response.data?.message);
      }
    } catch (error) {
      throw new Error(`Erro ao buscar habilidades: ${error.message}`);
    }
  }

  /**
   * Busca habilidades ativas
   * @returns {Promise<Array>} Lista de habilidades ativas
   */
  async getAtivas() {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}?ativo=true`);
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao buscar habilidades ativas: ${error.message}`);
    }
  }

  /**
   * Busca uma habilidade por ID
   * @param {number} id - ID da habilidade
   * @returns {Promise<Object>} Habilidade encontrada
   */
  async getById(id) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao buscar habilidade: ${error.message}`);
    }
  }

  /**
   * Busca habilidades por tipo
   * @param {string} tipo - Tipo da habilidade
   * @returns {Promise<Array>} Lista de habilidades do tipo
   */
  async getByTipo(tipo) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}?tipo=${encodeURIComponent(tipo)}`);
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao buscar habilidades por tipo: ${error.message}`);
    }
  }

  /**
   * Busca habilidades por nome
   * @param {string} nome - Nome da habilidade
   * @returns {Promise<Array>} Lista de habilidades encontradas
   */
  async getByNome(nome) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}?nome=${encodeURIComponent(nome)}`);
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao buscar habilidades por nome: ${error.message}`);
    }
  }
} 