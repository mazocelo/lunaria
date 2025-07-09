import { Historia } from '../models/Historia';

/**
 * Serviço para gerenciar operações de História
 * Responsável pela comunicação com a API
 */
export class HistoriaService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/historias';
  }

  /**
   * Busca todas as histórias
   * @returns {Promise<Historia[]>} Lista de histórias
   */
  async getAll() {
    try {
      const response = await this.apiClient.get(this.baseUrl);
      return response.data.map(historiaData => Historia.fromAPI(historiaData));
    } catch (error) {
      throw new Error(`Erro ao buscar histórias: ${error.message}`);
    }
  }

  /**
   * Busca uma história por ID
   * @param {number} id - ID da história
   * @returns {Promise<Historia>} História encontrada
   */
  async getById(id) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}/${id}`);
      return Historia.fromAPI(response.data);
    } catch (error) {
      throw new Error(`Erro ao buscar história: ${error.message}`);
    }
  }

  /**
   * Cria uma nova história
   * @param {Historia} historia - Dados da história
   * @returns {Promise<Historia>} História criada
   */
  async create(historia) {
    try {
      // Validar antes de enviar
      const validation = historia.validate();
      if (!validation.isValid) {
        throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
      }

      const response = await this.apiClient.post(this.baseUrl, historia.toJSON());
      return Historia.fromAPI(response.data);
    } catch (error) {
      throw new Error(`Erro ao criar história: ${error.message}`);
    }
  }

  /**
   * Atualiza uma história existente
   * @param {number} id - ID da história
   * @param {Historia} historia - Dados atualizados
   * @returns {Promise<Historia>} História atualizada
   */
  async update(id, historia) {
    try {
      // Validar antes de enviar
      const validation = historia.validate();
      if (!validation.isValid) {
        throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
      }

      const response = await this.apiClient.put(`${this.baseUrl}/${id}`, historia.toJSON());
      return Historia.fromAPI(response.data);
    } catch (error) {
      throw new Error(`Erro ao atualizar história: ${error.message}`);
    }
  }

  /**
   * Remove uma história
   * @param {number} id - ID da história
   * @returns {Promise<void>}
   */
  async delete(id) {
    try {
      await this.apiClient.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      throw new Error(`Erro ao remover história: ${error.message}`);
    }
  }

  /**
   * Busca histórias por tema
   * @param {number} temaId - ID do tema
   * @returns {Promise<Historia[]>} Lista de histórias do tema
   */
  async getByTema(temaId) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}?tema_id=${temaId}`);
      return response.data.map(historiaData => Historia.fromAPI(historiaData));
    } catch (error) {
      throw new Error(`Erro ao buscar histórias por tema: ${error.message}`);
    }
  }

  /**
   * Busca histórias com filtros
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Historia[]>} Lista de histórias filtradas
   */
  async getWithFilters(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });

      const response = await this.apiClient.get(`${this.baseUrl}?${queryParams.toString()}`);
      return response.data.map(historiaData => Historia.fromAPI(historiaData));
    } catch (error) {
      throw new Error(`Erro ao buscar histórias com filtros: ${error.message}`);
    }
  }
} 