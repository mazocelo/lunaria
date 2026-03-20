/**
 * Tests for all catalog-style Zustand stores that share a similar pattern:
 * - personagem, mestre, historia, feed, amizade, raca, equipamento,
 *   habilidade, vantagem, desvantagem, monstro
 *
 * Each store follows the combine(initialStates, createActions) pattern.
 * We test: initial state, basic actions, and reset behaviour.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock all services used by catalog stores
vi.mock('../../services/index.js', () => ({
  temaService: { getAll: vi.fn() },
  classeService: { getAll: vi.fn() },
  racaService: { getAll: vi.fn() },
  vantagemService: { getAll: vi.fn() },
  desvantagemService: { getAll: vi.fn() },
  mestreService: { getAll: vi.fn() },
  personagemService: { getAll: vi.fn() },
  historiaService: { getAll: vi.fn() },
  feedService: { getAll: vi.fn() },
  habilidadeService: { getAll: vi.fn() },
  equipamentoService: { getAll: vi.fn() },
  monstroService: { getAll: vi.fn() },
  amizadeService: { getAll: vi.fn() },
}));

// ---- Personagem Store ----
import { usePersonagemStore } from '../../store/personagem/index.js';
import { personagemInitialStates } from '../../store/personagem/states.js';

// ---- Mestre Store ----
import { useMestreStore } from '../../store/mestre/index.js';
import { mestreInitialStates } from '../../store/mestre/states.js';

// ---- Historia Store ----
import { useHistoriaStore } from '../../store/historia/index.js';
import { historiaInitialStates } from '../../store/historia/states.js';

// ---- Feed Store ----
import { useFeedStore } from '../../store/feed/index.js';
import { feedInitialStates } from '../../store/feed/states.js';

// ---- Amizade Store ----
import { useAmizadeStore } from '../../store/amizade/index.js';
import { amizadeInitialStates } from '../../store/amizade/states.js';

// ---- Raca Store ----
import { useRacaStore } from '../../store/raca/index.js';
import { racaInitialStates } from '../../store/raca/states.js';

// ---- Equipamento Store ----
import { useEquipamentoStore } from '../../store/equipamento/index.js';
import { equipamentoInitialStates } from '../../store/equipamento/states.js';

// ---- Habilidade Store ----
import { useHabilidadeStore } from '../../store/habilidade/index.js';
import { habilidadeInitialStates } from '../../store/habilidade/states.js';

// ---- Vantagem Store ----
import { useVantagemStore } from '../../store/vantagem/index.js';
import { vantagemInitialStates } from '../../store/vantagem/states.js';

// ---- Desvantagem Store ----
import { useDesvantagemStore } from '../../store/desvantagem/index.js';
import { desvantagemInitialStates } from '../../store/desvantagem/states.js';

// ---- Monstro Store ----
import { useMonstroStore } from '../../store/monstro/index.js';
import { monstroInitialStates } from '../../store/monstro/states.js';

// =====================================================================
// Helper to test common catalog store patterns
// =====================================================================

/**
 * Creates a standard test suite for a catalog store.
 *
 * @param {string} name - Display name for the test suite
 * @param {object} store - Zustand store (useXxxStore)
 * @param {object} initialStates - The exported initial states object
 * @param {object} opts - Additional test options:
 *   @param {string[]} opts.listKey - Primary list field name(s) (e.g. 'personagens')
 *   @param {string} opts.loadedKey - Flag field (e.g. 'personagensCarregados')
 *   @param {boolean} opts.hasMapCache - Whether the store uses Map() for caches
 */
function describeCatalogStore(name, store, initialStates, opts) {
  const { listKeys = [], loadedKey, hasMapCache = false } = opts;

  describe(`${name} - Initial State`, () => {
    beforeEach(() => {
      // Deep-reset: for stores using Map, we need to recreate them
      const resetState = {};
      for (const [key, val] of Object.entries(initialStates)) {
        if (val instanceof Map) {
          resetState[key] = new Map();
        } else if (Array.isArray(val)) {
          resetState[key] = [];
        } else if (val !== null && typeof val === 'object') {
          resetState[key] = { ...val };
        } else {
          resetState[key] = val;
        }
      }
      store.setState(resetState, true);
    });

    for (const listKey of listKeys) {
      it(`has empty ${listKey}`, () => {
        const val = store.getState()[listKey];
        if (val instanceof Map) {
          expect(val.size).toBe(0);
        } else {
          expect(val).toEqual([]);
        }
      });
    }

    if (loadedKey) {
      it(`has ${loadedKey} = false`, () => {
        expect(store.getState()[loadedKey]).toBe(false);
      });
    }

    it('has loading = false', () => {
      expect(store.getState().loading).toBe(false);
    });

    it('has error = null', () => {
      expect(store.getState().error).toBeNull();
    });
  });

  describe(`${name} - State Mutations`, () => {
    beforeEach(() => {
      const resetState = {};
      for (const [key, val] of Object.entries(initialStates)) {
        if (val instanceof Map) {
          resetState[key] = new Map();
        } else if (Array.isArray(val)) {
          resetState[key] = [];
        } else if (val !== null && typeof val === 'object') {
          resetState[key] = { ...val };
        } else {
          resetState[key] = val;
        }
      }
      store.setState(resetState, true);
    });

    it('can set loading to true', () => {
      store.setState({ loading: true });
      expect(store.getState().loading).toBe(true);
    });

    it('can set error string', () => {
      store.setState({ error: 'test error' });
      expect(store.getState().error).toBe('test error');
    });

    it('can clear error back to null', () => {
      store.setState({ error: 'err' });
      store.setState({ error: null });
      expect(store.getState().error).toBeNull();
    });

    if (loadedKey) {
      it(`can set ${loadedKey} to true`, () => {
        store.setState({ [loadedKey]: true });
        expect(store.getState()[loadedKey]).toBe(true);
      });
    }

    for (const listKey of listKeys) {
      it(`can populate ${listKey}`, () => {
        const val = initialStates[listKey];
        if (val instanceof Map) {
          const m = new Map();
          m.set(1, { id: 1, nome: 'Test' });
          store.setState({ [listKey]: m });
          expect(store.getState()[listKey].size).toBe(1);
        } else {
          store.setState({ [listKey]: [{ id: 1, nome: 'Test' }] });
          expect(store.getState()[listKey]).toHaveLength(1);
        }
      });
    }
  });
}

// =====================================================================
// Run test suites for each catalog store
// =====================================================================

describeCatalogStore('Personagem Store', usePersonagemStore, personagemInitialStates, {
  listKeys: ['personagens'],
  loadedKey: 'personagensCarregados',
  hasMapCache: true,
});

describeCatalogStore('Mestre Store', useMestreStore, mestreInitialStates, {
  listKeys: ['mestres', 'mestresAtivos'],
  loadedKey: 'mestresCarregados',
  hasMapCache: true,
});

describeCatalogStore('Historia Store', useHistoriaStore, historiaInitialStates, {
  listKeys: ['historias'],
  loadedKey: 'historiasCarregadas',
  hasMapCache: true,
});

describeCatalogStore('Feed Store', useFeedStore, feedInitialStates, {
  listKeys: ['posts'],
  loadedKey: 'postsCarregados',
});

describeCatalogStore('Amizade Store', useAmizadeStore, amizadeInitialStates, {
  listKeys: ['amigos', 'pendentes', 'sugestoes'],
  loadedKey: 'amigosCarregados',
});

describeCatalogStore('Raca Store', useRacaStore, racaInitialStates, {
  listKeys: ['racas'],
  loadedKey: 'racasCarregadas',
});

describeCatalogStore('Equipamento Store', useEquipamentoStore, equipamentoInitialStates, {
  listKeys: ['equipamentos'],
  loadedKey: 'equipamentosCarregados',
  hasMapCache: true,
});

describeCatalogStore('Habilidade Store', useHabilidadeStore, habilidadeInitialStates, {
  listKeys: ['habilidades'],
  loadedKey: 'habilidadesCarregadas',
  hasMapCache: true,
});

describeCatalogStore('Vantagem Store', useVantagemStore, vantagemInitialStates, {
  listKeys: ['vantagens', 'vantagensPositivas', 'vantagensNegativas', 'vantagensNeutras'],
  loadedKey: 'vantagensCarregadas',
  hasMapCache: true,
});

describeCatalogStore('Desvantagem Store', useDesvantagemStore, desvantagemInitialStates, {
  listKeys: ['desvantagens', 'desvantagensAtivas'],
  loadedKey: 'desvantagensCarregadas',
  hasMapCache: true,
});

describeCatalogStore('Monstro Store', useMonstroStore, monstroInitialStates, {
  listKeys: ['monstros'],
  loadedKey: 'monstrosCarregados',
  hasMapCache: true,
});

// =====================================================================
// Personagem Store - action-specific tests
// =====================================================================

describe('Personagem Store - Actions', () => {
  beforeEach(() => {
    usePersonagemStore.setState({
      ...personagemInitialStates,
      personagensPorId: new Map(),
    }, true);
  });

  it('processarPersonagens populates personagens and map', () => {
    const data = [
      { id: 1, nome: 'Warrior' },
      { id: 2, nome: 'Mage' },
    ];
    usePersonagemStore.getState().processarPersonagens(data, 2, 0, 50);

    const state = usePersonagemStore.getState();
    expect(state.personagens).toHaveLength(2);
    expect(state.personagensCarregados).toBe(true);
    expect(state.personagensPorId.get(1).nome).toBe('Warrior');
    expect(state.personagensPorId.get(2).nome).toBe('Mage');
  });

  it('getPersonagemById returns correct personagem', () => {
    usePersonagemStore.getState().processarPersonagens(
      [{ id: 5, nome: 'Paladin' }], 1, 0, 50
    );
    expect(usePersonagemStore.getState().getPersonagemById(5).nome).toBe('Paladin');
  });

  it('getPersonagemById returns null for unknown id', () => {
    usePersonagemStore.getState().processarPersonagens([], 0, 0, 50);
    expect(usePersonagemStore.getState().getPersonagemById(999)).toBeNull();
  });

  it('getPersonagemById parses string id', () => {
    usePersonagemStore.getState().processarPersonagens(
      [{ id: 10, nome: 'Ranger' }], 1, 0, 50
    );
    expect(usePersonagemStore.getState().getPersonagemById('10').nome).toBe('Ranger');
  });

  it('resetPersonagemState clears all data', () => {
    usePersonagemStore.getState().processarPersonagens(
      [{ id: 1, nome: 'Test' }], 1, 0, 50
    );
    usePersonagemStore.getState().resetPersonagemState();

    const state = usePersonagemStore.getState();
    expect(state.personagens).toEqual([]);
    expect(state.personagensCarregados).toBe(false);
    expect(state.personagensPorId.size).toBe(0);
  });

  it('hasMore is true when more pages exist', () => {
    usePersonagemStore.getState().processarPersonagens(
      [{ id: 1, nome: 'A' }], 10, 0, 50
    );
    expect(usePersonagemStore.getState().hasMore).toBe(false);
    // offset(0) + limit(50) < total(10) is false since 50 >= 10
    // Let's test with a smaller limit
    usePersonagemStore.getState().processarPersonagens(
      [{ id: 1, nome: 'A' }], 10, 0, 2
    );
    expect(usePersonagemStore.getState().hasMore).toBe(true);
  });
});

// =====================================================================
// Feed Store - specific tests
// =====================================================================

describe('Feed Store - Specific State', () => {
  beforeEach(() => {
    useFeedStore.setState({ ...feedInitialStates }, true);
  });

  it('has activeTab = "amigos" by default', () => {
    expect(useFeedStore.getState().activeTab).toBe('amigos');
  });

  it('can switch activeTab', () => {
    useFeedStore.setState({ activeTab: 'todos' });
    expect(useFeedStore.getState().activeTab).toBe('todos');
  });

  it('has hasMore = false by default', () => {
    expect(useFeedStore.getState().hasMore).toBe(false);
  });

  it('has offset = 0 by default', () => {
    expect(useFeedStore.getState().offset).toBe(0);
  });
});

// =====================================================================
// Amizade Store - specific tests
// =====================================================================

describe('Amizade Store - Specific State', () => {
  beforeEach(() => {
    useAmizadeStore.setState({ ...amizadeInitialStates }, true);
  });

  it('tracks three separate loaded flags', () => {
    const s = useAmizadeStore.getState();
    expect(s.amigosCarregados).toBe(false);
    expect(s.pendentesCarregados).toBe(false);
    expect(s.sugestoesCarregadas).toBe(false);
  });

  it('can independently set lists', () => {
    useAmizadeStore.setState({
      amigos: [{ id: 1 }],
      pendentes: [{ id: 2 }],
      sugestoes: [{ id: 3 }],
    });
    expect(useAmizadeStore.getState().amigos).toHaveLength(1);
    expect(useAmizadeStore.getState().pendentes).toHaveLength(1);
    expect(useAmizadeStore.getState().sugestoes).toHaveLength(1);
  });
});

// =====================================================================
// Vantagem Store - specific tests for cost-based partitions
// =====================================================================

describe('Vantagem Store - Cost Partitioning', () => {
  beforeEach(() => {
    useVantagemStore.setState({
      ...vantagemInitialStates,
      vantagensPorId: new Map(),
      vantagensPorNome: new Map(),
    }, true);
  });

  it('initial vantagensPositivas is empty', () => {
    expect(useVantagemStore.getState().vantagensPositivas).toEqual([]);
  });

  it('initial vantagensNegativas is empty', () => {
    expect(useVantagemStore.getState().vantagensNegativas).toEqual([]);
  });

  it('initial vantagensNeutras is empty', () => {
    expect(useVantagemStore.getState().vantagensNeutras).toEqual([]);
  });
});

// =====================================================================
// Desvantagem Store - specific tests
// =====================================================================

describe('Desvantagem Store - Specific State', () => {
  beforeEach(() => {
    useDesvantagemStore.setState({
      ...desvantagemInitialStates,
      desvantagensPorId: new Map(),
      desvantagensPorNome: new Map(),
      desvantagensPorNivel: new Map(),
      desvantagensPorTipo: new Map(),
    }, true);
  });

  it('has empty desvantagensAtivas', () => {
    expect(useDesvantagemStore.getState().desvantagensAtivas).toEqual([]);
  });

  it('has totalDesvantagens = 0', () => {
    expect(useDesvantagemStore.getState().totalDesvantagens).toBe(0);
  });

  it('has null nivelMaisComum and tipoMaisComum', () => {
    expect(useDesvantagemStore.getState().nivelMaisComum).toBeNull();
    expect(useDesvantagemStore.getState().tipoMaisComum).toBeNull();
  });
});

// =====================================================================
// Raca Store - specific tests
// =====================================================================

describe('Raca Store - Specific State', () => {
  beforeEach(() => {
    useRacaStore.setState({ ...racaInitialStates }, true);
  });

  it('has pagination metadata', () => {
    const s = useRacaStore.getState();
    expect(s.total).toBe(0);
    expect(s.offset).toBe(0);
    expect(s.limit).toBe(50);
    expect(s.hasMore).toBe(false);
  });

  it('has empty caches (plain objects)', () => {
    expect(useRacaStore.getState().racasPorId).toEqual({});
    expect(useRacaStore.getState().racasPorNome).toEqual({});
  });

  it('has totalRacas = 0', () => {
    expect(useRacaStore.getState().totalRacas).toBe(0);
  });
});
