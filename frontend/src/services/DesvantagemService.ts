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

interface DesvantagemListResponse extends LegacyEnvelope<VantagemDesvantagem[]> {
  data: VantagemDesvantagem[];
}

interface DesvantagemItemResponse extends LegacyEnvelope<VantagemDesvantagem> {
  data: VantagemDesvantagem;
}

interface GetAllParams {
  sistema?: string;
  tipo?: string;
  [key: string]: unknown;
}

/**
 * Servico para gerenciar operacoes de Desvantagem.
 * Boundary do contrato API <-> Front: aplica `parseRaw(vantagemDesvantagemSchema, ...)`
 * no `data` do envelope legado para fail-loud antes do drift chegar ao Model.
 */
export class DesvantagemService {
  private readonly apiClient: ApiClient;
  private readonly baseUrl: string;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/desvantagens';
  }

  async getAll(params?: GetAllParams): Promise<DesvantagemListResponse> {
    try {
      const paramsString = generateGETparams(params);
      const raw = await this.apiClient.get(this.baseUrl + paramsString);
      const env = assertLegacyEnvelope<unknown>(raw, 'DesvantagemService.getAll');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const lista = parseRaw(vantagemDesvantagemListSchema, env.data, 'DesvantagemService.getAll');
      return { ...env, data: lista };
    } catch (error) {
      throw new Error(`Erro ao buscar desvantagens: ${(error as Error).message}`);
    }
  }

  async getDesvantagens(params: GetAllParams = {}): Promise<DesvantagemListResponse> {
    try {
      const paramsString = generateGETparams(params);
      const raw = await this.apiClient.get(`${this.baseUrl}${paramsString}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'DesvantagemService.getDesvantagens');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const lista = parseRaw(vantagemDesvantagemListSchema, env.data, 'DesvantagemService.getDesvantagens');
      return { ...env, data: lista };
    } catch (error) {
      throw new Error(`Erro ao buscar desvantagens: ${(error as Error).message}`);
    }
  }

  async getById(id: number): Promise<DesvantagemItemResponse> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}/${id}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'DesvantagemService.getById');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const dto = parseRaw(vantagemDesvantagemSchema, env.data, 'DesvantagemService.getById');
      return { ...env, data: dto };
    } catch (error) {
      throw new Error(`Erro ao buscar desvantagem: ${(error as Error).message}`);
    }
  }

  async getByTipo(tipo: string): Promise<DesvantagemListResponse> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}?tipo=${encodeURIComponent(tipo)}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'DesvantagemService.getByTipo');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const lista = parseRaw(vantagemDesvantagemListSchema, env.data, 'DesvantagemService.getByTipo');
      return { ...env, data: lista };
    } catch (error) {
      throw new Error(`Erro ao buscar desvantagens por tipo: ${(error as Error).message}`);
    }
  }

  async getByNome(nome: string): Promise<DesvantagemListResponse> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}?nome=${encodeURIComponent(nome)}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'DesvantagemService.getByNome');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const lista = parseRaw(vantagemDesvantagemListSchema, env.data, 'DesvantagemService.getByNome');
      return { ...env, data: lista };
    } catch (error) {
      throw new Error(`Erro ao buscar desvantagens por nome: ${(error as Error).message}`);
    }
  }

  async create(data: Record<string, unknown>): Promise<DesvantagemItemResponse> {
    try {
      const raw = await this.apiClient.post(this.baseUrl, data);
      const env = assertLegacyEnvelope<unknown>(raw, 'DesvantagemService.create');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const dto = parseRaw(vantagemDesvantagemSchema, env.data, 'DesvantagemService.create');
      return { ...env, data: dto };
    } catch (error) {
      throw new Error(`Erro ao criar desvantagem: ${(error as Error).message}`);
    }
  }

  async update(id: number, data: Record<string, unknown>): Promise<DesvantagemItemResponse> {
    try {
      const raw = await this.apiClient.put(`${this.baseUrl}/${id}`, data);
      const env = assertLegacyEnvelope<unknown>(raw, 'DesvantagemService.update');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const dto = parseRaw(vantagemDesvantagemSchema, env.data, 'DesvantagemService.update');
      return { ...env, data: dto };
    } catch (error) {
      throw new Error(`Erro ao atualizar desvantagem: ${(error as Error).message}`);
    }
  }

  async delete(id: number): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.delete(`${this.baseUrl}/${id}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'DesvantagemService.delete');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao excluir desvantagem: ${(error as Error).message}`);
    }
  }
}
