import type { ApiClient } from './ApiClient';
import { assertLegacyEnvelope, type LegacyEnvelope } from '../types/api';

/**
 * Servico para gerenciar operacoes de Tema.
 * Sem schema Zod dedicado na Fase 1.
 * TODO Fase 3: criar `temaSchema` em `src/types/api/tema.ts`.
 */

export class TemaService {
  private readonly apiClient: ApiClient;
  private readonly baseUrl: string;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/temas';
  }

  async getAll(): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.get(this.baseUrl);
      const env = assertLegacyEnvelope<unknown>(raw, 'TemaService.getAll');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao buscar temas: ${(error as Error).message}`);
    }
  }

  async getAtivos(): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}?ativo=true`);
      const env = assertLegacyEnvelope<unknown>(raw, 'TemaService.getAtivos');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao buscar temas ativos: ${(error as Error).message}`);
    }
  }

  async getById(id: number): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}/${id}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'TemaService.getById');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao buscar tema: ${(error as Error).message}`);
    }
  }

  async create(temaData: Record<string, unknown>): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.post(this.baseUrl, temaData);
      const env = assertLegacyEnvelope<unknown>(raw, 'TemaService.create');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao criar tema: ${(error as Error).message}`);
    }
  }

  async update(id: number, temaData: Record<string, unknown>): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.put(`${this.baseUrl}/${id}`, temaData);
      const env = assertLegacyEnvelope<unknown>(raw, 'TemaService.update');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao atualizar tema: ${(error as Error).message}`);
    }
  }

  async delete(id: number): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.delete(`${this.baseUrl}/${id}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'TemaService.delete');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao remover tema: ${(error as Error).message}`);
    }
  }

  async ativar(id: number): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.patch(`${this.baseUrl}/${id}/ativar`);
      const env = assertLegacyEnvelope<unknown>(raw, 'TemaService.ativar');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao ativar tema: ${(error as Error).message}`);
    }
  }

  async desativar(id: number): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.patch(`${this.baseUrl}/${id}/desativar`);
      const env = assertLegacyEnvelope<unknown>(raw, 'TemaService.desativar');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao desativar tema: ${(error as Error).message}`);
    }
  }

  async getByNome(nome: string): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}?nome=${encodeURIComponent(nome)}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'TemaService.getByNome');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao buscar temas por nome: ${(error as Error).message}`);
    }
  }
}
