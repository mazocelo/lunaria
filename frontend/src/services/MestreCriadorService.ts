import type { ApiClient } from './ApiClient';
import { assertLegacyEnvelope } from '../types/api';

/**
 * Servico do Mestre Criador (assistente de IA para o wizard de criacao de
 * personagem). Sem schema Zod dedicado na Fase 1 — o retorno do agente
 * mistura sugestoes, transicoes de etapa e atributos sugeridos.
 * TODO Fase 3: criar `mestreCriadorResponseSchema`.
 */

interface InteragirParams {
  etapa: string;
  estado: Record<string, unknown>;
  mensagemJogador: string;
  historico: unknown[];
  actionMode?: 'reply' | string;
  sistema?: string;
}

export class MestreCriadorService {
  private readonly apiClient: ApiClient;
  private readonly baseUrl: string;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/mestre-criador';
  }

  /**
   * Interage com o Mestre Criador. Retorna `{ mensagem, sugestoes,
   * etapa_proxima, atributos_sugeridos }` (shape variavel — tipado como
   * `unknown` ate o schema Fase 3).
   */
  async interagir({
    etapa,
    estado,
    mensagemJogador,
    historico,
    actionMode = 'reply',
    sistema,
  }: InteragirParams): Promise<unknown> {
    const raw = await this.apiClient.post(`${this.baseUrl}/interagir`, {
      etapa,
      estado,
      mensagemJogador,
      historico,
      actionMode,
      sistema,
    });
    const env = assertLegacyEnvelope<unknown>(raw, 'MestreCriadorService.interagir');
    if (!env.success) {
      throw new Error(env.message || 'Erro ao interagir com Mestre Criador');
    }
    return env.data;
  }
}
