/**
 * Tests for the Game Zustand store.
 *
 * Covers:
 * - Initial state values
 * - Historia actions
 * - Personagem selection & validation
 * - Participante management (add / remove / update)
 * - Sala open/close
 * - Message management (add / update / set / dedup)
 * - Reset and persistence helpers
 * - Computed selectors
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the game message normalizer used by game actions
vi.mock('../../utils/gameMessageNormalizer.js', () => ({
  normalizeGameMessage: (msg) => ({
    ...msg,
    id: msg.id || `gen_${Math.random().toString(36).slice(2, 8)}`,
    tipo: msg.tipo || 'sistema',
    type: msg.tipo || 'sistema',
    message: msg.message || msg.mensagem || '',
    mensagem: msg.message || msg.mensagem || '',
    segmentos: msg.segmentos || [],
  }),
  normalizeGameMessages: (msgs) =>
    (msgs || []).map((m, i) => ({
      ...m,
      id: m.id || `gen_${i}`,
      tipo: m.tipo || 'sistema',
      type: m.tipo || 'sistema',
      message: m.message || m.mensagem || '',
      mensagem: m.message || m.mensagem || '',
      segmentos: m.segmentos || [],
    })),
}));

import { useGameStore, gameInitialStates } from '../../store/game/index.js';
import { useGameSelectors } from '../../store/game/index.js';

// ---- Reset store before each test ----
beforeEach(() => {
  // Reset Zustand state fully
  useGameStore.setState({ ...gameInitialStates }, true);
  localStorage.clear();
});

// ===========================================================================
// Initial state
// ===========================================================================

describe('Game Store - Initial State', () => {
  it('should have historiaAtual = null', () => {
    expect(useGameStore.getState().historiaAtual).toBeNull();
  });

  it('should have loading = false', () => {
    expect(useGameStore.getState().loading).toBe(false);
  });

  it('should have error = null', () => {
    expect(useGameStore.getState().error).toBeNull();
  });

  it('should have empty personagensDaHistoria', () => {
    expect(useGameStore.getState().personagensDaHistoria).toEqual([]);
  });

  it('should have personagemSelecionado = null', () => {
    expect(useGameStore.getState().personagemSelecionado).toBeNull();
  });

  it('should have sessaoId = null', () => {
    expect(useGameStore.getState().sessaoId).toBeNull();
  });

  it('should have empty participantes', () => {
    expect(useGameStore.getState().participantes).toEqual([]);
  });

  it('should have isDonoSala = false', () => {
    expect(useGameStore.getState().isDonoSala).toBe(false);
  });

  it('should have salaAberta = false', () => {
    expect(useGameStore.getState().salaAberta).toBe(false);
  });

  it('should have podeIniciarJogo = false', () => {
    expect(useGameStore.getState().podeIniciarJogo).toBe(false);
  });

  it('should have empty mensagens', () => {
    expect(useGameStore.getState().mensagens).toEqual([]);
  });

  it('should have empty statusPersonagem', () => {
    expect(useGameStore.getState().statusPersonagem).toEqual({});
  });
});

// ===========================================================================
// Historia actions
// ===========================================================================

describe('Game Store - Historia Actions', () => {
  it('setHistoriaAtual sets the current historia', () => {
    const historia = { id: 1, titulo: 'A Grande Aventura' };
    useGameStore.getState().setHistoriaAtual(historia);
    expect(useGameStore.getState().historiaAtual).toEqual(historia);
  });

  it('setHistoriaAtual can be set to null', () => {
    useGameStore.getState().setHistoriaAtual({ id: 1 });
    useGameStore.getState().setHistoriaAtual(null);
    expect(useGameStore.getState().historiaAtual).toBeNull();
  });

  it('setLoading toggles loading state', () => {
    useGameStore.getState().setLoading(true);
    expect(useGameStore.getState().loading).toBe(true);
    useGameStore.getState().setLoading(false);
    expect(useGameStore.getState().loading).toBe(false);
  });

  it('setError sets the error message', () => {
    useGameStore.getState().setError('Something failed');
    expect(useGameStore.getState().error).toBe('Something failed');
  });

  it('clearErrors clears both error and errorPersonagens', () => {
    useGameStore.setState({ error: 'err1', errorPersonagens: 'err2' });
    useGameStore.getState().clearErrors();
    expect(useGameStore.getState().error).toBeNull();
    expect(useGameStore.getState().errorPersonagens).toBeNull();
  });
});

// ===========================================================================
// Personagem actions
// ===========================================================================

describe('Game Store - Personagem Actions', () => {
  it('setPersonagensDaHistoria sets the array', () => {
    const personagens = [{ id: 1, nome: 'Warrior' }, { id: 2, nome: 'Mage' }];
    useGameStore.getState().setPersonagensDaHistoria(personagens);
    expect(useGameStore.getState().personagensDaHistoria).toHaveLength(2);
  });

  it('selecionarPersonagem selects a valid personagem', () => {
    const personagens = [{ id: 1, nome: 'Warrior' }, { id: 2, nome: 'Mage' }];
    useGameStore.getState().setPersonagensDaHistoria(personagens);
    useGameStore.getState().selecionarPersonagem({ id: 1, nome: 'Warrior' });
    expect(useGameStore.getState().personagemSelecionado).toEqual({ id: 1, nome: 'Warrior' });
  });

  it('selecionarPersonagem rejects a personagem not in the list', () => {
    const personagens = [{ id: 1, nome: 'Warrior' }];
    useGameStore.getState().setPersonagensDaHistoria(personagens);
    useGameStore.getState().selecionarPersonagem({ id: 999, nome: 'Ghost' });
    expect(useGameStore.getState().personagemSelecionado).toBeNull();
    expect(useGameStore.getState().error).toContain('Personagem');
  });

  it('selecionarPersonagem allows selection when list is empty (no validation)', () => {
    // When personagensDaHistoria is empty, validation is skipped
    useGameStore.getState().selecionarPersonagem({ id: 5, nome: 'Rogue' });
    expect(useGameStore.getState().personagemSelecionado).toEqual({ id: 5, nome: 'Rogue' });
  });

  it('selecionarPersonagem with null clears selection', () => {
    useGameStore.setState({ personagemSelecionado: { id: 1 } });
    useGameStore.getState().selecionarPersonagem(null);
    expect(useGameStore.getState().personagemSelecionado).toBeNull();
  });

  it('setLoadingPersonagens toggles loading', () => {
    useGameStore.getState().setLoadingPersonagens(true);
    expect(useGameStore.getState().loadingPersonagens).toBe(true);
  });

  it('setErrorPersonagens sets personagem error', () => {
    useGameStore.getState().setErrorPersonagens('load failed');
    expect(useGameStore.getState().errorPersonagens).toBe('load failed');
  });

  it('setErrorPersonagens with null clears error', () => {
    useGameStore.setState({ errorPersonagens: 'some error' });
    useGameStore.getState().setErrorPersonagens(null);
    expect(useGameStore.getState().errorPersonagens).toBeNull();
  });

  it('setBuscaPersonagem updates search text', () => {
    useGameStore.getState().setBuscaPersonagem('war');
    expect(useGameStore.getState().buscaPersonagem).toBe('war');
  });
});

// ===========================================================================
// Sessao actions
// ===========================================================================

describe('Game Store - Sessao Actions', () => {
  it('setSessaoId sets the session ID', () => {
    useGameStore.getState().setSessaoId('sess-abc');
    expect(useGameStore.getState().sessaoId).toBe('sess-abc');
  });

  it('setIsDonoSala sets room owner flag', () => {
    useGameStore.getState().setIsDonoSala(true);
    expect(useGameStore.getState().isDonoSala).toBe(true);
  });

  it('abrirSala opens the room and enables starting', () => {
    useGameStore.getState().abrirSala();
    expect(useGameStore.getState().salaAberta).toBe(true);
    expect(useGameStore.getState().podeIniciarJogo).toBe(true);
  });

  it('fecharSala closes the room and disables starting', () => {
    useGameStore.setState({ salaAberta: true, podeIniciarJogo: true });
    useGameStore.getState().fecharSala();
    expect(useGameStore.getState().salaAberta).toBe(false);
    expect(useGameStore.getState().podeIniciarJogo).toBe(false);
  });
});

// ===========================================================================
// Participante management
// ===========================================================================

describe('Game Store - Participantes', () => {
  it('adicionarParticipante adds a new participant', () => {
    useGameStore.getState().adicionarParticipante({ userId: 1, username: 'Alice' });
    expect(useGameStore.getState().participantes).toHaveLength(1);
    expect(useGameStore.getState().participantes[0].username).toBe('Alice');
  });

  it('adicionarParticipante does not duplicate by userId', () => {
    useGameStore.getState().adicionarParticipante({ userId: 1, username: 'Alice' });
    useGameStore.getState().adicionarParticipante({ userId: 1, username: 'Alice Duplicate' });
    expect(useGameStore.getState().participantes).toHaveLength(1);
  });

  it('adicionarParticipante handles id field as fallback', () => {
    useGameStore.getState().adicionarParticipante({ id: 2, username: 'Bob' });
    expect(useGameStore.getState().participantes).toHaveLength(1);
  });

  it('removerParticipante removes by userId', () => {
    useGameStore.setState({
      participantes: [
        { userId: 1, username: 'Alice' },
        { userId: 2, username: 'Bob' },
      ],
    });
    useGameStore.getState().removerParticipante(1);
    expect(useGameStore.getState().participantes).toHaveLength(1);
    expect(useGameStore.getState().participantes[0].userId).toBe(2);
  });

  it('removerParticipante removes by id field', () => {
    useGameStore.setState({
      participantes: [{ id: 3, username: 'Charlie' }],
    });
    useGameStore.getState().removerParticipante(3);
    expect(useGameStore.getState().participantes).toHaveLength(0);
  });

  it('atualizarStatusParticipante updates status of a participant', () => {
    useGameStore.setState({
      participantes: [{ userId: 1, username: 'Alice', status: 'selecionando' }],
    });
    useGameStore.getState().atualizarStatusParticipante(1, 'pronto');
    expect(useGameStore.getState().participantes[0].status).toBe('pronto');
  });

  it('setParticipantes replaces the entire list', () => {
    useGameStore.getState().setParticipantes([
      { userId: 10, username: 'X' },
      { userId: 20, username: 'Y' },
    ]);
    expect(useGameStore.getState().participantes).toHaveLength(2);
  });
});

// ===========================================================================
// Message management
// ===========================================================================

describe('Game Store - Mensagens', () => {
  it('adicionarMensagem adds a new message', () => {
    useGameStore.getState().adicionarMensagem({ id: 'msg-1', message: 'Hello' });
    expect(useGameStore.getState().mensagens).toHaveLength(1);
  });

  it('adicionarMensagem deduplicates by id', () => {
    useGameStore.getState().adicionarMensagem({ id: 'msg-1', message: 'Hello' });
    useGameStore.getState().adicionarMensagem({ id: 'msg-1', message: 'Hello again' });
    expect(useGameStore.getState().mensagens).toHaveLength(1);
  });

  it('atualizarMensagem updates fields of an existing message', () => {
    useGameStore.getState().adicionarMensagem({ id: 'msg-1', message: 'Draft' });
    useGameStore.getState().atualizarMensagem('msg-1', { message: 'Final' });
    expect(useGameStore.getState().mensagens[0].message).toBe('Final');
  });

  it('atualizarMensagem does not affect non-matching messages', () => {
    useGameStore.getState().adicionarMensagem({ id: 'msg-1', message: 'A' });
    useGameStore.getState().adicionarMensagem({ id: 'msg-2', message: 'B' });
    useGameStore.getState().atualizarMensagem('msg-1', { message: 'Updated' });
    expect(useGameStore.getState().mensagens[1].message).toBe('B');
  });

  it('setMensagens replaces all messages', () => {
    useGameStore.getState().adicionarMensagem({ id: 'old', message: 'Old' });
    useGameStore.getState().setMensagens([
      { id: 'new-1', message: 'New1' },
      { id: 'new-2', message: 'New2' },
    ]);
    expect(useGameStore.getState().mensagens).toHaveLength(2);
    expect(useGameStore.getState().mensagens[0].id).toBe('new-1');
  });

  it('setStatusPersonagem updates the character status', () => {
    useGameStore.getState().setStatusPersonagem({ hp: 100, mp: 50 });
    expect(useGameStore.getState().statusPersonagem).toEqual({ hp: 100, mp: 50 });
  });
});

// ===========================================================================
// Persistence & Hydration
// ===========================================================================

describe('Game Store - Persistence', () => {
  it('persistirEstadoCritico saves personagemSelecionado to localStorage', () => {
    useGameStore.setState({ personagemSelecionado: { id: 7, nome: 'Paladin' } });
    useGameStore.getState().persistirEstadoCritico();
    const stored = JSON.parse(localStorage.getItem('personagemSelecionado'));
    expect(stored.id).toBe(7);
    expect(stored.nome).toBe('Paladin');
  });

  it('hidrataDoLocalStorage restores personagemSelecionado', () => {
    localStorage.setItem('personagemSelecionado', JSON.stringify({ id: 3, nome: 'Thief' }));
    useGameStore.getState().hidrataDoLocalStorage();
    expect(useGameStore.getState().personagemSelecionado).toEqual({ id: 3, nome: 'Thief' });
  });

  it('hidrataDoLocalStorage does nothing when localStorage is empty', () => {
    useGameStore.getState().hidrataDoLocalStorage();
    expect(useGameStore.getState().personagemSelecionado).toBeNull();
  });

  it('limparDadosPersistidos removes personagemSelecionado from localStorage', () => {
    localStorage.setItem('personagemSelecionado', 'data');
    useGameStore.getState().limparDadosPersistidos();
    expect(localStorage.getItem('personagemSelecionado')).toBeNull();
  });
});

// ===========================================================================
// Reset
// ===========================================================================

describe('Game Store - Reset', () => {
  it('resetGameState restores all fields to initial values', () => {
    useGameStore.setState({
      historiaAtual: { id: 1 },
      loading: true,
      error: 'err',
      personagensDaHistoria: [{ id: 1 }],
      personagemSelecionado: { id: 1 },
      participantes: [{ userId: 1 }],
      sessaoId: 's1',
      isDonoSala: true,
      salaAberta: true,
      podeIniciarJogo: true,
      mensagens: [{ id: 'm1' }],
      statusPersonagem: { hp: 10 },
    });

    useGameStore.getState().resetGameState();

    const state = useGameStore.getState();
    expect(state.historiaAtual).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.personagensDaHistoria).toEqual([]);
    expect(state.personagemSelecionado).toBeNull();
    expect(state.participantes).toEqual([]);
    expect(state.sessaoId).toBeNull();
    expect(state.isDonoSala).toBe(false);
    expect(state.salaAberta).toBe(false);
    expect(state.podeIniciarJogo).toBe(false);
    expect(state.mensagens).toEqual([]);
    expect(state.statusPersonagem).toEqual({});
  });

  it('sairDaSala calls resetGameState', () => {
    useGameStore.setState({ historiaAtual: { id: 99 }, salaAberta: true });
    useGameStore.getState().sairDaSala();
    expect(useGameStore.getState().historiaAtual).toBeNull();
    expect(useGameStore.getState().salaAberta).toBe(false);
  });
});

// ===========================================================================
// Computed selectors
// ===========================================================================

describe('Game Store - Selectors', () => {
  it('dadosSessao returns session-related fields', () => {
    useGameStore.setState({
      historiaAtual: { id: 1, titulo: 'Quest' },
      personagemSelecionado: { id: 2 },
      sessaoId: 'sess-1',
      participantes: [{ userId: 1 }],
      isDonoSala: true,
    });

    const dados = useGameSelectors.dadosSessao();
    expect(dados.historiaAtual.id).toBe(1);
    expect(dados.personagemSelecionado.id).toBe(2);
    expect(dados.sessaoId).toBe('sess-1');
    expect(dados.participantes).toHaveLength(1);
    expect(dados.isDonoSala).toBe(true);
  });

  it('estadoSala returns sala status', () => {
    useGameStore.setState({ salaAberta: true, podeIniciarJogo: true, participantes: [{ userId: 1 }, { userId: 2 }] });
    const sala = useGameSelectors.estadoSala();
    expect(sala.salaAberta).toBe(true);
    expect(sala.podeIniciarJogo).toBe(true);
    expect(sala.totalParticipantes).toBe(2);
  });

  it('podeAvancarEtapa validates selecao-personagem', () => {
    expect(useGameSelectors.podeAvancarEtapa('selecao-personagem')).toBe(false);
    useGameStore.setState({ historiaAtual: { id: 1 } });
    expect(useGameSelectors.podeAvancarEtapa('selecao-personagem')).toBe(true);
  });

  it('podeAvancarEtapa validates sala-espera', () => {
    expect(useGameSelectors.podeAvancarEtapa('sala-espera')).toBe(false);
    useGameStore.setState({ historiaAtual: { id: 1 }, personagemSelecionado: { id: 2 } });
    expect(useGameSelectors.podeAvancarEtapa('sala-espera')).toBe(true);
  });

  it('podeAvancarEtapa validates jogo-ativo', () => {
    expect(useGameSelectors.podeAvancarEtapa('jogo-ativo')).toBe(false);
    useGameStore.setState({ salaAberta: true, personagemSelecionado: { id: 2 } });
    expect(useGameSelectors.podeAvancarEtapa('jogo-ativo')).toBe(true);
  });

  it('podeAvancarEtapa returns true for unknown stage', () => {
    expect(useGameSelectors.podeAvancarEtapa('unknown')).toBe(true);
  });

  it('estadoProntidao returns readiness object', () => {
    useGameStore.setState({
      historiaAtual: { id: 1 },
      personagemSelecionado: { id: 2 },
      participantes: [{ userId: 1 }],
      salaAberta: true,
    });
    const prontidao = useGameSelectors.estadoProntidao();
    expect(prontidao.temHistoria).toBe(true);
    expect(prontidao.temPersonagem).toBe(true);
    expect(prontidao.temParticipantes).toBe(true);
    expect(prontidao.salaAberta).toBe(true);
    expect(prontidao.prontoParaJogar).toBe(true);
  });

  it('estadoProntidao reports not ready when missing data', () => {
    const prontidao = useGameSelectors.estadoProntidao();
    expect(prontidao.prontoParaJogar).toBe(false);
  });

  it('dadosParaPersistir includes personagemSelecionado', () => {
    useGameStore.setState({ personagemSelecionado: { id: 5 } });
    const dados = useGameSelectors.dadosParaPersistir();
    expect(dados.personagemSelecionado.id).toBe(5);
  });
});
