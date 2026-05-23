import type { ApiClient } from './ApiClient';
import generateGETparams from './generateGETparams';

/**
 * Servico para gerenciar operacoes de Mestre (agents de IA configuraveis).
 * Sem schema Zod dedicado na Fase 1.
 * TODO Fase 3: criar `mestreSchema` em `src/types/api/mestre.ts`.
 */

interface LegacyEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface GetAllParams {
  sistema?: string;
  ativo?: boolean;
  [key: string]: unknown;
}

function assertLegacyEnvelope<T>(raw: unknown, ctx: string): LegacyEnvelope<T> {
  if (typeof raw !== 'object' || raw === null || !('success' in raw)) {
    throw new Error(`[contract:${ctx}] resposta da API nao trouxe { success, data }`);
  }
  return raw as LegacyEnvelope<T>;
}

export class MestreService {
  private readonly apiClient: ApiClient;
  private readonly baseUrl: string;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/mestres';
  }

  async getAll(params?: GetAllParams): Promise<LegacyEnvelope<unknown>> {
    try {
      const paramsString = generateGETparams(params);
      const raw = await this.apiClient.get(this.baseUrl + paramsString);
      const env = assertLegacyEnvelope<unknown>(raw, 'MestreService.getAll');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao buscar mestres: ${(error as Error).message}`);
    }
  }

  async getById(id: number): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}/${id}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'MestreService.getById');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao buscar mestre: ${(error as Error).message}`);
    }
  }

  async create(data: Record<string, unknown>): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.post(this.baseUrl, data);
      const env = assertLegacyEnvelope<unknown>(raw, 'MestreService.create');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao criar mestre: ${(error as Error).message}`);
    }
  }

  async update(id: number, data: Record<string, unknown>): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.put(`${this.baseUrl}/${id}`, data);
      const env = assertLegacyEnvelope<unknown>(raw, 'MestreService.update');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao atualizar mestre: ${(error as Error).message}`);
    }
  }

  async delete(id: number): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.delete(`${this.baseUrl}/${id}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'MestreService.delete');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao excluir mestre: ${(error as Error).message}`);
    }
  }
}
