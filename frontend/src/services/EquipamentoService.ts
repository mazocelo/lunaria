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
