/**
 * Tests for the Tema Zustand store.
 *
 * Covers:
 * - Initial state
 * - processarTemas: builds caches (temasPorId, temasPorNome) and sets flags
 * - Accessor helpers: getTemaById, getTemaByNome, getNomesDeTemas, getIdsDeTemas
 * - temaExists
 * - mapearTemasDeHistoria
 * - getTemasParaSelecao / getTemasParaFiltro
 * - carregarTemas (with mocked service)
 * - recarregarTemas
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the service used by tema actions
vi.mock('../../services/index.js', () => ({
  temaService: {
    getAll: vi.fn(),
  },
}));

import { useTemaStore } from '../../store/tema/index.js';
import { temaInitialStates } from '../../store/tema/states.js';
import { temaService } from '../../services/index.js';
import { resetStore } from '../helpers/resetStore.js';

const SAMPLE_TEMAS = [
  { id: 1, nome: 'Fantasia' },
  { id: 2, nome: 'Terror' },
  { id: 3, nome: 'Ficção Científica' },
];

// ---- Reset store before each test ----
beforeEach(() => {
  resetStore(useTemaStore, temaInitialStates);
  vi.clearAllMocks();
});

// ===========================================================================
// Initial State
// ===========================================================================

describe('Tema Store - Initial State', () => {
  it('should have empty temas array', () => {
    expect(useTemaStore.getState().temas).toEqual([]);
  });

  it('should have temasCarregados = false', () => {
    expect(useTemaStore.getState().temasCarregados).toBe(false);
  });

  it('should have loading = false', () => {
    expect(useTemaStore.getState().loading).toBe(false);
  });

  it('should have error = null', () => {
    expect(useTemaStore.getState().error).toBeNull();
  });

  it('should have empty temasPorId', () => {
    expect(useTemaStore.getState().temasPorId).toEqual({});
  });

  it('should have empty temasPorNome', () => {
    expect(useTemaStore.getState().temasPorNome).toEqual({});
  });

  it('should have empty temasAtivos', () => {
    expect(useTemaStore.getState().temasAtivos).toEqual([]);
  });

  it('should have totalTemas = 0', () => {
    expect(useTemaStore.getState().totalTemas).toBe(0);
  });
});

// ===========================================================================
// processarTemas
// ===========================================================================

describe('Tema Store - processarTemas', () => {
  it('populates caches from valid tema data', () => {
    useTemaStore.getState().processarTemas(SAMPLE_TEMAS);

    const state = useTemaStore.getState();
    expect(state.temas).toHaveLength(3);
    expect(state.temasCarregados).toBe(true);
    expect(state.loading).toBe(false);
    expect(state.totalTemas).toBe(3);
    expect(state.lastLoadTime).toBeTruthy();
  });

  it('builds temasPorId map', () => {
    useTemaStore.getState().processarTemas(SAMPLE_TEMAS);

    const { temasPorId } = useTemaStore.getState();
    expect(temasPorId[1].nome).toBe('Fantasia');
    expect(temasPorId[2].nome).toBe('Terror');
    expect(temasPorId[3].nome).toBe('Ficção Científica');
  });

  it('builds temasPorNome map (normalized lowercase)', () => {
    useTemaStore.getState().processarTemas(SAMPLE_TEMAS);

    const { temasPorNome } = useTemaStore.getState();
    expect(temasPorNome['fantasia'].id).toBe(1);
    expect(temasPorNome['terror'].id).toBe(2);
    expect(temasPorNome['ficção científica'].id).toBe(3);
  });

  it('marks all temas as ativos (API has no ativo flag)', () => {
    useTemaStore.getState().processarTemas(SAMPLE_TEMAS);
    expect(useTemaStore.getState().temasAtivos).toHaveLength(3);
  });

  it('filters out invalid temas (missing id)', () => {
    useTemaStore.getState().processarTemas([
      { id: 1, nome: 'Valid' },
      { nome: 'No ID' },
      null,
      { id: 2, nome: 'Also Valid' },
    ]);
    expect(useTemaStore.getState().temas).toHaveLength(2);
    expect(useTemaStore.getState().totalTemas).toBe(2);
  });

  it('handles null input gracefully', () => {
    useTemaStore.getState().processarTemas(null);
    expect(useTemaStore.getState().temas).toEqual([]);
    expect(useTemaStore.getState().temasCarregados).toBe(true);
  });

  it('handles empty array input', () => {
    useTemaStore.getState().processarTemas([]);
    expect(useTemaStore.getState().temas).toEqual([]);
    expect(useTemaStore.getState().totalTemas).toBe(0);
  });
});

// ===========================================================================
// Accessor helpers
// ===========================================================================

describe('Tema Store - Accessors', () => {
  beforeEach(() => {
    useTemaStore.getState().processarTemas(SAMPLE_TEMAS);
  });

  it('getTemaById returns the correct tema', () => {
    const tema = useTemaStore.getState().getTemaById(2);
    expect(tema.nome).toBe('Terror');
  });

  it('getTemaById returns null for unknown id', () => {
    expect(useTemaStore.getState().getTemaById(999)).toBeNull();
  });

  it('getTemaByNome returns the correct tema (case-insensitive)', () => {
    const tema = useTemaStore.getState().getTemaByNome('FANTASIA');
    expect(tema.id).toBe(1);
  });

  it('getTemaByNome returns null for unknown name', () => {
    expect(useTemaStore.getState().getTemaByNome('Steampunk')).toBeNull();
  });

  it('getTemaByNome returns null for null input', () => {
    expect(useTemaStore.getState().getTemaByNome(null)).toBeNull();
  });

  it('getNomesDeTemas converts IDs to names', () => {
    const nomes = useTemaStore.getState().getNomesDeTemas([1, 3]);
    expect(nomes).toEqual(['Fantasia', 'Ficção Científica']);
  });

  it('getNomesDeTemas filters out unknown IDs', () => {
    const nomes = useTemaStore.getState().getNomesDeTemas([1, 999]);
    expect(nomes).toEqual(['Fantasia']);
  });

  it('getNomesDeTemas returns empty for non-array', () => {
    expect(useTemaStore.getState().getNomesDeTemas('not-array')).toEqual([]);
  });

  it('getIdsDeTemas converts names to IDs', () => {
    const ids = useTemaStore.getState().getIdsDeTemas(['Terror', 'Fantasia']);
    expect(ids).toEqual([2, 1]);
  });

  it('getIdsDeTemas filters out unknown names', () => {
    const ids = useTemaStore.getState().getIdsDeTemas(['Terror', 'Unknown']);
    expect(ids).toEqual([2]);
  });

  it('getIdsDeTemas returns empty for non-array', () => {
    expect(useTemaStore.getState().getIdsDeTemas(null)).toEqual([]);
  });
});

// ===========================================================================
// temaExists
// ===========================================================================

describe('Tema Store - temaExists', () => {
  beforeEach(() => {
    useTemaStore.getState().processarTemas(SAMPLE_TEMAS);
  });

  it('returns true for existing ID (number)', () => {
    expect(useTemaStore.getState().temaExists(1)).toBe(true);
  });

  it('returns true for existing ID (string number)', () => {
    expect(useTemaStore.getState().temaExists('2')).toBe(true);
  });

  it('returns false for unknown ID', () => {
    expect(useTemaStore.getState().temaExists(999)).toBe(false);
  });

  it('returns true for existing name', () => {
    expect(useTemaStore.getState().temaExists('fantasia')).toBe(true);
  });

  it('returns false for unknown name', () => {
    expect(useTemaStore.getState().temaExists('cyberpunk')).toBe(false);
  });
});

// ===========================================================================
// mapearTemasDeHistoria
// ===========================================================================

describe('Tema Store - mapearTemasDeHistoria', () => {
  beforeEach(() => {
    useTemaStore.getState().processarTemas(SAMPLE_TEMAS);
  });

  it('returns tema names when historia has ID array', () => {
    const result = useTemaStore.getState().mapearTemasDeHistoria({ temas: [1, 2] });
    expect(result).toEqual(['Fantasia', 'Terror']);
  });

  it('returns tema objects as-is when already containing nome', () => {
    const temaObjects = [{ id: 1, nome: 'Fantasia' }];
    const result = useTemaStore.getState().mapearTemasDeHistoria({ temas: temaObjects });
    expect(result).toEqual(temaObjects);
  });

  it('returns empty array for null historia', () => {
    expect(useTemaStore.getState().mapearTemasDeHistoria(null)).toEqual([]);
  });

  it('returns empty array for historia without temas', () => {
    expect(useTemaStore.getState().mapearTemasDeHistoria({ id: 1 })).toEqual([]);
  });
});

// ===========================================================================
// ViewModel getters
// ===========================================================================

describe('Tema Store - ViewModel Getters', () => {
  beforeEach(() => {
    useTemaStore.getState().processarTemas(SAMPLE_TEMAS);
  });

  it('getTemasParaSelecao returns objects with id, nome, cor', () => {
    const selecao = useTemaStore.getState().getTemasParaSelecao();
    expect(selecao).toHaveLength(3);
    selecao.forEach((t) => {
      expect(t).toHaveProperty('id');
      expect(t).toHaveProperty('nome');
      expect(t).toHaveProperty('cor');
    });
  });

  it('getTemasParaFiltro includes "Todos os temas" option', () => {
    const filtro = useTemaStore.getState().getTemasParaFiltro();
    expect(filtro[0]).toEqual({ id: null, nome: 'Todos os temas' });
    expect(filtro).toHaveLength(4); // "Todos" + 3 real temas
  });
});

// ===========================================================================
// carregarTemas (API integration with mocked service)
// ===========================================================================

describe('Tema Store - carregarTemas', () => {
  it('loads temas from the API and populates the store', async () => {
    temaService.getAll.mockResolvedValue({ data: SAMPLE_TEMAS });

    await useTemaStore.getState().carregarTemas();

    const state = useTemaStore.getState();
    expect(state.temas).toHaveLength(3);
    expect(state.temasCarregados).toBe(true);
    expect(temaService.getAll).toHaveBeenCalledTimes(1);
  });

  it('does not reload when already loaded', async () => {
    temaService.getAll.mockResolvedValue({ data: SAMPLE_TEMAS });

    await useTemaStore.getState().carregarTemas();
    await useTemaStore.getState().carregarTemas();

    expect(temaService.getAll).toHaveBeenCalledTimes(1);
  });

  it('sets error when API fails', async () => {
    temaService.getAll.mockRejectedValue(new Error('Network error'));

    await expect(useTemaStore.getState().carregarTemas()).rejects.toThrow('Network error');

    const state = useTemaStore.getState();
    expect(state.error).toBe('Network error');
    expect(state.loading).toBe(false);
  });
});

// ===========================================================================
// recarregarTemas
// ===========================================================================

describe('Tema Store - recarregarTemas', () => {
  it('resets cache and reloads', async () => {
    // First load
    temaService.getAll.mockResolvedValue({ data: SAMPLE_TEMAS });
    await useTemaStore.getState().carregarTemas();
    expect(useTemaStore.getState().temasCarregados).toBe(true);

    // Reload
    temaService.getAll.mockResolvedValue({ data: [{ id: 1, nome: 'New' }] });
    await useTemaStore.getState().recarregarTemas();

    expect(useTemaStore.getState().temas).toHaveLength(1);
    expect(useTemaStore.getState().temas[0].nome).toBe('New');
    expect(temaService.getAll).toHaveBeenCalledTimes(2);
  });
});
