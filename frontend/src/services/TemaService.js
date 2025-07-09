import { Tema } from '../models/Tema';

/**
 * Serviço para gerenciar operações de Tema
 * Responsável pela comunicação com a API
 */
export class TemaService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/temas';
  }

  /**
   * Busca todos os temas
   * @returns {Promise<Tema[]>} Lista de temas
   */
  async getAll() {
    try {
      const response = await this.apiClient.get(this.baseUrl);
      return response.data.map(temaData => Tema.fromAPI(temaData));
    } catch (error) {
      throw new Error(`Erro ao buscar temas: ${error.message}`);
    }
  }

  /**
   * Busca temas ativos
   * @returns {Promise<Tema[]>} Lista de temas ativos
   */
  async getAtivos() {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}?ativo=true`);
      return response.data.map(temaData => Tema.fromAPI(temaData));
    } catch (error) {
      throw new Error(`Erro ao buscar temas ativos: ${error.message}`);
    }
  }

  /**
   * Busca um tema por ID
   * @param {number} id - ID do tema
   * @returns {Promise<Tema>} Tema encontrado
   */
  async getById(id) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}/${id}`);
      return Tema.fromAPI(response.data);
    } catch (error) {
      throw new Error(`Erro ao buscar tema: ${error.message}`);
    }
  }

  /**
   * Cria um novo tema
   * @param {Tema} tema - Dados do tema
   * @returns {Promise<Tema>} Tema criado
   */
  async create(tema) {
    try {
      // Validar antes de enviar
      const validation = tema.validate();
      if (!validation.isValid) {
        throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
      }

      const response = await this.apiClient.post(this.baseUrl, tema.toJSON());
      return Tema.fromAPI(response.data);
    } catch (error) {
      throw new Error(`Erro ao criar tema: ${error.message}`);
    }
  }

  /**
   * Atualiza um tema existente
   * @param {number} id - ID do tema
   * @param {Tema} tema - Dados atualizados
   * @returns {Promise<Tema>} Tema atualizado
   */
  async update(id, tema) {
    try {
      // Validar antes de enviar
      const validation = tema.validate();
      if (!validation.isValid) {
        throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
      }

      const response = await this.apiClient.put(`${this.baseUrl}/${id}`, tema.toJSON());
      return Tema.fromAPI(response.data);
    } catch (error) {
      throw new Error(`Erro ao atualizar tema: ${error.message}`);
    }
  }

  /**
   * Remove um tema
   * @param {number} id - ID do tema
   * @returns {Promise<void>}
   */
  async delete(id) {
    try {
      await this.apiClient.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      throw new Error(`Erro ao remover tema: ${error.message}`);
    }
  }

  /**
   * Ativa um tema
   * @param {number} id - ID do tema
   * @returns {Promise<Tema>} Tema ativado
   */
  async ativar(id) {
    try {
      const response = await this.apiClient.patch(`${this.baseUrl}/${id}/ativar`);
      return Tema.fromAPI(response.data);
    } catch (error) {
      throw new Error(`Erro ao ativar tema: ${error.message}`);
    }
  }

  /**
   * Desativa um tema
   * @param {number} id - ID do tema
   * @returns {Promise<Tema>} Tema desativado
   */
  async desativar(id) {
    try {
      const response = await this.apiClient.patch(`${this.baseUrl}/${id}/desativar`);
      return Tema.fromAPI(response.data);
    } catch (error) {
      throw new Error(`Erro ao desativar tema: ${error.message}`);
    }
  }

  /**
   * Busca temas por nome
   * @param {string} nome - Nome do tema
   * @returns {Promise<Tema[]>} Lista de temas encontrados
   */
  async getByNome(nome) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}?nome=${encodeURIComponent(nome)}`);
      return response.data.map(temaData => Tema.fromAPI(temaData));
    } catch (error) {
      throw new Error(`Erro ao buscar temas por nome: ${error.message}`);
    }
  }
} 