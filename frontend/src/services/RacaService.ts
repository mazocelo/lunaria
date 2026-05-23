import {
  parseRaw,
  racaSchema,
  racaListSchema,
  type Raca,
} from '../types/api';
import type { ApiClient } from './ApiClient';
import generateGETparams from './generateGETparams';

/**
 * Envelope LEGADO dos controllers de catalogo: `{ success, data, message?, pagination? }`.
 * O schema Zod modela apenas o `data` cru — `parseRaw` valida o payload, nao o envelope.
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

interface RacaListResponse extends LegacyEnvelope<Raca[]> {
  data: Raca[];
}

interface RacaItemResponse extends LegacyEnvelope<Raca> {
  data: Raca;
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
 * Servico para gerenciar operacoes de Raca.
 * Boundary do contrato API <-> Front: aplica `parseRaw(racaSchema, ...)` no `data`
 * do envelope legado para garantir fail-loud antes do drift chegar ao Model.
 */
export class RacaService {
  private readonly apiClient: ApiClient;
  private readonly baseUrl: string;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/racas';
  }

  async getAll(params?: GetAllParams): Promise<RacaListResponse> {
    try {
      const paramsString = generateGETparams(params);
      const raw = await this.apiClient.get(this.baseUrl + paramsString);
      const env = assertLegacyEnvelope<unknown>(raw, 'RacaService.getAll');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const lista = parseRaw(racaListSchema, env.data, 'RacaService.getAll');
      return { ...env, data: lista };
    } catch (error) {
      throw new Error(`Erro ao buscar raças: ${(error as Error).message}`);
    }
  }

  async getById(id: number): Promise<RacaItemResponse> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}/${id}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'RacaService.getById');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const dto = parseRaw(racaSchema, env.data, 'RacaService.getById');
      return { ...env, data: dto };
    } catch (error) {
      throw new Error(`Erro ao buscar raça: ${(error as Error).message}`);
    }
  }

  async create(raca: Record<string, unknown>): Promise<RacaItemResponse> {
    try {
      const raw = await this.apiClient.post(this.baseUrl, raca);
      const env = assertLegacyEnvelope<unknown>(raw, 'RacaService.create');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const dto = parseRaw(racaSchema, env.data, 'RacaService.create');
      return { ...env, data: dto };
    } catch (error) {
      throw new Error(`Erro ao criar raça: ${(error as Error).message}`);
    }
  }

  async update(id: number, raca: Record<string, unknown>): Promise<RacaItemResponse> {
    try {
      const raw = await this.apiClient.put(`${this.baseUrl}/${id}`, raca);
      const env = assertLegacyEnvelope<unknown>(raw, 'RacaService.update');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const dto = parseRaw(racaSchema, env.data, 'RacaService.update');
      return { ...env, data: dto };
    } catch (error) {
      throw new Error(`Erro ao atualizar raça: ${(error as Error).message}`);
    }
  }

  /**
   * Remove uma raca. O backend pode devolver `{ success: true, data: null }`
   * ou um shape compativel — retornamos o envelope cru sem parse pois nao ha
   * payload tipado para validar.
   */
  async delete(id: number): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.delete(`${this.baseUrl}/${id}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'RacaService.delete');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao remover raça: ${(error as Error).message}`);
    }
  }
}
