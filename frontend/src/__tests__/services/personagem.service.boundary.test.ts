/**
 * Testes de boundary do PersonagemService — garantem que a validacao Zod
 * dispara nos pontos certos quando o backend devolve shape invalido.
 *
 * Esse e o teste real do valor da migracao Fase 2a: provar fail-loud com
 * `[contract:<ctx>]` antes do payload corrompido chegar no Model/View.
 *
 * Usamos um ApiClient fake (objeto literal) tipado como `ApiClient` para
 * evitar dependencia do axios real e podermos controlar o retorno por teste.
 */

import { describe, expect, it, vi } from 'vitest';
import { PersonagemService } from '../../services/PersonagemService';
import type { ApiClient } from '../../services/ApiClient';

/**
 * Fabrica um ApiClient minimo com mocks por metodo. So expomos o que o
 * service usa; os tipos batem porque o service depende apenas da interface
 * publica de `ApiClient` (estrutural).
 */
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

const fixturePersonagemLunaria = {
  id: 42,
  nome: 'Aria',
  sistema: 'lunaria',
  nivel: 1,
  atributos: { forca: 10 },
  stats_sistema: null,
};

describe('PersonagemService boundary (Zod no service)', () => {
  it('getById lanca [contract:...] quando payload nao tem `sistema`', async () => {
    const apiClient = buildFakeApiClient({
      get: vi.fn().mockResolvedValue({
        success: true,
        // Falta o campo discriminante `sistema` — discriminatedUnion deve falhar.
        data: { id: 1, nome: 'X' },
      }),
    });
    const service = new PersonagemService(apiClient);

    await expect(service.getById(1)).rejects.toThrow(
      /\[contract:PersonagemService\.getById\]/,
    );
  });

  it('getAll lanca [contract:...] quando data nao e array', async () => {
    const apiClient = buildFakeApiClient({
      get: vi.fn().mockResolvedValue({
        success: true,
        // Lista esperada — mas vem objeto.
        data: { id: 1, nome: 'X', sistema: 'lunaria' },
      }),
    });
    const service = new PersonagemService(apiClient);

    await expect(service.getAll()).rejects.toThrow(
      /\[contract:PersonagemService\.getAll\]/,
    );
  });

  it('getById aceita payload valido e retorna instancia do Model', async () => {
    const apiClient = buildFakeApiClient({
      get: vi.fn().mockResolvedValue({
        success: true,
        data: fixturePersonagemLunaria,
      }),
    });
    const service = new PersonagemService(apiClient);

    const personagem = await service.getById(42);
    expect(personagem.id).toBe(42);
    expect(personagem.nome).toBe('Aria');
    expect(personagem.sistema).toBe('lunaria');
  });

  it('falha loud quando envelope legado nao traz { success, data }', async () => {
    const apiClient = buildFakeApiClient({
      get: vi.fn().mockResolvedValue({ foo: 'bar' }),
    });
    const service = new PersonagemService(apiClient);

    await expect(service.getById(1)).rejects.toThrow(
      /\[contract:PersonagemService\.getById\]/,
    );
  });
});
