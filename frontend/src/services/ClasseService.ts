import {
  parseRaw,
  classeSchema,
  classeListSchema,
  type Classe,
  assertLegacyEnvelope,
  type LegacyEnvelope,
} from '../types/api';
import type { ApiClient } from './ApiClient';
import generateGETparams from './generateGETparams';

interface ClasseListResponse extends LegacyEnvelope<Classe[]> {
  data: Classe[];
}

interface ClasseItemResponse extends LegacyEnvelope<Classe> {
  data: Classe;
}

interface GetAllParams {
  sistema?: string;
  [key: string]: unknown;
}

/**
 * Servico para gerenciar operacoes de Classe.
 * Boundary do contrato API <-> Front: aplica `parseRaw(classeSchema, ...)` no `data`
 * do envelope legado para fail-loud antes do drift chegar ao Model.
 */
export class ClasseService {
  private readonly apiClient: ApiClient;
  private readonly baseUrl: string;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/classes';
  }

  async getAll(params?: GetAllParams): Promise<ClasseListResponse> {
    try {
      const paramsString = generateGETparams(params);
      const raw = await this.apiClient.get(this.baseUrl + paramsString);
      const env = assertLegacyEnvelope<unknown>(raw, 'ClasseService.getAll');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const lista = parseRaw(classeListSchema, env.data, 'ClasseService.getAll');
      return { ...env, data: lista };
    } catch (error) {
      throw new Error(`Erro ao buscar classes: ${(error as Error).message}`);
    }
  }

  async getById(id: number): Promise<ClasseItemResponse> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}/${id}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'ClasseService.getById');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const dto = parseRaw(classeSchema, env.data, 'ClasseService.getById');
      return { ...env, data: dto };
    } catch (error) {
      throw new Error(`Erro ao buscar classe: ${(error as Error).message}`);
    }
  }

  async create(classe: Record<string, unknown>): Promise<ClasseItemResponse> {
    try {
      const raw = await this.apiClient.post(this.baseUrl, classe);
      const env = assertLegacyEnvelope<unknown>(raw, 'ClasseService.create');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const dto = parseRaw(classeSchema, env.data, 'ClasseService.create');
      return { ...env, data: dto };
    } catch (error) {
      throw new Error(`Erro ao criar classe: ${(error as Error).message}`);
    }
  }

  async update(id: number, classe: Record<string, unknown>): Promise<ClasseItemResponse> {
    try {
      const raw = await this.apiClient.put(`${this.baseUrl}/${id}`, classe);
      const env = assertLegacyEnvelope<unknown>(raw, 'ClasseService.update');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const dto = parseRaw(classeSchema, env.data, 'ClasseService.update');
      return { ...env, data: dto };
    } catch (error) {
      throw new Error(`Erro ao atualizar classe: ${(error as Error).message}`);
    }
  }

  /**
   * Remove uma classe. Retorna o envelope cru pois nao ha payload tipado.
   */
  async delete(id: number): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.delete(`${this.baseUrl}/${id}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'ClasseService.delete');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao remover classe: ${(error as Error).message}`);
    }
  }
}
