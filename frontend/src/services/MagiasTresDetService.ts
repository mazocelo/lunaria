import {
  parseRaw,
  magiaTresdetSchema,
  magiaTresdetListSchema,
  type MagiaTresdet,
  assertLegacyEnvelope,
  type LegacyEnvelope,
} from '../types/api';
import type { ApiClient } from './ApiClient';
import generateGETparams from './generateGETparams';

interface MagiaListResponse extends LegacyEnvelope<MagiaTresdet[]> {
  data: MagiaTresdet[];
}

interface MagiaItemResponse extends LegacyEnvelope<MagiaTresdet> {
  data: MagiaTresdet;
}

interface GetAllParams {
  escola?: string;
  [key: string]: unknown;
}

/**
 * Servico para gerenciar operacoes de Magias 3D&T (tabela `magias_tresdet`,
 * shape diferente de `habilidades_magias` — ver schema `magiaTresdetSchema`).
 * Boundary do contrato API <-> Front: aplica `parseRaw(magiaTresdetSchema, ...)`
 * no `data` do envelope legado.
 */
export class MagiasTresDetService {
  private readonly apiClient: ApiClient;
  private readonly baseUrl: string;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/magias-tresdet';
  }

  async getAll(params?: GetAllParams): Promise<MagiaListResponse> {
    try {
      const paramsString = generateGETparams(params);
      const raw = await this.apiClient.get(this.baseUrl + paramsString);
      const env = assertLegacyEnvelope<unknown>(raw, 'MagiasTresDetService.getAll');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const lista = parseRaw(magiaTresdetListSchema, env.data, 'MagiasTresDetService.getAll');
      return { ...env, data: lista };
    } catch (error) {
      throw new Error(`Erro ao buscar magias: ${(error as Error).message}`);
    }
  }

  async getById(id: number): Promise<MagiaItemResponse> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}/${id}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'MagiasTresDetService.getById');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const dto = parseRaw(magiaTresdetSchema, env.data, 'MagiasTresDetService.getById');
      return { ...env, data: dto };
    } catch (error) {
      throw new Error(`Erro ao buscar magia: ${(error as Error).message}`);
    }
  }

  async create(data: Record<string, unknown>): Promise<MagiaItemResponse> {
    try {
      const raw = await this.apiClient.post(this.baseUrl, data);
      const env = assertLegacyEnvelope<unknown>(raw, 'MagiasTresDetService.create');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const dto = parseRaw(magiaTresdetSchema, env.data, 'MagiasTresDetService.create');
      return { ...env, data: dto };
    } catch (error) {
      throw new Error(`Erro ao criar magia: ${(error as Error).message}`);
    }
  }

  async update(id: number, data: Record<string, unknown>): Promise<MagiaItemResponse> {
    try {
      const raw = await this.apiClient.put(`${this.baseUrl}/${id}`, data);
      const env = assertLegacyEnvelope<unknown>(raw, 'MagiasTresDetService.update');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const dto = parseRaw(magiaTresdetSchema, env.data, 'MagiasTresDetService.update');
      return { ...env, data: dto };
    } catch (error) {
      throw new Error(`Erro ao atualizar magia: ${(error as Error).message}`);
    }
  }

  async delete(id: number): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.delete(`${this.baseUrl}/${id}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'MagiasTresDetService.delete');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao excluir magia: ${(error as Error).message}`);
    }
  }
}
