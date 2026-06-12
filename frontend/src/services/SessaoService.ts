import type { ApiClient } from './ApiClient';
import { assertLegacyEnvelope } from '../types/api';

/**
 * SessaoService toca apenas endpoints REST (`/sessoes/historia/:id` para listar
 * metadados e `/sessoes/historico/:id` para o historico completo com mensagens).
 * O estado VIVO da sessao mora no Redis e e consumido por outro caminho
 * (`websocket/`) — esse codigo nao passa por aqui.
 *
 * Os endpoints REST devolvem o envelope legado `{ success, data, error? }`.
 * O `data` da listagem e um array de snapshots (tabela `sessoes_jogo`); o do
 * historico e a sessao completa com mensagens. Como ainda nao ha schema Zod
 * dedicado para esses payloads administrativos, retornamos `unknown` no
 * boundary e deixamos `TODO Fase 3` para tipar quando o schema existir.
 */

export class SessaoService {
  private readonly apiClient: ApiClient;
  private readonly baseUrl: string;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/sessoes';
  }

  /**
   * Lista sessoes de uma historia (metadata, sem mensagens).
   * TODO Fase 3: criar schema `sessaoListaSchema` para o snapshot administrativo.
   */
  async getSessoesByHistoria(historiaId: number | string): Promise<unknown[]> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}/historia/${historiaId}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'SessaoService.getSessoesByHistoria');
      if (!env.success) {
        throw new Error(env.error || env.message || 'Erro ao buscar sessões');
      }
      return Array.isArray(env.data) ? env.data : [];
    } catch (error) {
      throw new Error(`Erro ao buscar sessões: ${(error as Error).message}`);
    }
  }

  /**
   * Busca historico completo de uma sessao (com mensagens).
   * TODO Fase 3: o `sessaoSchema` em types/api/sessao.ts modela o objeto Redis;
   * o historico devolvido aqui e o snapshot do Prisma (shape diferente).
   */
  async getSessaoHistorico(sessaoId: number | string): Promise<unknown> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}/historico/${sessaoId}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'SessaoService.getSessaoHistorico');
      if (!env.success) {
        throw new Error(env.error || env.message || 'Erro ao buscar histórico');
      }
      return env.data;
    } catch (error) {
      throw new Error(`Erro ao buscar histórico: ${(error as Error).message}`);
    }
  }
}
