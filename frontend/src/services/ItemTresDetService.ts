import type { ApiClient } from './ApiClient';

/**
 * Itens 3D&T ainda nao tem schema Zod dedicado (fora do escopo da Fase 1).
 * Mantemos `Promise<unknown>` no boundary e o envelope legado validado para
 * fail-loud em drift estrutural. TODO Fase 3: criar `itemTresdetSchema` se
 * o catalogo de itens 3D&T ganhar uso real no frontend.
 */
interface LegacyEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

function assertLegacyEnvelope<T>(raw: unknown, ctx: string): LegacyEnvelope<T> {
  if (typeof raw !== 'object' || raw === null || !('success' in raw)) {
    throw new Error(`[contract:${ctx}] resposta da API nao trouxe { success, data }`);
  }
  return raw as LegacyEnvelope<T>;
}

export class ItemTresDetService {
  private readonly apiClient: ApiClient;
  private readonly baseUrl: string;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/itens-tresdet';
  }

  async getAll(): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.get(this.baseUrl);
      const env = assertLegacyEnvelope<unknown>(raw, 'ItemTresDetService.getAll');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao buscar itens 3D&T: ${(error as Error).message}`);
    }
  }

  async getById(id: number): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}/${id}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'ItemTresDetService.getById');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao buscar item 3D&T: ${(error as Error).message}`);
    }
  }

  async create(data: Record<string, unknown>): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.post(this.baseUrl, data);
      const env = assertLegacyEnvelope<unknown>(raw, 'ItemTresDetService.create');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao criar item 3D&T: ${(error as Error).message}`);
    }
  }

  async update(id: number, data: Record<string, unknown>): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.put(`${this.baseUrl}/${id}`, data);
      const env = assertLegacyEnvelope<unknown>(raw, 'ItemTresDetService.update');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao atualizar item 3D&T: ${(error as Error).message}`);
    }
  }

  async delete(id: number): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.delete(`${this.baseUrl}/${id}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'ItemTresDetService.delete');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao excluir item 3D&T: ${(error as Error).message}`);
    }
  }
}
