import type { ApiClient } from './ApiClient';

/**
 * Servico para gerar imagens via IA (Nano Banana 2 / fallback Leonardo).
 * Sem schema Zod dedicado na Fase 1.
 * TODO Fase 3: criar `imageGenerationResponseSchema`.
 */

interface LegacyEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface GenerateParams {
  entityType: string;
  entityData: Record<string, unknown>;
  options?: Record<string, unknown>;
}

function assertLegacyEnvelope<T>(raw: unknown, ctx: string): LegacyEnvelope<T> {
  if (typeof raw !== 'object' || raw === null || !('success' in raw)) {
    throw new Error(`[contract:${ctx}] resposta da API nao trouxe { success, data }`);
  }
  return raw as LegacyEnvelope<T>;
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
