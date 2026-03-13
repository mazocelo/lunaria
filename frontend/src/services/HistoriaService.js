import { Historia } from '../models/Historia';

/**
 * Servico para gerenciar operacoes de Historia
 */
export class HistoriaService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/historias';
  }

  asListResponse(response) {
    const data = response?.success ? response.data : response;
    return Array.isArray(data) ? data : [];
  }

  asEntityResponse(response) {
    if (response?.success === false) {
      throw new Error(response?.message || response?.error || 'Erro desconhecido');
    }
    if (response?.success === true) {
      return response.data;
    }
    return response;
  }

  async getAll() {
    try {
      const response = await this.apiClient.get(this.baseUrl);
      if (response?.success) return response;
      throw new Error(response?.message || 'Erro desconhecido');
    } catch (error) {
      throw new Error(`Erro ao buscar historias: ${error.message}`);
    }
  }

  async getPublicas(params = {}) {
    try {
      const queryParams = new URLSearchParams({ todas: 'true', ...params });
      const response = await this.apiClient.get(`${this.baseUrl}?${queryParams}`);
      if (response?.success) return response;
      throw new Error(response?.message || 'Erro desconhecido');
    } catch (error) {
      throw new Error(`Erro ao buscar historias publicas: ${error.message}`);
    }
  }

  async getById(id) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}/${id}`);
      const data = this.asEntityResponse(response);
      return Historia.fromAPI(data);
    } catch (error) {
      throw new Error(`Erro ao buscar historia: ${error.message}`);
    }
  }

  async create(historia) {
    try {
      const historiaInstance = historia instanceof Historia ? historia : new Historia(historia);
      const validation = historiaInstance.validate();
      if (!validation.isValid) {
        throw new Error(`Dados invalidos: ${validation.errors.join(', ')}`);
      }

      const response = await this.apiClient.post(`${this.baseUrl}/create`, historiaInstance.toJSON());
      const data = this.asEntityResponse(response);
      return Historia.fromAPI(data);
    } catch (error) {
      throw new Error(`Erro ao criar historia: ${error.message}`);
    }
  }

  async update(id, historia) {
    try {
      let payload;
      if (historia instanceof Historia) {
        const validation = historia.validate();
        if (!validation.isValid) {
          throw new Error(`Dados invalidos: ${validation.errors.join(', ')}`);
        }
        payload = historia.toJSON();
      } else {
        payload = { ...historia };
      }

      const response = await this.apiClient.put(`${this.baseUrl}/${id}`, payload);
      const data = this.asEntityResponse(response);
      return Historia.fromAPI(data);
    } catch (error) {
      throw new Error(`Erro ao atualizar historia: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const response = await this.apiClient.delete(`${this.baseUrl}/${id}`);
      if (response?.success === false) {
        throw new Error(response?.message || response?.error || 'Erro desconhecido');
      }
      return response;
    } catch (error) {
      throw new Error(`Erro ao remover historia: ${error.message}`);
    }
  }

  async resetarSessao(historiaId) {
    try {
      const response = await this.apiClient.delete(`/jogo/reset/${historiaId}`);
      if (response?.success === false) {
        throw new Error(response?.error || response?.message || 'Erro desconhecido');
      }
      return response;
    } catch (error) {
      throw new Error(`Erro ao resetar sessao: ${error.message}`);
    }
  }

  async encerrarSessao(historiaId) {
    try {
      const response = await this.apiClient.delete(`/jogo/encerrar/${historiaId}`);
      if (response?.success === false) {
        throw new Error(response?.error || response?.message || 'Erro desconhecido');
      }
      return response;
    } catch (error) {
      throw new Error(`Erro ao encerrar sessao: ${error.message}`);
    }
  }

  async getByTema(temaId) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}?temas=${temaId}`);
      const historias = this.asListResponse(response);
      return historias.map(historiaData => Historia.fromAPI(historiaData));
    } catch (error) {
      throw new Error(`Erro ao buscar historias por tema: ${error.message}`);
    }
  }

  async getWithFilters(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          const normalizedKey = key === 'tema' ? 'temas' : key;
          queryParams.append(normalizedKey, value);
        }
      });

      const response = await this.apiClient.get(`${this.baseUrl}?${queryParams.toString()}`);
      const historias = this.asListResponse(response);
      return historias.map(historiaData => Historia.fromAPI(historiaData));
    } catch (error) {
      throw new Error(`Erro ao buscar historias com filtros: ${error.message}`);
    }
  }

  async enviarConvite(historia_id, email) {
    try {
      if (!historia_id || !email) {
        throw new Error('ID da historia e email sao obrigatorios');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Email invalido');
      }

      const response = await this.apiClient.post('/convites', { historia_id, email });
      if (response?.success) {
        return response.data;
      }
      throw new Error(response?.error || response?.message || 'Erro ao enviar convite');
    } catch (error) {
      throw new Error(`Erro ao enviar convite: ${error.message}`);
    }
  }

  async verificarSessaoAtiva(historiaId) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}/${historiaId}/sessao-ativa`);
      if (response?.success) {
        return response.data;
      }
      throw new Error(response?.message || 'Erro ao verificar sessao');
    } catch (error) {
      throw new Error(`Erro ao verificar sessao ativa: ${error.message}`);
    }
  }

  async getStatusJogo(historiaId) {
    try {
      const response = await this.apiClient.get(`/jogo/status/${historiaId}`);
      if (response?.success) {
        return response.data;
      }
      throw new Error(response?.message || 'Erro ao buscar status do jogo');
    } catch (error) {
      throw new Error(`Erro ao buscar status do jogo: ${error.message}`);
    }
  }

  async gerarRoteiro(historiaId) {
    try {
      return await this.apiClient.post(`${this.baseUrl}/${historiaId}/roteiro`);
    } catch (error) {
      throw new Error(`Erro ao gerar roteiro: ${error.message}`);
    }
  }

  async getRoteiro(historiaId) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}/${historiaId}/roteiro`, {
        params: { _ts: Date.now() }
      });
      if (response?.success) return response.data;
      return { roteiro: null, roteiro_status: null };
    } catch (error) {
      throw new Error(`Erro ao buscar roteiro: ${error.message}`);
    }
  }

  async atualizarRoteiro(historiaId, roteiro) {
    try {
      return await this.apiClient.put(`${this.baseUrl}/${historiaId}/roteiro`, { roteiro });
    } catch (error) {
      throw new Error(`Erro ao atualizar roteiro: ${error.message}`);
    }
  }
}
