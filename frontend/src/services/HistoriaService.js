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
      // Verificação mais robusta da estrutura de resposta
      if (response.success) {
        // ✅ NORMALIZAR dados usando Historia.fromAPI() conforme API documentation
        return response
      } else {
        throw new Error(response.data?.message || 'Erro desconhecido');
      }

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

      // Verificação mais robusta da estrutura de resposta
      if (response.data) {
        if (response.data.success !== undefined) {
          if (response.data.success) {
            // ✅ USAR Historia.fromAPI() para normalizar dados conforme API documentation
            return Historia.fromAPI(response.data.data);
          } else {
            throw new Error(response.data?.message || 'Erro desconhecido');
          }
        } else {
          // Se não tem a estrutura success, assume que a resposta é direta
          return Historia.fromAPI(response.data);
        }
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (error) {
      throw new Error(`Erro ao buscar história: ${error.message}`);
    }
  }

  /**
   * Cria uma nova história
   * @param {Historia|Object} historia - Dados da história (instância ou objeto simples)
   * @returns {Promise<Historia>} História criada
   */
  async create(historia) {
    try {
      // Criar instância da classe Historia se necessário
      let historiaInstance;
      if (historia instanceof Historia) {
        historiaInstance = historia;
      } else {
        historiaInstance = new Historia(historia);
      }

      // Validar antes de enviar
      const validation = historiaInstance.validate();
      if (!validation.isValid) {
        throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
      }

      const response = await this.apiClient.post(this.baseUrl + '/create', historiaInstance.toJSON());

      // Verificação mais robusta da estrutura de resposta
      if (response.data) {
        if (response.data.success !== undefined) {
          if (response.data.success) {
            return Historia.fromAPI(response.data.data);
          } else {
            throw new Error(response.data?.message || 'Erro desconhecido');
          }
        } else {
          return Historia.fromAPI(response.data);
        }
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (error) {
      throw new Error(`Erro ao criar história: ${error.message}`);
    }
  }

  /**
   * Atualiza uma história existente
   * @param {number} id - ID da história
   * @param {Historia|Object} historia - Dados atualizados (instância ou objeto simples)
   * @returns {Promise<Historia>} História atualizada
   */
  async update(id, historia) {
    try {
      // Se for instância completa de Historia, validar e enviar tudo
      // Se for objeto parcial (ex: { mestre_id: 5 }), enviar apenas os campos fornecidos
      let payload;
      if (historia instanceof Historia) {
        const validation = historia.validate();
        if (!validation.isValid) {
          throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
        }
        payload = historia.toJSON();
      } else {
        // Partial update — enviar apenas campos fornecidos
        payload = { ...historia };
      }

      const response = await this.apiClient.put(`${this.baseUrl}/${id}`, payload);

      // Verificação mais robusta da estrutura de resposta
      if (response.data) {
        if (response.data.success !== undefined) {
          if (response.data.success) {
            return Historia.fromAPI(response.data.data);
          } else {
            throw new Error(response.data?.message || 'Erro desconhecido');
          }
        } else {
          return Historia.fromAPI(response.data);
        }
      } else {
        throw new Error('Resposta inválida da API');
      }
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
      throw new Error(`Erro ao remover história: ${error.message}`);
    }
  }

  /**
   * Resetar/zerar sessão de jogo ativa
   * @param {number} historiaId - ID da história
   * @returns {Promise<Object>} Resposta da API
   */
  async resetarSessao(historiaId) {
    try {
      const response = await this.apiClient.delete(`/jogo/reset/${historiaId}`);

      // Verificação da estrutura de resposta
      if (response.data) {
        if (response.data.success !== undefined) {
          if (response.data.success) {
            return response.data;
          } else {
            throw new Error(response.data?.error || response.data?.message || 'Erro desconhecido');
          }
        }
        return response.data;
      }

      return response;
    } catch (error) {
      throw new Error(`Erro ao resetar sessão: ${error.message}`);
    }
  }

  async encerrarSessao(historiaId) {
    try {
      const response = await this.apiClient.delete(`/jogo/encerrar/${historiaId}`);

      if (response.data) {
        if (response.data.success !== undefined) {
          if (response.data.success) {
            return response.data;
          } else {
            throw new Error(response.data?.error || response.data?.message || 'Erro desconhecido');
          }
        }
        return response.data;
      }

      return response;
    } catch (error) {
      throw new Error(`Erro ao encerrar sessão: ${error.message}`);
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

  /**
   * Envia convite por email para uma história
   * @param {number} historia_id - ID da história
   * @param {string} email - Email do jogador a ser convidado
   * @returns {Promise<Object>} Resultado do convite
   */
  async enviarConvite(historia_id, email) {
    try {
      if (!historia_id || !email) {
        throw new Error('ID da história e email são obrigatórios');
      }

      // Validar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Email inválido');
      }

      const response = await this.apiClient.post('/convites', {
        historia_id,
        email
      });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || response.message || 'Erro ao enviar convite');
      }
    } catch (error) {
      throw new Error(`Erro ao enviar convite: ${error.message}`);
    }
  }

  /**
   * Verifica se há sessão ativa para uma história
   * @param {number} historiaId - ID da história
   * @returns {Promise<Object>} Dados da sessão ativa
   */
  async verificarSessaoAtiva(historiaId) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}/${historiaId}/sessao-ativa`);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao verificar sessão');
      }
    } catch (error) {
      throw new Error(`Erro ao verificar sessão ativa: ${error.message}`);
    }
  }

  /**
   * Busca status completo de uma sessão de jogo
   * @param {number} historiaId - ID da história
   * @returns {Promise<Object>} Dados completos da sessão
   */
  async getStatusJogo(historiaId) {
    try {
      const response = await this.apiClient.get(`/jogo/status/${historiaId}`);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao buscar status do jogo');
      }
    } catch (error) {
      throw new Error(`Erro ao buscar status do jogo: ${error.message}`);
    }
  }
} 