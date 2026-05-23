/**
 * Boundary tests para a Fase 2b — confirma que o padrao Zod-no-boundary
 * aplicado em RacaService, ClasseService e MonstroService falha LOUD
 * quando o backend devolve shape invalido (drift entre API e schema).
 *
 * Cobertura intencionalmente fina: a Fase 2a (PersonagemService) ja provou
 * o padrao. Aqui testamos um ramo de cada service da Fase 2b para confirmar
 * que `assertLegacyEnvelope` + `parseRaw` funcionam em conjunto.
 */

import { describe, expect, it, vi } from 'vitest';
import { RacaService } from '../../services/RacaService';
import { ClasseService } from '../../services/ClasseService';
import { MonstroService } from '../../services/MonstroService';
import { VantagemService } from '../../services/VantagemService';
import type { ApiClient } from '../../services/ApiClient';

function buildFakeApiClient(overrides: Partial<Record<keyof ApiClient, unknown>> = {}): ApiClient {
  const fake = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    request: vi.fn(),
    ...overrides,
  };
  return fake as unknown as ApiClient;
}

describe('Catalog services boundary (Fase 2b)', () => {
  describe('RacaService', () => {
    it('getAll lanca [contract:...] quando data nao e array', async () => {
      const apiClient = buildFakeApiClient({
        get: vi.fn().mockResolvedValue({
          success: true,
          data: { id: 1, nome: 'X', sistema: 'lunaria' },
        }),
      });
      const service = new RacaService(apiClient);
      await expect(service.getAll()).rejects.toThrow(
        /\[contract:RacaService\.getAll\]/,
      );
    });

    it('getById aceita payload valido', async () => {
      const apiClient = buildFakeApiClient({
        get: vi.fn().mockResolvedValue({
          success: true,
          data: { id: 5, nome: 'Elfo', custo: 0, sistema: 'lunaria' },
        }),
      });
      const service = new RacaService(apiClient);
      const res = await service.getById(5);
      expect(res.data.id).toBe(5);
      expect(res.data.nome).toBe('Elfo');
    });
  });

  describe('ClasseService', () => {
    it('getById lanca [contract:...] quando falta `sistema`', async () => {
      const apiClient = buildFakeApiClient({
        get: vi.fn().mockResolvedValue({
          success: true,
          data: { id: 1, nome: 'Mago' },
        }),
      });
      const service = new ClasseService(apiClient);
      await expect(service.getById(1)).rejects.toThrow(
        /\[contract:ClasseService\.getById\]/,
      );
    });
  });

  describe('MonstroService', () => {
    it('falha loud quando envelope nao traz { success, data }', async () => {
      const apiClient = buildFakeApiClient({
        get: vi.fn().mockResolvedValue({ foo: 'bar' }),
      });
      const service = new MonstroService(apiClient);
      await expect(service.getById(1)).rejects.toThrow(
        /\[contract:MonstroService\.getById\]/,
      );
    });
  });

  describe('VantagemService', () => {
    it('getAll lanca [contract:...] quando item da lista nao tem `nome`', async () => {
      const apiClient = buildFakeApiClient({
        get: vi.fn().mockResolvedValue({
          success: true,
          data: [{ id: 1, descricao: 'sem nome', sistema: 'lunaria' }],
        }),
      });
      const service = new VantagemService(apiClient);
      await expect(service.getAll()).rejects.toThrow(
        /\[contract:VantagemService\.getAll\]/,
      );
    });
  });
});
