import {
  parseRaw,
  monstroSchema,
  monstroListSchema,
  type Monstro,
} from '../types/api';
import type { ApiClient } from './ApiClient';
import generateGETparams from './generateGETparams';

/**
 * Envelope LEGADO dos controllers de catalogo: `{ success, data, message?, pagination? }`.
 * Helper local seguindo o padrao da Fase 2a (PersonagemService).
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

interface MonstroListResponse extends LegacyEnvelope<Monstro[]> {
  data: Monstro[];
}

interface MonstroItemResponse extends LegacyEnvelope<Monstro> {
  data: Monstro;
}

interface GetAllParams {
  sistema?: string;
  [key: string]: unknown;
}

function assertLegacyEnvelope<T>(raw: unknown, ctx: string): LegacyEnvelope<T> {
  if (typeof raw !== 'object' || raw === null || !('success' in raw)) {
    throw new Error(`[contract:${ctx}] resposta da API nao trouxe { success, data }`);
  }
  return raw as LegacyEnvelope<T>;
}

/**
 * Servico para gerenciar operacoes de Monstro.
 * Boundary do contrato API <-> Front: aplica `parseRaw(monstroSchema, ...)`
 * no `data` do envelope legado para fail-loud antes do drift chegar ao Model.
 */
export class MonstroService {
  private readonly apiClient: ApiClient;
  private readonly baseUrl: string;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/monstros';
  }

  async getAll(params?: GetAllParams): Promise<MonstroListResponse> {
    try {
      const paramsString = generateGETparams(params);
      const raw = await this.apiClient.get(this.baseUrl + paramsString);
      const env = assertLegacyEnvelope<unknown>(raw, 'MonstroService.getAll');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const lista = parseRaw(monstroListSchema, env.data, 'MonstroService.getAll');
      return { ...env, data: lista };
    } catch (error) {
      throw new Error(`Erro ao buscar monstros: ${(error as Error).message}`);
    }
  }

  async getById(id: number): Promise<MonstroItemResponse> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}/${id}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'MonstroService.getById');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const dto = parseRaw(monstroSchema, env.data, 'MonstroService.getById');
      return { ...env, data: dto };
    } catch (error) {
      throw new Error(`Erro ao buscar monstro: ${(error as Error).message}`);
    }
  }

  async create(data: Record<string, unknown>): Promise<MonstroItemResponse> {
    try {
      const raw = await this.apiClient.post(this.baseUrl, data);
      const env = assertLegacyEnvelope<unknown>(raw, 'MonstroService.create');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const dto = parseRaw(monstroSchema, env.data, 'MonstroService.create');
      return { ...env, data: dto };
    } catch (error) {
      throw new Error(`Erro ao criar monstro: ${(error as Error).message}`);
    }
  }

  async update(id: number, data: Record<string, unknown>): Promise<MonstroItemResponse> {
    try {
      const raw = await this.apiClient.put(`${this.baseUrl}/${id}`, data);
      const env = assertLegacyEnvelope<unknown>(raw, 'MonstroService.update');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const dto = parseRaw(monstroSchema, env.data, 'MonstroService.update');
      return { ...env, data: dto };
    } catch (error) {
      throw new Error(`Erro ao atualizar monstro: ${(error as Error).message}`);
    }
  }

  /**
   * Remove um monstro. Retorna o envelope cru pois nao ha payload tipado.
   */
  async delete(id: number): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.delete(`${this.baseUrl}/${id}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'MonstroService.delete');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao excluir monstro: ${(error as Error).message}`);
    }
  }
}
