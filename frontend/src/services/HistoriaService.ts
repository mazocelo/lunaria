import { Historia } from '../models/Historia';
import {
  parseRaw,
  historiaSchema,
  historiaListSchema,
  type Historia as HistoriaDTO,
} from '../types/api';
import type { ApiClient } from './ApiClient';

interface LegacyEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  pagination?: {
    total?: number;
    offset?: number;
    limit?: number;
  } | null;
}

interface HistoriaListResponse extends LegacyEnvelope<HistoriaDTO[]> {
  data: HistoriaDTO[];
}

function assertLegacyEnvelope<T>(raw: unknown, ctx: string): LegacyEnvelope<T> {
  if (typeof raw !== 'object' || raw === null || !('success' in raw)) {
    throw new Error(`[contract:${ctx}] resposta da API nao trouxe { success, data }`);
  }
  return raw as LegacyEnvelope<T>;
}

/**
 * Endpoints com payload tipado mas que NAO usam `historiaSchema`
 * (roteiro, status de jogo, convites): mantemos `unknown` + TODO Fase 3.
 */

/**
 * Servico para gerenciar operacoes de Historia.
 * Boundary do contrato API <-> Front: aplica `parseRaw(historiaSchema, ...)`
 * nos endpoints que devolvem a entidade tipada. Endpoints auxiliares
 * (roteiro, status, convite) retornam `unknown` ate ganharem schema dedicado.
 */
export class HistoriaService {
  private readonly apiClient: ApiClient;
  private readonly baseUrl: string;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/historias';
  }

  /**
   * Helpers de leitura defensiva — alguns endpoints devolvem com envelope,
   * outros sem (controller legado). Mantemos a logica original.
   */
  private asListResponse(response: unknown): unknown[] {
    if (typeof response === 'object' && response !== null) {
      const obj = response as { success?: boolean; data?: unknown };
      if (obj.success) {
        return Array.isArray(obj.data) ? obj.data : [];
      }
      return Array.isArray(response) ? response : [];
    }
    return [];
  }

  private asEntityResponse(response: unknown): unknown {
    if (typeof response === 'object' && response !== null) {
      const obj = response as {
        success?: boolean;
        data?: unknown;
        message?: string;
        error?: string;
      };
      if (obj.success === false) {
        throw new Error(obj.message || obj.error || 'Erro desconhecido');
      }
      if (obj.success === true) {
        return obj.data;
      }
    }
    return response;
  }

  async getAll(): Promise<HistoriaListResponse> {
    try {
      const raw = await this.apiClient.get(this.baseUrl);
      const env = assertLegacyEnvelope<unknown>(raw, 'HistoriaService.getAll');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const lista = parseRaw(historiaListSchema, env.data, 'HistoriaService.getAll');
      return { ...env, data: lista };
    } catch (error) {
      throw new Error(`Erro ao buscar historias: ${(error as Error).message}`);
    }
  }

  async getPublicas(params: Record<string, string> = {}): Promise<HistoriaListResponse> {
    try {
      const queryParams = new URLSearchParams({ todas: 'true', ...params });
      const raw = await this.apiClient.get(`${this.baseUrl}?${queryParams}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'HistoriaService.getPublicas');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const lista = parseRaw(historiaListSchema, env.data, 'HistoriaService.getPublicas');
      return { ...env, data: lista };
    } catch (error) {
      throw new Error(`Erro ao buscar historias publicas: ${(error as Error).message}`);
    }
  }

  async getById(id: number): Promise<Historia> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}/${id}`);
      const data = this.asEntityResponse(raw);
      const dto = parseRaw(historiaSchema, data, 'HistoriaService.getById');
      return Historia.fromAPI(dto);
    } catch (error) {
      throw new Error(`Erro ao buscar historia: ${(error as Error).message}`);
    }
  }

  async create(historia: Historia | Record<string, unknown>): Promise<Historia> {
    try {
      const historiaInstance =
        historia instanceof Historia ? historia : new Historia(historia);
      const validation = historiaInstance.validate();
      if (!validation.isValid) {
        throw new Error(`Dados invalidos: ${validation.errors.join(', ')}`);
      }

      const raw = await this.apiClient.post(`${this.baseUrl}/create`, historiaInstance.toJSON());
      const data = this.asEntityResponse(raw);
      const dto = parseRaw(historiaSchema, data, 'HistoriaService.create');
      return Historia.fromAPI(dto);
    } catch (error) {
      throw new Error(`Erro ao criar historia: ${(error as Error).message}`);
    }
  }

  async update(
    id: number,
    historia: Historia | Record<string, unknown>,
  ): Promise<Historia> {
    try {
      let payload: Record<string, unknown>;
      if (historia instanceof Historia) {
        const validation = historia.validate();
        if (!validation.isValid) {
          throw new Error(`Dados invalidos: ${validation.errors.join(', ')}`);
        }
        payload = historia.toJSON();
      } else {
        payload = { ...historia };
      }

      const raw = await this.apiClient.put(`${this.baseUrl}/${id}`, payload);
      const data = this.asEntityResponse(raw);
      const dto = parseRaw(historiaSchema, data, 'HistoriaService.update');
      return Historia.fromAPI(dto);
    } catch (error) {
      throw new Error(`Erro ao atualizar historia: ${(error as Error).message}`);
    }
  }

  async delete(id: number): Promise<unknown> {
    try {
      const raw = await this.apiClient.delete(`${this.baseUrl}/${id}`);
      if (typeof raw === 'object' && raw !== null) {
        const obj = raw as { success?: boolean; message?: string; error?: string };
        if (obj.success === false) {
          throw new Error(obj.message || obj.error || 'Erro desconhecido');
        }
      }
      return raw;
    } catch (error) {
      throw new Error(`Erro ao remover historia: ${(error as Error).message}`);
    }
  }

  async resetarSessao(historiaId: number): Promise<unknown> {
    try {
      const raw = await this.apiClient.delete(`/jogo/reset/${historiaId}`);
      if (typeof raw === 'object' && raw !== null) {
        const obj = raw as { success?: boolean; message?: string; error?: string };
        if (obj.success === false) {
          throw new Error(obj.error || obj.message || 'Erro desconhecido');
        }
      }
      return raw;
    } catch (error) {
      throw new Error(`Erro ao resetar sessao: ${(error as Error).message}`);
    }
  }

  async encerrarSessao(historiaId: number): Promise<unknown> {
    try {
      const raw = await this.apiClient.delete(`/jogo/encerrar/${historiaId}`);
      if (typeof raw === 'object' && raw !== null) {
        const obj = raw as { success?: boolean; message?: string; error?: string };
        if (obj.success === false) {
          throw new Error(obj.error || obj.message || 'Erro desconhecido');
        }
      }
      return raw;
    } catch (error) {
      throw new Error(`Erro ao encerrar sessao: ${(error as Error).message}`);
    }
  }

  async getByTema(temaId: number): Promise<Historia[]> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}?temas=${temaId}`);
      const lista = this.asListResponse(raw);
      // Parse defensivo: o backend pode trazer historias com campos novos —
      // por isso schema com `.passthrough()`. Falha aqui = drift real.
      const validadas = parseRaw(historiaListSchema, lista, 'HistoriaService.getByTema');
      return validadas.map((historiaData) => Historia.fromAPI(historiaData));
    } catch (error) {
      throw new Error(`Erro ao buscar historias por tema: ${(error as Error).message}`);
    }
  }

  async getWithFilters(
    filters: Record<string, string | number | undefined | null> = {},
  ): Promise<Historia[]> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          const normalizedKey = key === 'tema' ? 'temas' : key;
          queryParams.append(normalizedKey, String(value));
        }
      });

      const raw = await this.apiClient.get(`${this.baseUrl}?${queryParams.toString()}`);
      const lista = this.asListResponse(raw);
      const validadas = parseRaw(historiaListSchema, lista, 'HistoriaService.getWithFilters');
      return validadas.map((historiaData) => Historia.fromAPI(historiaData));
    } catch (error) {
      throw new Error(`Erro ao buscar historias com filtros: ${(error as Error).message}`);
    }
  }

  /**
   * TODO Fase 3: criar schema `conviteSchema` para validar o payload.
   */
  async enviarConvite(historia_id: number, email: string): Promise<unknown> {
    try {
      if (!historia_id || !email) {
        throw new Error('ID da historia e email sao obrigatorios');
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Email invalido');
      }

      const raw = await this.apiClient.post('/convites', { historia_id, email });
      const env = assertLegacyEnvelope<unknown>(raw, 'HistoriaService.enviarConvite');
      if (!env.success) {
        throw new Error(env.error || env.message || 'Erro ao enviar convite');
      }
      return env.data;
    } catch (error) {
      throw new Error(`Erro ao enviar convite: ${(error as Error).message}`);
    }
  }

  /**
   * TODO Fase 3: criar schema `sessaoAtivaSchema` para o status do lobby.
   */
  async verificarSessaoAtiva(historiaId: number | string): Promise<unknown> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}/${historiaId}/sessao-ativa`);
      const env = assertLegacyEnvelope<unknown>(raw, 'HistoriaService.verificarSessaoAtiva');
      if (!env.success) {
        throw new Error(env.message || 'Erro ao verificar sessao');
      }
      return env.data;
    } catch (error) {
      throw new Error(`Erro ao verificar sessao ativa: ${(error as Error).message}`);
    }
  }

  /**
   * TODO Fase 3: criar schema `statusJogoSchema`.
   */
  async getStatusJogo(historiaId: number | string): Promise<unknown> {
    try {
      const raw = await this.apiClient.get(`/jogo/status/${historiaId}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'HistoriaService.getStatusJogo');
      if (!env.success) {
        throw new Error(env.message || 'Erro ao buscar status do jogo');
      }
      return env.data;
    } catch (error) {
      throw new Error(`Erro ao buscar status do jogo: ${(error as Error).message}`);
    }
  }

  /**
   * Roteiro: a entrada e abstrata (JSON aberto no Prisma) — sem schema dedicado.
   * TODO Fase 3: tipar quando schema `roteiroSchema` existir.
   */
  async gerarRoteiro(historiaId: number, mode: string | null = null): Promise<unknown> {
    try {
      const body = mode ? { mode } : {};
      return await this.apiClient.post(`${this.baseUrl}/${historiaId}/roteiro`, body);
    } catch (error) {
      throw new Error(`Erro ao gerar roteiro: ${(error as Error).message}`);
    }
  }

  async listarVersoesRoteiro(historiaId: number): Promise<unknown[]> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}/${historiaId}/roteiro-versoes`);
      if (typeof raw === 'object' && raw !== null) {
        const obj = raw as { success?: boolean; data?: unknown };
        if (obj.success && Array.isArray(obj.data)) return obj.data;
      }
      return [];
    } catch (error) {
      throw new Error(`Erro ao listar versões: ${(error as Error).message}`);
    }
  }

  async obterVersaoRoteiro(historiaId: number, versaoId: number): Promise<unknown> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}/${historiaId}/roteiro-versoes/${versaoId}`);
      if (typeof raw === 'object' && raw !== null) {
        const obj = raw as { success?: boolean; data?: unknown };
        if (obj.success) return obj.data;
      }
      return null;
    } catch (error) {
      throw new Error(`Erro ao obter versão: ${(error as Error).message}`);
    }
  }

  async ativarVersaoRoteiro(historiaId: number, versaoId: number): Promise<unknown> {
    try {
      return await this.apiClient.post(
        `${this.baseUrl}/${historiaId}/roteiro-versoes/${versaoId}/ativar`,
      );
    } catch (error) {
      throw new Error(`Erro ao ativar versão: ${(error as Error).message}`);
    }
  }

  async getRoteiro(historiaId: number | string): Promise<unknown> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}/${historiaId}/roteiro`, {
        params: { _ts: Date.now() },
      });
      if (typeof raw === 'object' && raw !== null) {
        const obj = raw as { success?: boolean; data?: unknown };
        if (obj.success) return obj.data;
      }
      return { roteiro: null, roteiro_status: null };
    } catch (error) {
      throw new Error(`Erro ao buscar roteiro: ${(error as Error).message}`);
    }
  }

  async atualizarRoteiro(historiaId: number, roteiro: unknown): Promise<unknown> {
    try {
      return await this.apiClient.put(`${this.baseUrl}/${historiaId}/roteiro`, { roteiro });
    } catch (error) {
      throw new Error(`Erro ao atualizar roteiro: ${(error as Error).message}`);
    }
  }
}
