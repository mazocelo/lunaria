import {
  parseRaw,
  habilidadeSchema,
  habilidadeListSchema,
  type Habilidade,
} from '../types/api';
import type { ApiClient } from './ApiClient';
import generateGETparams from './generateGETparams';

/**
 * HabilidadeMagia tem ENVELOPES INCONSISTENTES entre endpoints
 * (controllers/habilidades-magias — ver nota em src/types/api/habilidade.ts):
 *
 *   listarHabilidades   -> { data, total, limit, offset, hasMore }   (sem `success`)
 *   obterHabilidade     -> { success: true, data: {...} }            (envelope legado)
 *   criarHabilidade     -> {...}                                     (objeto nu)
 *   atualizarHabilidade -> {...}                                     (objeto nu)
 *   delete              -> { success, message }                      (envelope legado)
 *   obterEstatisticas   -> {...}                                     (objeto nu)
 *
 * O store (store/habilidade/actions.js) le `response.data`, `response.total`,
 * `response.hasMore` direto, por isso a assinatura externa de `getAll` precisa
 * preservar a forma `{ data, total, limit, offset, hasMore }`. Os demais
 * metodos preservam o shape original para nao quebrar consumidores existentes.
 */

interface PaginatedListResponse {
  data: Habilidade[];
  total?: number;
  offset?: number;
  limit?: number;
  hasMore?: boolean;
}

interface LegacyEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface GetAllParams {
  sistema?: string;
  categoria?: string;
  classe_id?: number;
  raca_id?: number;
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

function assertObject(raw: unknown, ctx: string): Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`[contract:${ctx}] resposta da API nao e objeto`);
  }
  return raw as Record<string, unknown>;
}

function assertLegacyEnvelope<T>(raw: unknown, ctx: string): LegacyEnvelope<T> {
  if (typeof raw !== 'object' || raw === null || !('success' in raw)) {
    throw new Error(`[contract:${ctx}] resposta da API nao trouxe { success, data }`);
  }
  return raw as LegacyEnvelope<T>;
}

export class HabilidadeMagiaService {
  private readonly apiClient: ApiClient;
  private readonly baseUrl: string;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/habilidades';
  }

  /**
   * `listarHabilidades` devolve `{ data, total, limit, offset, hasMore }` sem
   * envelope `{ success }`. Validamos a forma e o array `data` contra o schema.
   */
  async getAll(params?: GetAllParams): Promise<PaginatedListResponse> {
    try {
      const paramsString = generateGETparams(params);
      const raw = await this.apiClient.get(this.baseUrl + paramsString);
      const obj = assertObject(raw, 'HabilidadeMagiaService.getAll');
      const lista = parseRaw(habilidadeListSchema, obj.data, 'HabilidadeMagiaService.getAll');
      return {
        data: lista,
        total: typeof obj.total === 'number' ? obj.total : undefined,
        offset: typeof obj.offset === 'number' ? obj.offset : undefined,
        limit: typeof obj.limit === 'number' ? obj.limit : undefined,
        hasMore: typeof obj.hasMore === 'boolean' ? obj.hasMore : undefined,
      };
    } catch (error) {
      throw new Error(`Erro ao buscar habilidades: ${(error as Error).message}`);
    }
  }

  /**
   * `obterHabilidade` devolve `{ success: true, data: {...} }`. O Model do
   * frontend (Pages/Habilidade/Ver) le `response.data` — preservamos o shape.
   */
  async getById(id: number): Promise<LegacyEnvelope<Habilidade>> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}/${id}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'HabilidadeMagiaService.getById');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const dto = parseRaw(habilidadeSchema, env.data, 'HabilidadeMagiaService.getById');
      return { ...env, data: dto };
    } catch (error) {
      throw new Error(`Erro ao buscar habilidade: ${(error as Error).message}`);
    }
  }

  /**
   * `obterEstatisticas` devolve objeto nu (sem envelope). Schema dedicado
   * ainda nao existe — passa cru.
   * TODO Fase 3: criar schema `habilidadeEstatisticasSchema` se for util.
   */
  async getEstatisticas(): Promise<unknown> {
    try {
      return await this.apiClient.get(`${this.baseUrl}/estatisticas`);
    } catch (error) {
      throw new Error(`Erro ao buscar estatísticas: ${(error as Error).message}`);
    }
  }

  /**
   * `criarHabilidade` devolve a entidade NUA (sem envelope). Validamos
   * direto contra o schema.
   */
  async create(data: Record<string, unknown>): Promise<Habilidade> {
    try {
      const raw = await this.apiClient.post(this.baseUrl, data);
      return parseRaw(habilidadeSchema, raw, 'HabilidadeMagiaService.create');
    } catch (error) {
      throw new Error(`Erro ao criar habilidade: ${(error as Error).message}`);
    }
  }

  /**
   * `atualizarHabilidade` idem `create`: entidade nua.
   */
  async update(id: number, data: Record<string, unknown>): Promise<Habilidade> {
    try {
      const raw = await this.apiClient.put(`${this.baseUrl}/${id}`, data);
      return parseRaw(habilidadeSchema, raw, 'HabilidadeMagiaService.update');
    } catch (error) {
      throw new Error(`Erro ao atualizar habilidade: ${(error as Error).message}`);
    }
  }

  /**
   * `delete` devolve `{ success, message }` legado. Sem payload tipado.
   */
  async delete(id: number): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.delete(`${this.baseUrl}/${id}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'HabilidadeMagiaService.delete');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao excluir habilidade: ${(error as Error).message}`);
    }
  }
}
