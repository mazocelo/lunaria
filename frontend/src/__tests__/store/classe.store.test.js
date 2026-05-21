/**
 * Tests for the Classe Zustand store.
 *
 * Covers:
 * - Initial state
 * - processarClasses: caches, pagination metadata
 * - Accessor helpers: getClasseById, getClasseByNome, getNomesDeClasses, getIdsDeClasses
 * - classeExists
 * - mapearClasseDePersonagem
 * - ViewModel getters (getClassesParaSelecao, getClassesParaFiltro)
 * - carregarClasses (mocked service)
 * - Pagination: hasMore flag
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../services/index.js', () => ({
  classeService: {
    getAll: vi.fn(),
  },
}));

import { useClasseStore } from '../../store/classe/index.js';
import { classeInitialStates } from '../../store/classe/states.js';
import { classeService } from '../../services/index.js';
import { resetStore } from '../helpers/resetStore.js';

const SAMPLE_CLASSES = [
  { id: 1, nome: 'Guerreiro', descricao: 'Fighter class', nivel_inicial: 1 },
  { id: 2, nome: 'Mago', descricao: 'Wizard class', nivel_inicial: 1 },
  { id: 3, nome: 'Ladino', descricao: 'Rogue class', nivel_inicial: 1 },
];

beforeEach(() => {
  resetStore(useClasseStore, classeInitialStates);
  vi.clearAllMocks();
});

// ===========================================================================
// Initial State
// ===========================================================================

describe('Classe Store - Initial State', () => {
  it('has empty classes array', () => {
    expect(useClasseStore.getState().classes).toEqual([]);
  });

  it('has classesCarregadas = false', () => {
    expect(useClasseStore.getState().classesCarregadas).toBe(false);
  });

  it('has loading = false', () => {
    expect(useClasseStore.getState().loading).toBe(false);
  });

  it('has error = null', () => {
    expect(useClasseStore.getState().error).toBeNull();
  });

  it('has empty caches', () => {
    expect(useClasseStore.getState().classesPorId).toEqual({});
    expect(useClasseStore.getState().classesPorNome).toEqual({});
  });

  it('has pagination defaults', () => {
    const s = useClasseStore.getState();
    expect(s.total).toBe(0);
    expect(s.offset).toBe(0);
    expect(s.limit).toBe(50);
    expect(s.hasMore).toBe(false);
  });
});

// ===========================================================================
// processarClasses
// ===========================================================================

describe('Classe Store - processarClasses', () => {
  it('populates classes and caches', () => {
    useClasseStore.getState().processarClasses(SAMPLE_CLASSES, 3, 0, 50);

    const state = useClasseStore.getState();
    expect(state.classes).toHaveLength(3);
    expect(state.classesCarregadas).toBe(true);
    expect(state.totalClasses).toBe(3);
    expect(state.total).toBe(3);
  });

  it('builds classesPorId map', () => {
    useClasseStore.getState().processarClasses(SAMPLE_CLASSES, 3, 0, 50);

    const { classesPorId } = useClasseStore.getState();
    expect(classesPorId[1].nome).toBe('Guerreiro');
    expect(classesPorId[2].nome).toBe('Mago');
  });

  it('builds classesPorNome map (lowercase)', () => {
    useClasseStore.getState().processarClasses(SAMPLE_CLASSES, 3, 0, 50);

    const { classesPorNome } = useClasseStore.getState();
    expect(classesPorNome['guerreiro'].id).toBe(1);
    expect(classesPorNome['ladino'].id).toBe(3);
  });

  it('calculates hasMore correctly when more data exists', () => {
    useClasseStore.getState().processarClasses(SAMPLE_CLASSES, 10, 0, 50);
    // offset(0) + data.length(3) < total(10)
    expect(useClasseStore.getState().hasMore).toBe(true);
  });

  it('calculates hasMore = false when all loaded', () => {
    useClasseStore.getState().processarClasses(SAMPLE_CLASSES, 3, 0, 50);
    expect(useClasseStore.getState().hasMore).toBe(false);
  });

  it('filters out entries without id', () => {
    useClasseStore.getState().processarClasses(
      [{ id: 1, nome: 'Valid' }, { nome: 'Invalid' }, null],
      1, 0, 50
    );
    expect(useClasseStore.getState().classes).toHaveLength(1);
  });
});

// ===========================================================================
// Accessors
// ===========================================================================

describe('Classe Store - Accessors', () => {
  beforeEach(() => {
    useClasseStore.getState().processarClasses(SAMPLE_CLASSES, 3, 0, 50);
  });

  it('getClasseById returns correct class', () => {
    expect(useClasseStore.getState().getClasseById(2).nome).toBe('Mago');
  });

  it('getClasseById returns null for unknown id', () => {
    expect(useClasseStore.getState().getClasseById(999)).toBeNull();
  });

  it('getClasseByNome is case-insensitive', () => {
    expect(useClasseStore.getState().getClasseByNome('GUERREIRO').id).toBe(1);
  });

  it('getClasseByNome returns null for null input', () => {
    expect(useClasseStore.getState().getClasseByNome(null)).toBeNull();
  });

  it('getNomesDeClasses maps IDs to names', () => {
    const nomes = useClasseStore.getState().getNomesDeClasses([1, 3]);
    expect(nomes).toEqual(['Guerreiro', 'Ladino']);
  });

  it('getNomesDeClasses ignores unknown IDs', () => {
    const nomes = useClasseStore.getState().getNomesDeClasses([1, 999]);
    expect(nomes).toEqual(['Guerreiro']);
  });

  it('getNomesDeClasses returns empty for non-array', () => {
    expect(useClasseStore.getState().getNomesDeClasses('nope')).toEqual([]);
  });

  it('getIdsDeClasses maps names to IDs', () => {
    const ids = useClasseStore.getState().getIdsDeClasses(['mago', 'Ladino']);
    expect(ids).toEqual([2, 3]);
  });

  it('getIdsDeClasses returns empty for non-array', () => {
    expect(useClasseStore.getState().getIdsDeClasses(null)).toEqual([]);
  });
});

// ===========================================================================
// classeExists
// ===========================================================================

describe('Classe Store - classeExists', () => {
  beforeEach(() => {
    useClasseStore.getState().processarClasses(SAMPLE_CLASSES, 3, 0, 50);
  });

  it('returns true for known numeric id', () => {
    expect(useClasseStore.getState().classeExists(1)).toBe(true);
  });

  it('returns true for known string numeric id', () => {
    expect(useClasseStore.getState().classeExists('2')).toBe(true);
  });

  it('returns false for unknown id', () => {
    expect(useClasseStore.getState().classeExists(999)).toBe(false);
  });

  it('returns true for known name (case-insensitive)', () => {
    expect(useClasseStore.getState().classeExists('guerreiro')).toBe(true);
  });

  it('returns false for unknown name', () => {
    expect(useClasseStore.getState().classeExists('paladino')).toBe(false);
  });
});

// ===========================================================================
// mapearClasseDePersonagem
// ===========================================================================

describe('Classe Store - mapearClasseDePersonagem', () => {
  beforeEach(() => {
    useClasseStore.getState().processarClasses(SAMPLE_CLASSES, 3, 0, 50);
  });

  it('returns the classe object for a personagem', () => {
    const classe = useClasseStore.getState().mapearClasseDePersonagem({ classe_id: 2 });
    expect(classe.nome).toBe('Mago');
  });

  it('returns null for personagem without classe_id', () => {
    expect(useClasseStore.getState().mapearClasseDePersonagem({ nome: 'Orphan' })).toBeNull();
  });

  it('returns null for null personagem', () => {
    expect(useClasseStore.getState().mapearClasseDePersonagem(null)).toBeNull();
  });
});

// ===========================================================================
// ViewModel getters
// ===========================================================================

describe('Classe Store - ViewModel Getters', () => {
  beforeEach(() => {
    useClasseStore.getState().processarClasses(SAMPLE_CLASSES, 3, 0, 50);
  });

  it('getClassesParaSelecao returns id, nome, descricao, nivel_inicial', () => {
    const selecao = useClasseStore.getState().getClassesParaSelecao();
    expect(selecao).toHaveLength(3);
    selecao.forEach((c) => {
      expect(c).toHaveProperty('id');
      expect(c).toHaveProperty('nome');
      expect(c).toHaveProperty('descricao');
      expect(c).toHaveProperty('nivel_inicial');
    });
  });

  it('getClassesParaFiltro includes "Todas as classes" option', () => {
    const filtro = useClasseStore.getState().getClassesParaFiltro();
    expect(filtro[0]).toEqual({ id: null, nome: 'Todas as classes' });
    expect(filtro).toHaveLength(4);
  });
});

// ===========================================================================
// carregarClasses (API)
// ===========================================================================

describe('Classe Store - carregarClasses', () => {
  it('loads classes from the API and populates the store', async () => {
    classeService.getAll.mockResolvedValue({
      data: SAMPLE_CLASSES,
      pagination: { total: 3, limit: 50, offset: 0, hasMore: false },
    });

    await useClasseStore.getState().carregarClasses();

    const state = useClasseStore.getState();
    expect(state.classes).toHaveLength(3);
    expect(state.classesCarregadas).toBe(true);
    expect(classeService.getAll).toHaveBeenCalledTimes(1);
  });

  it('skips reload when already loaded', async () => {
    classeService.getAll.mockResolvedValue({ data: SAMPLE_CLASSES });
    await useClasseStore.getState().carregarClasses();
    await useClasseStore.getState().carregarClasses();
    expect(classeService.getAll).toHaveBeenCalledTimes(1);
  });

  it('forceReload bypasses cache', async () => {
    classeService.getAll.mockResolvedValue({ data: SAMPLE_CLASSES });
    await useClasseStore.getState().carregarClasses();
    await useClasseStore.getState().carregarClasses(true);
    expect(classeService.getAll).toHaveBeenCalledTimes(2);
  });

  it('sets error state on API failure', async () => {
    classeService.getAll.mockRejectedValue(new Error('Server down'));
    await expect(useClasseStore.getState().carregarClasses()).rejects.toThrow();
    expect(useClasseStore.getState().error).toBe('Server down');
    expect(useClasseStore.getState().loading).toBe(false);
  });
});
