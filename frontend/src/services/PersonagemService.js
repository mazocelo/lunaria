import { Personagem } from '../models/Personagem';

/**
 * Serviço para gerenciar operações de Personagem
 * Responsável pela comunicação com a API
 */
export class PersonagemService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/personagens';
  }

  /**
   * Busca todos os personagens
   * @returns {Promise<Personagem[]>} Lista de personagens
   */
  async getAll() {
    try {
      const response = await this.apiClient.get(this.baseUrl);
      return response.data.map(personagemData => Personagem.fromAPI(personagemData));
    } catch (error) {
      throw new Error(`Erro ao buscar personagens: ${error.message}`);
    }
  }

  /**
   * Busca um personagem por ID
   * @param {number} id - ID do personagem
   * @returns {Promise<Personagem>} Personagem encontrado
   */
  async getById(id) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}/${id}`);
      return Personagem.fromAPI(response.data);
    } catch (error) {
      throw new Error(`Erro ao buscar personagem: ${error.message}`);
    }
  }

  /**
   * Cria um novo personagem
   * @param {Personagem} personagem - Dados do personagem
   * @returns {Promise<Personagem>} Personagem criado
   */
  async create(personagem) {
    try {
      // Validar antes de enviar
      const validation = personagem.validate();
      if (!validation.isValid) {
        throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
      }

      const response = await this.apiClient.post(this.baseUrl, personagem.toJSON());
      return Personagem.fromAPI(response.data);
    } catch (error) {
      throw new Error(`Erro ao criar personagem: ${error.message}`);
    }
  }

  /**
   * Atualiza um personagem existente
   * @param {number} id - ID do personagem
   * @param {Personagem} personagem - Dados atualizados
   * @returns {Promise<Personagem>} Personagem atualizado
   */
  async update(id, personagem) {
    try {
      // Validar antes de enviar
      const validation = personagem.validate();
      if (!validation.isValid) {
        throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
      }

      const response = await this.apiClient.put(`${this.baseUrl}/${id}`, personagem.toJSON());
      return Personagem.fromAPI(response.data);
    } catch (error) {
      throw new Error(`Erro ao atualizar personagem: ${error.message}`);
    }
  }

  /**
   * Remove um personagem
   * @param {number} id - ID do personagem
   * @returns {Promise<void>}
   */
  async delete(id) {
    try {
      await this.apiClient.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      throw new Error(`Erro ao remover personagem: ${error.message}`);
    }
  }

  /**
   * Busca personagens por história
   * @param {number} historiaId - ID da história
   * @returns {Promise<Personagem[]>} Lista de personagens da história
   */
  async getByHistoria(historiaId) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}?historia_id=${historiaId}`);
      return response.data.map(personagemData => Personagem.fromAPI(personagemData));
    } catch (error) {
      throw new Error(`Erro ao buscar personagens por história: ${error.message}`);
    }
  }

  /**
   * Busca personagens por classe
   * @param {string} classe - Classe do personagem
   * @returns {Promise<Personagem[]>} Lista de personagens da classe
   */
  async getByClasse(classe) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}?classe=${classe}`);
      return response.data.map(personagemData => Personagem.fromAPI(personagemData));
    } catch (error) {
      throw new Error(`Erro ao buscar personagens por classe: ${error.message}`);
    }
  }

  /**
   * Busca personagens com filtros
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Personagem[]>} Lista de personagens filtrados
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
      return response.data.map(personagemData => Personagem.fromAPI(personagemData));
    } catch (error) {
      throw new Error(`Erro ao buscar personagens com filtros: ${error.message}`);
    }
  }

  /**
   * Atualiza HP de um personagem
   * @param {number} id - ID do personagem
   * @param {number} novoHP - Novo valor de HP
   * @returns {Promise<Personagem>} Personagem atualizado
   */
  async updateHP(id, novoHP) {
    try {
      const response = await this.apiClient.patch(`${this.baseUrl}/${id}/hp`, { hp: novoHP });
      return Personagem.fromAPI(response.data);
    } catch (error) {
      throw new Error(`Erro ao atualizar HP: ${error.message}`);
    }
  }

  /**
   * Aumenta nível de um personagem
   * @param {number} id - ID do personagem
   * @returns {Promise<Personagem>} Personagem atualizado
   */
  async levelUp(id) {
    try {
      const response = await this.apiClient.patch(`${this.baseUrl}/${id}/level-up`);
      return Personagem.fromAPI(response.data);
    } catch (error) {
      throw new Error(`Erro ao aumentar nível: ${error.message}`);
    }
  }
} 