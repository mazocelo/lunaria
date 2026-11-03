import type { ApiClient } from './ApiClient';
import { assertLegacyEnvelope, type LegacyEnvelope } from '../types/api';

/**
 * Servico para gerar imagens via IA (Nano Banana 2 / fallback Leonardo).
 * Sem schema Zod dedicado na Fase 1.
 * TODO Fase 3: criar `imageGenerationResponseSchema`.
 */

interface GenerateParams {
  entityType: string;
  entityData: Record<string, unknown>;
  options?: Record<string, unknown>;
}

export class ImageGenerationService {
  private readonly apiClient: ApiClient;
  private readonly baseUrl: string;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/image';
  }

  async generate({ entityType, entityData, options }: GenerateParams): Promise<LegacyEnvelope<unknown>> {
    try {
      const raw = await this.apiClient.post(`${this.baseUrl}/generate`, {
        entityType,
        entityData,
        ...(options && { options }),
      });
      const env = assertLegacyEnvelope<unknown>(raw, 'ImageGenerationService.generate');
      if (!env.success) {
        throw new Error(env.error || 'Erro desconhecido');
      }
      return env;
    } catch (error) {
      throw new Error(`Erro ao gerar imagem: ${(error as Error).message}`);
    }
  }
}
