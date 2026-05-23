import {
  parseRaw,
  vantagemDesvantagemSchema,
  vantagemDesvantagemListSchema,
  type VantagemDesvantagem,
} from '../types/api';
import type { ApiClient } from './ApiClient';
import generateGETparams from './generateGETparams';

/**
 * Envelope LEGADO dos controllers de catalogo: `{ success, data, message?, pagination? }`.
 * Helper local seguindo o padrao da Fase 2a (PersonagemService).
 *
 * Equipamento compartilha o shape da tabela `vantagens`/`desvantagens` (mesmas
 * colunas de catalogo) — por isso reusa `vantagemDesvantagemSchema`.
 * Ver `types/api/vantagem-desvantagem.ts`.
 */
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

interface EquipamentoListResponse extends LegacyEnvelope<VantagemDesvantagem[]> {
  data: VantagemDesvantagem[];
}

interface EquipamentoItemResponse extends LegacyEnvelope<VantagemDesvantagem> {
  data: VantagemDesvantagem;
}

interface GetAllParams {
  sistema?: string;
  categoria?: string;
  [key: string]: unknown;
}

function assertLegacyEnvelope<T>(raw: unknown, ctx: string): LegacyEnvelope<T> {
  if (typeof raw !== 'object' || raw === null || !('success' in raw)) {
    throw new Error(`[contract:${ctx}] resposta da API nao trouxe { success, data }`);
  }
  return raw as LegacyEnvelope<T>;
}

/**
 * Servico para gerenciar operacoes de Equipamento.
 * Boundary do contrato API <-> Front: aplica `parseRaw(vantagemDesvantagemSchema, ...)`
 * no `data` do envelope legado para fail-loud antes do drift chegar ao Model.
 */
export class EquipamentoService {
  private readonly apiClient: ApiClient;
  private readonly baseUrl: string;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/equipamentos';
  }

  async getAll(params?: GetAllParams): Promise<EquipamentoListResponse> {
    try {
      const paramsString = generateGETparams(params);
      const raw = await this.apiClient.get(this.baseUrl + paramsString);
      const env = assertLegacyEnvelope<unknown>(raw, 'EquipamentoService.getAll');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const lista = parseRaw(vantagemDesvantagemListSchema, env.data, 'EquipamentoService.getAll');
      return { ...env, data: lista };
    } catch (error) {
      throw new Error(`Erro ao buscar equipamentos: ${(error as Error).message}`);
    }
  }

  async getById(id: number): Promise<EquipamentoItemResponse> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}/${id}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'EquipamentoService.getById');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const dto = parseRaw(vantagemDesvantagemSchema, env.data, 'EquipamentoService.getById');
      return { ...env, data: dto };
    } catch (error) {
      throw new Error(`Erro ao buscar equipamento: ${(error as Error).message}`);
    }
  }

  async create(data: Record<string, unknown>): Promise<EquipamentoItemResponse> {
    try {
      const raw = await this.apiClient.post(this.baseUrl, data);
      const env = assertLegacyEnvelope<unknown>(raw, 'EquipamentoService.create');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const dto = parseRaw(vantagemDesvantagemSchema, env.data, 'EquipamentoService.create');
      return { ...env, data: dto };
    } catch (error) {
      throw new Error(`Erro ao criar equipamento: ${(error as Error).message}`);
    }
  }

  async update(id: number, data: Record<string, unknown>): Promise<EquipamentoItemResponse> {
    try {
      const raw = await this.apiClient.put(`${this.baseUrl}/${id}`, data);
      const env = assertLegacyEnvelope<unknown>(raw, 'EquipamentoService.update');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const dto = parseRaw(vantagemDesvantagemSchema, env.data, 'EquipamentoService.update');
      return { ...env, data: dto };
    } catch (error) {
      throw new Error(`Erro ao atualizar equipamento: ${(error as Error).message}`);
    }
  }

  async delete(id: number): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.delete(`${this.baseUrl}/${id}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'EquipamentoService.delete');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao excluir equipamento: ${(error as Error).message}`);
    }
  }

  async search(term: string): Promise<EquipamentoListResponse> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}?nome=${encodeURIComponent(term)}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'EquipamentoService.search');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const lista = parseRaw(vantagemDesvantagemListSchema, env.data, 'EquipamentoService.search');
      return { ...env, data: lista };
    } catch (error) {
      throw new Error(`Erro ao buscar equipamentos: ${(error as Error).message}`);
    }
  }
}
