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
      const data = await this.apiClient.get(this.baseUrl);
      if (data.success) {
        // ✅ NORMALIZAR dados usando Personagem.fromAPI() conforme API documentation
        return data.data.map(personagemData => Personagem.fromAPI(personagemData));
      } else {
        throw new Error(data?.message || 'Erro desconhecido');
      }
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

      // Verificação mais robusta da estrutura de resposta
      if (response.data) {
        if (response.data.success !== undefined) {
          if (response.data.success) {
            // ✅ NORMALIZAR dados usando Personagem.fromAPI() conforme API documentation
            return Personagem.fromAPI(response.data.data);
          } else {
            throw new Error(response.data?.message || 'Erro desconhecido');
          }
        } else {
          // Se não tem a estrutura success, assume que a resposta é direta
          return Personagem.fromAPI(response.data);
        }
      } else {
        throw new Error('Resposta inválida da API');
      }
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

      // Verificação mais robusta da estrutura de resposta
      if (response.data) {
        if (response.data.success !== undefined) {
          if (response.data.success) {
            return Personagem.fromAPI(response.data.data);
          } else {
            throw new Error(response.data?.message || 'Erro desconhecido');
          }
        } else {
          return Personagem.fromAPI(response.data);
        }
      } else {
        throw new Error('Resposta inválida da API');
      }
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
  async update(id, personagemData) {
    try {
      // Se for uma instância de Personagem, validar e converter
      let dadosEnvio = personagemData;
      if (personagemData.validate && personagemData.toJSON) {
        const validation = personagemData.validate();
        if (!validation.isValid) {
          throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
        }
        dadosEnvio = personagemData.toJSON();
      }

      const response = await this.apiClient.put(`${this.baseUrl}/${id}`, dadosEnvio);

      // Verificação mais robusta da estrutura de resposta
      if (response.data) {
        if (response.data.success !== undefined) {
          if (response.data.success) {
            return Personagem.fromAPI(response.data.data);
          } else {
            throw new Error(response.data?.message || 'Erro desconhecido');
          }
        } else {
          return Personagem.fromAPI(response.data);
        }
      } else {
        throw new Error('Resposta inválida da API');
      }
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
      const response = await this.apiClient.delete(`${this.baseUrl}/${id}`);

      // Verificação mais robusta da estrutura de resposta
      if (response.data) {
        if (response.data.success !== undefined) {
          if (response.data.success) {
            return response.data.data;
          } else {
            throw new Error(response.data?.message || 'Erro desconhecido');
          }
        } else {
          return response.data;
        }
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (error) {
      throw new Error(`Erro ao remover personagem: ${error.message}`);
    }
  }

  /**
   * Busca personagens por história
   * @param {number} historiaId - ID da história
   * @param {Object} options - Opções de busca (search, limit, offset, status)
   * @returns {Promise<Object>} Resposta completa com personagens, história e paginação
   */
  async getByHistoria(historiaId, options = {}) {
    try {
      const queryParams = new URLSearchParams();

      // Adicionar parâmetros de busca se fornecidos
      if (options.search) queryParams.append('search', options.search);
      if (options.limit) queryParams.append('limit', options.limit);
      if (options.offset) queryParams.append('offset', options.offset);

      const url = `${this.baseUrl}/historia/${historiaId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await this.apiClient.get(url);

      if (response.success) {
        // ✅ RETORNAR RESPOSTA COMPLETA conforme API documentation:
        // { success: true, data: "array", historia: {...}, pagination: {...}, message: "string" }
        return {
          personagens: response.data.map(personagemData => Personagem.fromAPI(personagemData)),
          historia: response.historia || null,
          pagination: response.pagination || null,
          message: response.message || null,
          total: response.pagination?.total || response.data?.length || 0
        };
      } else {
        throw new Error(response.message || response.error || 'Erro desconhecido');
      }
    } catch (error) {
      throw new Error(`Erro ao buscar personagens por história: ${error.message}`);
    }
  }

  /**
   * Busca personagens por usuário e história
   * @param {number} usuarioId - ID do usuário
   * @param {number} historiaId - ID da história
   * @param {Object} options - Opções de busca (search, limit, offset, status)
   * @returns {Promise<Object>} Resposta completa com personagens, história e paginação
   */
  async getByUsuarioEHistoria(usuarioId, historiaId, options = {}) {
    try {
      const queryParams = new URLSearchParams();

      // Adicionar parâmetros de busca se fornecidos
      if (options.search) queryParams.append('search', options.search);
      if (options.limit) queryParams.append('limit', options.limit);
      if (options.offset) queryParams.append('offset', options.offset);

      const url = `${this.baseUrl}/historia/${historiaId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await this.apiClient.get(url);

      if (response.success) {
        return {
          personagens: response.data.map(personagemData => Personagem.fromAPI(personagemData)),
          historia: response.historia || null,
          pagination: response.pagination || null,
          message: response.message || null,
          total: response.pagination?.total || response.data?.length || 0
        };
      } else {
        throw new Error(response.message || response.error || 'Erro desconhecido');
      }
    } catch (error) {
      throw new Error(`Erro ao buscar personagens por usuário e história: ${error.message}`);
    }
  }

  /**
   * Gera background via IA com todos os dados da ficha
   * @param {number} id - ID do personagem
   * @param {string} sugestao - Sugestão do jogador para o background
   * @returns {Promise<Object>} { background: string }
   */
  async gerarBackground(id, sugestao = '') {
    try {
      const response = await this.apiClient.post(`${this.baseUrl}/${id}/background`, {
        sugestao_background: sugestao
      });
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao gerar background');
      }
    } catch (error) {
      throw new Error(`Erro ao gerar background: ${error.message}`);
    }
  }

  /**
   * Valida coerência narrativa do personagem via IA
   * @param {number} id - ID do personagem
   * @returns {Promise<{ valido: boolean, avisos: string[], sugestoes: string[] }>}
   */
  async validarCoerencia(id) {
    try {
      const response = await this.apiClient.post(`${this.baseUrl}/${id}/validar-coerencia`);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao validar coerência');
      }
    } catch (error) {
      throw new Error(`Erro ao validar coerência: ${error.message}`);
    }
  }

  /**
   * Obtém dados de evolução do personagem (XP, pontos pendentes, etc.)
   * @param {number} id - ID do personagem
   * @returns {Promise<Object>} Dados de evolução
   */
  async obterEvolucao(id) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}/${id}/evolucao`);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao obter evolução');
      }
    } catch (error) {
      throw new Error(`Erro ao obter evolução: ${error.message}`);
    }
  }

  /**
   * Concede XP ao personagem
   * @param {number} id - ID do personagem
   * @param {number} quantidade - Quantidade de XP
   * @returns {Promise<Object>} Resultado com XP atualizado e possível level up
   */
  async ganharXP(id, quantidade) {
    try {
      const response = await this.apiClient.post(`${this.baseUrl}/${id}/ganhar-xp`, { quantidade });
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao conceder XP');
      }
    } catch (error) {
      throw new Error(`Erro ao conceder XP: ${error.message}`);
    }
  }

  /**
   * Distribui pontos de atributo pendentes
   * @param {number} id - ID do personagem
   * @param {Object} atributos - Ex: { forca: 1, destreza: 2 }
   * @returns {Promise<Object>} Personagem atualizado
   */
  async distribuirPontos(id, atributos) {
    try {
      const response = await this.apiClient.post(`${this.baseUrl}/${id}/distribuir-pontos`, { atributos });
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao distribuir pontos');
      }
    } catch (error) {
      throw new Error(`Erro ao distribuir pontos: ${error.message}`);
    }
  }

  /**
   * Lista equipamentos do personagem
   * @param {number} id - ID do personagem
   * @returns {Promise<Array>} Equipamentos com dados completos
   */
  async listarEquipamentos(id) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}/${id}/equipamentos`);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao listar equipamentos');
      }
    } catch (error) {
      throw new Error(`Erro ao listar equipamentos: ${error.message}`);
    }
  }

  /**
   * Adiciona equipamento ao inventario do personagem
   * @param {number} personagemId - ID do personagem
   * @param {number} equipamentoId - ID do equipamento
   * @returns {Promise<Object>}
   */
  async adicionarEquipamento(personagemId, equipamentoId) {
    try {
      const response = await this.apiClient.post(`${this.baseUrl}/${personagemId}/equipamentos`, {
        equipamento_id: equipamentoId
      });
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao adicionar equipamento');
      }
    } catch (error) {
      throw new Error(`Erro ao adicionar equipamento: ${error.message}`);
    }
  }

  /**
   * Remove equipamento do inventario do personagem
   * @param {number} personagemId - ID do personagem
   * @param {number} equipamentoId - ID do equipamento
   * @returns {Promise<void>}
   */
  async removerEquipamento(personagemId, equipamentoId) {
    try {
      const response = await this.apiClient.delete(`${this.baseUrl}/${personagemId}/equipamentos/${equipamentoId}`);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao remover equipamento');
      }
    } catch (error) {
      throw new Error(`Erro ao remover equipamento: ${error.message}`);
    }
  }
} 