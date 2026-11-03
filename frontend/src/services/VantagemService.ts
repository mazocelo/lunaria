import {
  parseRaw,
  vantagemDesvantagemSchema,
  vantagemDesvantagemListSchema,
  type VantagemDesvantagem,
  assertLegacyEnvelope,
  type LegacyEnvelope,
} from '../types/api';
import type { ApiClient } from './ApiClient';
import generateGETparams from './generateGETparams';

interface VantagemListResponse extends LegacyEnvelope<VantagemDesvantagem[]> {
  data: VantagemDesvantagem[];
}

interface VantagemItemResponse extends LegacyEnvelope<VantagemDesvantagem> {
  data: VantagemDesvantagem;
}

interface GetAllParams {
  sistema?: string;
  tipo?: string;
  [key: string]: unknown;
}

/**
 * Servico para gerenciar operacoes de Vantagem e Desvantagem.
 * Boundary do contrato API <-> Front: aplica `parseRaw(vantagemDesvantagemSchema, ...)`
 * no `data` do envelope legado para fail-loud antes do drift chegar ao Model.
 */
export class VantagemService {
  private readonly apiClient: ApiClient;
  private readonly baseUrl: string;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/vantagens';
  }

  async getAll(params?: GetAllParams): Promise<VantagemListResponse> {
    try {
      const paramsString = generateGETparams(params);
      const raw = await this.apiClient.get(this.baseUrl + paramsString);
      const env = assertLegacyEnvelope<unknown>(raw, 'VantagemService.getAll');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const lista = parseRaw(vantagemDesvantagemListSchema, env.data, 'VantagemService.getAll');
      return { ...env, data: lista };
    } catch (error) {
      throw new Error(`Erro ao buscar vantagens: ${(error as Error).message}`);
    }
  }

  async getVantagens(): Promise<VantagemListResponse> {
    try {
      const raw = await this.apiClient.get(this.baseUrl);
      const env = assertLegacyEnvelope<unknown>(raw, 'VantagemService.getVantagens');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const lista = parseRaw(vantagemDesvantagemListSchema, env.data, 'VantagemService.getVantagens');
      return { ...env, data: lista };
    } catch (error) {
      throw new Error(`Erro ao buscar vantagens: ${(error as Error).message}`);
    }
  }

  async getDesvantagens(): Promise<VantagemListResponse> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}?tipo=desvantagem`);
      const env = assertLegacyEnvelope<unknown>(raw, 'VantagemService.getDesvantagens');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const lista = parseRaw(vantagemDesvantagemListSchema, env.data, 'VantagemService.getDesvantagens');
      return { ...env, data: lista };
    } catch (error) {
      throw new Error(`Erro ao buscar desvantagens: ${(error as Error).message}`);
    }
  }

  async getById(id: number): Promise<VantagemItemResponse> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}/${id}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'VantagemService.getById');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const dto = parseRaw(vantagemDesvantagemSchema, env.data, 'VantagemService.getById');
      return { ...env, data: dto };
    } catch (error) {
      throw new Error(`Erro ao buscar vantagem/desvantagem: ${(error as Error).message}`);
    }
  }

  async getByTipo(tipo: string): Promise<VantagemListResponse> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}?tipo=${encodeURIComponent(tipo)}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'VantagemService.getByTipo');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const lista = parseRaw(vantagemDesvantagemListSchema, env.data, 'VantagemService.getByTipo');
      return { ...env, data: lista };
    } catch (error) {
      throw new Error(`Erro ao buscar vantagens/desvantagens por tipo: ${(error as Error).message}`);
    }
  }

  async getByNome(nome: string): Promise<VantagemListResponse> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}?nome=${encodeURIComponent(nome)}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'VantagemService.getByNome');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const lista = parseRaw(vantagemDesvantagemListSchema, env.data, 'VantagemService.getByNome');
      return { ...env, data: lista };
    } catch (error) {
      throw new Error(`Erro ao buscar vantagens/desvantagens por nome: ${(error as Error).message}`);
    }
  }

  async create(data: Record<string, unknown>): Promise<VantagemItemResponse> {
    try {
      const raw = await this.apiClient.post(this.baseUrl, data);
      const env = assertLegacyEnvelope<unknown>(raw, 'VantagemService.create');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const dto = parseRaw(vantagemDesvantagemSchema, env.data, 'VantagemService.create');
      return { ...env, data: dto };
    } catch (error) {
      throw new Error(`Erro ao criar vantagem: ${(error as Error).message}`);
    }
  }

  async update(id: number, data: Record<string, unknown>): Promise<VantagemItemResponse> {
    try {
      const raw = await this.apiClient.put(`${this.baseUrl}/${id}`, data);
      const env = assertLegacyEnvelope<unknown>(raw, 'VantagemService.update');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const dto = parseRaw(vantagemDesvantagemSchema, env.data, 'VantagemService.update');
      return { ...env, data: dto };
    } catch (error) {
      throw new Error(`Erro ao atualizar vantagem: ${(error as Error).message}`);
    }
  }

  async delete(id: number): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.delete(`${this.baseUrl}/${id}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'VantagemService.delete');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao excluir vantagem: ${(error as Error).message}`);
    }
  }
}
