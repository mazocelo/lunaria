import { describe, expect, it, vi } from 'vitest';

// Mock logger (pino) to avoid filesystem/transport issues in tests
vi.mock('../helpers/logger.js', () => {
  const noop = () => {};
  const child = () => ({ warn: noop, info: noop, error: noop, debug: noop });
  return { default: { child, warn: noop, info: noop, error: noop, debug: noop } };
});

import { buildTurnState, formatTurnStateText } from '../helpers/turnStateBuilder.js';
// filtrarPassivasAplicaveis is an internal (non-exported) function.
// We test it indirectly via buildTurnState's passivasAplicaveis output.
// If it ever gets exported, the direct tests below will auto-activate.
import turnStateBuilderDefault from '../helpers/turnStateBuilder.js';
const filtrarPassivasAplicaveis = turnStateBuilderDefault.filtrarPassivasAplicaveis ?? null;

// ── helpers to build mock objects ────────────────────────────────────

function makeSessao(overrides = {}) {
  return {
    estadoJogo: {
      personagemSessao: {},
      cooldowns: {},
      concentracao: {},
      rodadaAtual: 1,
      cenaAtual: null,
      ambiente: null,
      horaFiccional: null,
      terreno: null,
      tensao: null,
      ameacas: [],
      combate: null,
      desvantagensAtivadas: {},
      ultimoTeste: {},
      ...overrides.estadoJogo,
    },
    mestreContexto: overrides.mestreContexto || {},
    personagensCompletos: overrides.personagensCompletos || {},
    ...overrides,
  };
}

function makePersonagem(overrides = {}) {
  return {
    id: 101,
    nome: 'Eldric',
    classe: 'Mago',
    nivel: 5,
    atributos: { constituicao: 14, inteligencia: 16, ...(overrides.atributos || {}) },
    hp: null,
    mana_atual: null,
    vantagens: [],
    desvantagens: [],
    equipamentos: [],
    habilidadesClasse: [],
    magias: [],
    status_efeitos: [],
    ...overrides,
  };
}

// ── filtrarPassivasAplicaveis ────────────────────────────────────────

describe('filtrarPassivasAplicaveis', () => {
  // Guard: if filtrarPassivasAplicaveis is not directly accessible we skip
  const describeIfAvailable = typeof filtrarPassivasAplicaveis === 'function' ? describe : describe.skip;

  describeIfAvailable('keyword map matching', () => {
    it('matches "Visão Noturna" when scene contains darkness keyword', () => {
      const vantagens = [
        { nome: 'Visão Noturna', usar: 0, efeito: { descricao: 'Enxerga no escuro', bonus: '+2 percepção' } },
      ];
      const ctx = { cenaAtual: 'Uma caverna escura', ambiente: null, terreno: null, combateAtivo: false, horaFiccional: null, efeitos: [] };
      const result = filtrarPassivasAplicaveis(vantagens, ctx);
      expect(result).toHaveLength(1);
      expect(result[0].nome).toBe('Visão Noturna');
      expect(result[0].bonus).toBe('+2 percepção');
      expect(result[0].motivo).toBe('caverna');
    });

    it('matches "Respiração Aquática" when scene mentions water', () => {
      const vantagens = [
        { nome: 'Respiração Aquática', usar: null, efeito: { descricao: 'Respira embaixo d\'água' } },
      ];
      const ctx = { cenaAtual: 'O grupo mergulha no lago submerso', ambiente: null, terreno: null, combateAtivo: false, horaFiccional: null, efeitos: [] };
      const result = filtrarPassivasAplicaveis(vantagens, ctx);
      expect(result).toHaveLength(1);
      expect(result[0].nome).toBe('Respiração Aquática');
      expect(result[0].motivo).toBe('submer');
    });

    it('matches "Resistência ao Frio" in a snowy environment', () => {
      const vantagens = [
        { nome: 'Resistência ao Frio', usar: 0, efeito: { bonus: '+3 defesa ao frio' } },
      ];
      const ctx = { cenaAtual: null, ambiente: 'Montanha coberta de neve', terreno: null, combateAtivo: false, horaFiccional: null, efeitos: [] };
      const result = filtrarPassivasAplicaveis(vantagens, ctx);
      expect(result).toHaveLength(1);
      expect(result[0].motivo).toBe('neve');
    });

    it('matches "Diplomático" in urban contexts', () => {
      const vantagens = [
        { nome: 'Diplomático', usar: 0, efeito: { descricao: 'Persuasão em contextos sociais', bonus: '+2' } },
      ];
      const ctx = { cenaAtual: 'Na corte do rei', ambiente: null, terreno: null, combateAtivo: false, horaFiccional: null, efeitos: [] };
      const result = filtrarPassivasAplicaveis(vantagens, ctx);
      expect(result).toHaveLength(1);
      expect(result[0].motivo).toBe('corte');
    });

    it('matches via terreno tags', () => {
      const vantagens = [
        { nome: 'Rastreador', usar: 0, efeito: { descricao: 'Segue rastros', bonus: '+2' } },
      ];
      const ctx = {
        cenaAtual: null, ambiente: null,
        terreno: { tipo: 'bosque', label: 'Bosque', tags: ['floresta', 'densa'] },
        combateAtivo: false, horaFiccional: null, efeitos: [],
      };
      const result = filtrarPassivasAplicaveis(vantagens, ctx);
      expect(result).toHaveLength(1);
      expect(result[0].motivo).toBe('floresta');
    });
  });

  describeIfAvailable('description fallback matching', () => {
    it('matches passive by effect description words when no keyword map entry exists', () => {
      const vantagens = [
        { nome: 'Poder Estranho', usar: 0, efeito: { descricao: 'Bonus especial em florestas densas e trilhas perigosas', bonus: '+1' } },
      ];
      const ctx = { cenaAtual: 'Caminhando pela floresta', ambiente: null, terreno: null, combateAtivo: false, horaFiccional: null, efeitos: [] };
      const result = filtrarPassivasAplicaveis(vantagens, ctx);
      expect(result).toHaveLength(1);
      expect(result[0].nome).toBe('Poder Estranho');
    });

    it('does not match if description words are too short (<= 4 chars)', () => {
      const vantagens = [
        { nome: 'Custom', usar: 0, efeito: { descricao: 'a b cd ef ghi', bonus: '+1' } },
      ];
      const ctx = { cenaAtual: 'qualquer cena com a b cd', ambiente: null, terreno: null, combateAtivo: false, horaFiccional: null, efeitos: [] };
      const result = filtrarPassivasAplicaveis(vantagens, ctx);
      expect(result).toHaveLength(0);
    });
  });

  describeIfAvailable('combat-specific fallback', () => {
    it('matches passive mentioning "combate" when combat is active', () => {
      const vantagens = [
        { nome: 'Instinto de Combate', usar: 0, efeito: { descricao: 'instinto puro de combate', bonus: '+1 ataque' } },
      ];
      const ctx = { cenaAtual: 'Arena', ambiente: null, terreno: null, combateAtivo: true, horaFiccional: null, efeitos: [] };
      const result = filtrarPassivasAplicaveis(vantagens, ctx);
      expect(result).toHaveLength(1);
      expect(result[0].motivo).toBe('combate');
    });

    it('does not match combat passive when combat is NOT active', () => {
      const vantagens = [
        { nome: 'Instinto de Combate', usar: 0, efeito: { descricao: 'instinto puro de combate', bonus: '+1 ataque' } },
      ];
      const ctx = { cenaAtual: 'Taverna', ambiente: null, terreno: null, combateAtivo: false, horaFiccional: null, efeitos: [] };
      const result = filtrarPassivasAplicaveis(vantagens, ctx);
      expect(result).toHaveLength(0);
    });
  });

  describeIfAvailable('edge cases', () => {
    it('ignores vantagens with usar >= 1 (active, not passive)', () => {
      const vantagens = [
        { nome: 'Visão Noturna', usar: 2, efeito: { descricao: 'Enxerga no escuro' } },
      ];
      const ctx = { cenaAtual: 'Caverna escura', ambiente: null, terreno: null, combateAtivo: false, horaFiccional: null, efeitos: [] };
      const result = filtrarPassivasAplicaveis(vantagens, ctx);
      expect(result).toHaveLength(0);
    });

    it('returns empty array for empty vantagens', () => {
      const result = filtrarPassivasAplicaveis([], { cenaAtual: 'Qualquer', combateAtivo: false });
      expect(result).toEqual([]);
    });

    it('handles vantagens with missing efeito gracefully', () => {
      const vantagens = [
        { nome: 'Visão Noturna', usar: 0 },
      ];
      const ctx = { cenaAtual: 'Caverna subterrânea escura', ambiente: null, terreno: null, combateAtivo: false, horaFiccional: null, efeitos: [] };
      const result = filtrarPassivasAplicaveis(vantagens, ctx);
      expect(result).toHaveLength(1);
      expect(result[0].descricao).toBeNull();
      expect(result[0].bonus).toBeNull();
    });

    it('uses fallback bonus field when efeito.bonus is missing', () => {
      const vantagens = [
        { nome: 'Visão Noturna', usar: 0, bonus: '+3', descricao: 'Descrição fallback' },
      ];
      const ctx = { cenaAtual: 'Caverna escura', ambiente: null, terreno: null, combateAtivo: false, horaFiccional: null, efeitos: [] };
      const result = filtrarPassivasAplicaveis(vantagens, ctx);
      expect(result).toHaveLength(1);
      expect(result[0].bonus).toBe('+3');
      expect(result[0].descricao).toBe('Descrição fallback');
    });

    it('matches via efeitos array text', () => {
      const vantagens = [
        { nome: 'Resistência ao Calor', usar: 0, efeito: { bonus: '+2' } },
      ];
      const ctx = {
        cenaAtual: null, ambiente: null, terreno: null, combateAtivo: false, horaFiccional: null,
        efeitos: [{ nome: 'Calor intenso', descricao: 'Lava escorrendo pelas paredes' }],
      };
      const result = filtrarPassivasAplicaveis(vantagens, ctx);
      expect(result).toHaveLength(1);
      expect(result[0].motivo).toBe('lava');
    });

    it('matches via horaFiccional field', () => {
      const vantagens = [
        { nome: 'Visão Noturna', usar: 0, efeito: { bonus: '+2' } },
      ];
      const ctx = { cenaAtual: null, ambiente: null, terreno: null, combateAtivo: false, horaFiccional: 'Noite profunda', efeitos: [] };
      const result = filtrarPassivasAplicaveis(vantagens, ctx);
      expect(result).toHaveLength(1);
      expect(result[0].motivo).toBe('noite');
    });

    it('handles terreno as plain string', () => {
      const vantagens = [
        { nome: 'Sentido Sísmico', usar: 0, efeito: { bonus: '+1' } },
      ];
      const ctx = { cenaAtual: null, ambiente: null, terreno: 'caverna subterrânea', combateAtivo: false, horaFiccional: null, efeitos: [] };
      const result = filtrarPassivasAplicaveis(vantagens, ctx);
      expect(result).toHaveLength(1);
      expect(result[0].motivo).toBe('caverna');
    });
  });
});

// ── buildTurnState ───────────────────────────────────────────────────

describe('buildTurnState', () => {
  it('builds state with full session data', () => {
    const personagem = makePersonagem({
      vantagens: [
        { nome: 'Visão Noturna', usar: 0, efeito: { descricao: 'Enxerga no escuro', bonus: '+2' } },
        { nome: 'Escudo Mágico', usar: 2, escola_magia: 'abjuração', id: 'em1', nome: 'Escudo Mágico' },
      ],
      desvantagens: [
        { nome: 'Medo de Fogo', efeito: { descricao: 'Penalidade perto de fogo' }, bonus: '-2' },
      ],
      equipamentos: [
        { nome: 'Cajado Arcano', tipo: 'arma' },
        { nome: 'Manto do Mago', tipo: 'armadura' },
      ],
      habilidadesClasse: [
        { id: 'hab1', nome: 'Toque Gélido', custo_mana: 3 },
      ],
      magias: [
        { id: 'mag1', nome: 'Bola de Fogo', custo_mana: 5, escola_magia: 'evocação', usa_concentracao: true },
      ],
    });

    const sessao = makeSessao({
      estadoJogo: {
        personagemSessao: {
          'user1': {
            hp_max: 30,
            hp_atual: 22,
            mana_max: 20,
            mana_atual: 15,
            xp_ganho: 150,
            itens_ganhos: [{ nome: 'Poção de Cura' }],
            itens_perdidos: [{ nome: 'Tocha' }],
            status_efeitos: [{ nome: 'Veneno', duracao: 3 }],
          },
        },
        cooldowns: {
          'user1': { 'hab_hab1': 2, 'mag_mag1': 0 },
        },
        concentracao: {
          'user1': { nome: 'Bola de Fogo', turnos_restantes: 3 },
        },
        rodadaAtual: 4,
        cenaAtual: 'Caverna dos Cristais',
        ambiente: 'Subterrâneo escuro',
        horaFiccional: 'Meia-noite',
        terreno: { tipo: 'caverna', label: 'Caverna Profunda', tags: ['subterrâneo', 'úmido'] },
        tensao: 'alta',
        ameacas: ['Dragão adormecido', 'Armadilhas'],
        combate: null,
        desvantagensAtivadas: { 'user1': 1 },
        ultimoTeste: { 'user1': { teste: 'Percepção', dc: 15, sucesso: true, total: 18 } },
      },
      personagensCompletos: {
        '101': personagem,
      },
    });

    const state = buildTurnState(sessao, 'user1', personagem);

    expect(state.nome).toBe('Eldric');
    expect(state.classe).toBe('Mago');
    expect(state.nivel).toBe(5);
    expect(state.hp).toEqual({ atual: 22, max: 30 });
    expect(state.mana).toEqual({ atual: 15, max: 20 });
    expect(state.inconsciente).toBe(false);
    expect(state.xpGanho).toBe(150);
    expect(state.itensGanhos).toEqual([{ nome: 'Poção de Cura' }]);
    expect(state.itensPerdidos).toEqual([{ nome: 'Tocha' }]);
    expect(state.efeitos).toEqual([{ nome: 'Veneno', duracao: 3 }]);
    expect(state.rodadaAtual).toBe(4);
    expect(state.cenaAtual).toBe('Caverna dos Cristais');
    expect(state.ambiente).toBe('Subterrâneo escuro');
    expect(state.horaFiccional).toBe('Meia-noite');
    expect(state.tensao).toBe('alta');
    expect(state.ameacas).toEqual(['Dragão adormecido', 'Armadilhas']);
    expect(state.desvantagensAtivadas).toBe(1);
    expect(state.desvantagensLimiteCena).toBe(2);
    expect(state.ultimoTeste).toEqual({ teste: 'Percepção', dc: 15, sucesso: true, total: 18 });

    // Cooldowns
    expect(state.cooldowns).toEqual([{ id: 'hab_hab1', turnos: 2 }]);

    // Concentração
    expect(state.concentracao).toEqual({ nome: 'Bola de Fogo', turnos_restantes: 3 });

    // Inventário
    expect(state.inventario).toEqual([
      { nome: 'Cajado Arcano', tipo: 'arma' },
      { nome: 'Manto do Mago', tipo: 'armadura' },
    ]);

    // Desvantagens alerta
    expect(state.desvantagensAlerta).toContain('Medo de Fogo');

    // Vantagens passivas
    expect(state.vantagensPassivas).toContain('Visão Noturna');

    // Terreno
    expect(state.terreno).toEqual({ tipo: 'caverna', label: 'Caverna Profunda', tags: ['subterrâneo', 'úmido'] });
    expect(state.terreno_tags).toEqual(['subterrâneo', 'úmido']);

    // Passivas aplicáveis (Visão Noturna should match caverna/escuro context)
    expect(state.passivasAplicaveis.length).toBeGreaterThanOrEqual(1);
    expect(state.passivasAplicaveis.some(p => p.nome === 'Visão Noturna')).toBe(true);

    // Habilidades
    expect(state.habilidadesDisponiveis).toEqual([
      { nome: 'Toque Gélido', cd: 2, custo_mana: 3 },
    ]);

    // Magias
    expect(state.magiasDisponiveis.some(m => m.nome === 'Bola de Fogo')).toBe(true);
    const bolaFogo = state.magiasDisponiveis.find(m => m.nome === 'Bola de Fogo');
    expect(bolaFogo.concentracao).toBe(true);
    expect(bolaFogo.custo_mana).toBe(5);
  });

  it('builds state with minimal/empty session', () => {
    const sessao = makeSessao();
    const state = buildTurnState(sessao, 'user1', {});

    expect(state.nome).toBe('Aventureiro');
    expect(state.classe).toBe('Aventureiro');
    expect(state.nivel).toBe(1);
    expect(state.hp.atual).toBeGreaterThan(0);
    expect(state.hp.max).toBeGreaterThan(0);
    expect(state.hp.atual).toBe(state.hp.max);
    expect(state.mana.atual).toBe(state.mana.max);
    expect(state.inconsciente).toBe(false);
    expect(state.xpGanho).toBe(0);
    expect(state.itensGanhos).toEqual([]);
    expect(state.itensPerdidos).toEqual([]);
    expect(state.efeitos).toEqual([]);
    expect(state.cooldowns).toEqual([]);
    expect(state.concentracao).toBeNull();
    expect(state.cenaAtual).toBeNull();
    expect(state.ambiente).toBeNull();
    expect(state.horaFiccional).toBeNull();
    expect(state.rodadaAtual).toBe(1);
    expect(state.ultimoTeste).toBeNull();
    expect(state.inventario).toEqual([]);
    expect(state.desvantagensAlerta).toEqual([]);
    expect(state.vantagensPassivas).toEqual([]);
    expect(state.terreno).toBeNull();
    expect(state.terreno_tags).toEqual([]);
    expect(state.efeitos_terreno).toEqual([]);
    expect(state.tensao).toBeNull();
    expect(state.ameacas).toEqual([]);
    expect(state.passivasAplicaveis).toEqual([]);
    expect(state.desvantagensAtivadas).toBe(0);
    expect(state.desvantagensLimiteCena).toBe(2);
    expect(state.boss).toBeNull();
    expect(state.batalha_grande).toBeNull();
    expect(state.missao_tatica).toBeNull();
  });

  it('handles null personagem parameter', () => {
    const sessao = makeSessao();
    const state = buildTurnState(sessao, 'user1', null);

    expect(state.nome).toBe('Aventureiro');
    expect(state.classe).toBe('Aventureiro');
    expect(state.nivel).toBe(1);
    expect(state.hp.atual).toBe(state.hp.max);
  });

  it('handles undefined personagem parameter (uses default)', () => {
    const sessao = makeSessao();
    const state = buildTurnState(sessao, 'user1');

    expect(state.nome).toBe('Aventureiro');
    expect(state.hp.max).toBeGreaterThan(0);
  });

  it('calculates HP based on constituição and nivel when not in session bucket', () => {
    const personagem = makePersonagem({ atributos: { constituicao: 14 }, nivel: 3 });
    const sessao = makeSessao();
    const state = buildTurnState(sessao, 'user1', personagem);

    // calcularHP({ constituicao: 14, nivel: 3 }, multRaca=5)
    // modCON = floor((14-10)/2) = 2
    // HP = 5 * (3 + max(1, 2)) = 5 * 5 = 25
    expect(state.hp.max).toBe(25);
    expect(state.hp.atual).toBe(25); // no override, defaults to max
  });

  it('calculates mana based on inteligência and nivel when not in session bucket', () => {
    const personagem = makePersonagem({ atributos: { inteligencia: 16 }, nivel: 5 });
    const sessao = makeSessao();
    const state = buildTurnState(sessao, 'user1', personagem);

    // calcularMana({ inteligencia: 16, nivel: 5 })
    // modInt = floor((16-10)/2) = 3
    // Mana = max(5, 10 + 5 + 3*2) = max(5, 21) = 21
    expect(state.mana.max).toBe(21);
    expect(state.mana.atual).toBe(21);
  });

  it('detects inconsciente when HP is zero', () => {
    const personagem = makePersonagem();
    const sessao = makeSessao({
      estadoJogo: {
        personagemSessao: {
          'user1': { hp_atual: 0, hp_max: 30 },
        },
      },
    });
    const state = buildTurnState(sessao, 'user1', personagem);
    expect(state.inconsciente).toBe(true);
  });

  it('detects inconsciente from combat jogador status', () => {
    const personagem = makePersonagem();
    const sessao = makeSessao({
      estadoJogo: {
        personagemSessao: { 'user1': { hp_atual: 5, hp_max: 30 } },
        combate: {
          ativo: true,
          jogadores: {
            'user1': { status: 'inconsciente' },
          },
        },
      },
    });
    const state = buildTurnState(sessao, 'user1', personagem);
    expect(state.inconsciente).toBe(true);
  });

  it('detects inconsciente from combat "derrotado" status', () => {
    const personagem = makePersonagem();
    const sessao = makeSessao({
      estadoJogo: {
        personagemSessao: { 'user1': { hp_atual: 5, hp_max: 30 } },
        combate: {
          ativo: true,
          jogadores: {
            'user1': { status: 'derrotado' },
          },
        },
      },
    });
    const state = buildTurnState(sessao, 'user1', personagem);
    expect(state.inconsciente).toBe(true);
  });

  it('is NOT inconsciente when combat jogador status is normal', () => {
    const personagem = makePersonagem();
    const sessao = makeSessao({
      estadoJogo: {
        personagemSessao: { 'user1': { hp_atual: 5, hp_max: 30 } },
        combate: {
          ativo: true,
          jogadores: {
            'user1': { status: 'ativo' },
          },
        },
      },
    });
    const state = buildTurnState(sessao, 'user1', personagem);
    expect(state.inconsciente).toBe(false);
  });

  it('uses personagensCompletos when personagemId is available', () => {
    const pcFromSession = makePersonagem({ nome: 'Eldric Completo', nivel: 10 });
    const personagemRef = { id: 101, nome: 'Eldric Ref' };
    const sessao = makeSessao({
      personagensCompletos: { '101': pcFromSession },
    });
    const state = buildTurnState(sessao, 'user1', personagemRef);
    expect(state.nome).toBe('Eldric Completo');
    expect(state.nivel).toBe(10);
  });

  it('falls back to personagemRef when not found in personagensCompletos', () => {
    const personagemRef = { id: 999, nome: 'Fallback Hero', classe: 'Guerreiro', nivel: 3 };
    const sessao = makeSessao();
    const state = buildTurnState(sessao, 'user1', personagemRef);
    expect(state.nome).toBe('Fallback Hero');
    expect(state.classe).toBe('Guerreiro');
  });

  it('limits inventario to 10 items', () => {
    const equipamentos = Array.from({ length: 15 }, (_, i) => ({ nome: `Item ${i + 1}`, tipo: 'misc' }));
    const personagem = makePersonagem({ equipamentos });
    const sessao = makeSessao();
    const state = buildTurnState(sessao, 'user1', personagem);
    expect(state.inventario).toHaveLength(10);
    expect(state.inventario[0].nome).toBe('Item 1');
    expect(state.inventario[9].nome).toBe('Item 10');
  });

  it('deduplicates magias by name', () => {
    const personagem = makePersonagem({
      magias: [
        { id: 'mag1', nome: 'Bola de Fogo', custo_mana: 5, escola_magia: 'evocação' },
      ],
      magiasConhecidas: [
        { id: 'mag2', nome: 'Bola de Fogo', custo_mana: 5, escola_magia: 'evocação' },
      ],
    });
    const sessao = makeSessao();
    const state = buildTurnState(sessao, 'user1', personagem);
    const bolaCount = state.magiasDisponiveis.filter(m => m.nome === 'Bola de Fogo').length;
    expect(bolaCount).toBe(1);
  });

  it('populates cenaAtual from mestreContexto when estadoJogo is empty', () => {
    const sessao = makeSessao({
      mestreContexto: { sessao: { cenaAtual: 'Floresta Encantada', ambiente: 'Noturno misterioso' } },
    });
    const state = buildTurnState(sessao, 'user1', {});
    expect(state.cenaAtual).toBe('Floresta Encantada');
    expect(state.ambiente).toBe('Noturno misterioso');
  });

  it('includes boss resumo when boss is active', () => {
    const sessao = makeSessao({
      estadoJogo: {
        combate: {
          ativo: true,
          jogadores: {},
          boss: { nome: 'Dragão Vermelho', fase_atual: 2 },
        },
      },
    });
    const state = buildTurnState(sessao, 'user1', {});
    expect(state.boss).toEqual({ nome: 'Dragão Vermelho', fase_atual: 2 });
  });

  it('includes batalha_grande resumo when active', () => {
    const sessao = makeSessao({
      estadoJogo: {
        batalha_grande: {
          ativa: true,
          nome: 'Cerco ao Castelo',
          objetivo: 'Defender os portões',
          frentes: [
            { nome: 'Portão Norte', status: 'ativa', progresso: 40 },
            { nome: 'Muralha Leste', status: 'ativa', progresso: 60 },
          ],
        },
      },
    });
    const state = buildTurnState(sessao, 'user1', {});
    expect(state.batalha_grande).not.toBeNull();
    expect(state.batalha_grande.nome).toBe('Cerco ao Castelo');
    expect(state.batalha_grande.frentes).toHaveLength(2);
  });

  it('includes missao_tatica resumo when in progress', () => {
    const sessao = makeSessao({
      estadoJogo: {
        missao_tatica: {
          descricao: 'Resgatar o prisioneiro',
          objetivo: 'Infiltrar a masmorra',
          status: 'em_andamento',
          progresso: 30,
        },
      },
    });
    const state = buildTurnState(sessao, 'user1', {});
    expect(state.missao_tatica).not.toBeNull();
    expect(state.missao_tatica.status).toBe('em_andamento');
    expect(state.missao_tatica.progresso).toBe(30);
  });

  it('returns null missao_tatica when status is "concluida"', () => {
    const sessao = makeSessao({
      estadoJogo: {
        missao_tatica: {
          descricao: 'Missão finalizada',
          status: 'concluida',
          progresso: 100,
        },
      },
    });
    const state = buildTurnState(sessao, 'user1', {});
    expect(state.missao_tatica).toBeNull();
  });

  it('migrates legacy terreno string via migrarEstadoTaticoLegado', () => {
    const sessao = makeSessao({
      estadoJogo: {
        terreno: 'floresta densa',
      },
    });
    const state = buildTurnState(sessao, 'user1', {});
    // After migration, terreno should be canonical object
    expect(state.terreno).toEqual({ tipo: 'floresta densa', label: 'floresta densa', tags: [] });
  });

  it('combate ativo triggers passivasAplicaveis combat matching', () => {
    const personagem = makePersonagem({
      vantagens: [
        { nome: 'Reflexos', usar: 0, efeito: { descricao: 'Reflexos rápidos em combate', bonus: '+2' } },
      ],
    });
    const sessao = makeSessao({
      estadoJogo: {
        combate: { ativo: true, jogadores: {} },
      },
    });
    const state = buildTurnState(sessao, 'user1', personagem);
    expect(state.passivasAplicaveis.some(p => p.nome === 'Reflexos')).toBe(true);
  });

  it('reads personagem_id as fallback for personagemId', () => {
    const pcFromSession = makePersonagem({ nome: 'Via personagem_id' });
    const personagemRef = { personagem_id: 101, nome: 'Ref' };
    const sessao = makeSessao({
      personagensCompletos: { '101': pcFromSession },
    });
    const state = buildTurnState(sessao, 'user1', personagemRef);
    expect(state.nome).toBe('Via personagem_id');
  });

  it('reads personagemId as fallback', () => {
    const pcFromSession = makePersonagem({ nome: 'Via personagemId' });
    const personagemRef = { personagemId: 101, nome: 'Ref' };
    const sessao = makeSessao({
      personagensCompletos: { '101': pcFromSession },
    });
    const state = buildTurnState(sessao, 'user1', personagemRef);
    expect(state.nome).toBe('Via personagemId');
  });

  it('handles sessao without estadoJogo gracefully', () => {
    // migrarEstadoTaticoLegado guards against missing estadoJogo
    const sessao = { mestreContexto: {}, personagensCompletos: {} };
    const state = buildTurnState(sessao, 'user1', makePersonagem());
    expect(state.nome).toBe('Eldric');
    expect(state.cooldowns).toEqual([]);
    expect(state.concentracao).toBeNull();
  });
});

// ── filtrarPassivasAplicaveis (indirect via buildTurnState) ──────────

describe('filtrarPassivasAplicaveis (via buildTurnState)', () => {
  it('activates Visão Noturna in dark scene', () => {
    const personagem = makePersonagem({
      vantagens: [
        { nome: 'Visão Noturna', usar: 0, efeito: { descricao: 'Enxerga no escuro', bonus: '+2 percepção' } },
      ],
    });
    const sessao = makeSessao({
      estadoJogo: { cenaAtual: 'Uma caverna escura e profunda' },
    });
    const state = buildTurnState(sessao, 'user1', personagem);
    expect(state.passivasAplicaveis).toHaveLength(1);
    expect(state.passivasAplicaveis[0].nome).toBe('Visão Noturna');
    expect(state.passivasAplicaveis[0].bonus).toBe('+2 percepção');
  });

  it('activates Respiração Aquática in underwater scene', () => {
    const personagem = makePersonagem({
      vantagens: [
        { nome: 'Respiração Aquática', usar: null, efeito: { descricao: 'Respira embaixo d\'água' } },
      ],
    });
    const sessao = makeSessao({
      estadoJogo: { cenaAtual: 'O grupo mergulha no lago submerso' },
    });
    const state = buildTurnState(sessao, 'user1', personagem);
    expect(state.passivasAplicaveis).toHaveLength(1);
    expect(state.passivasAplicaveis[0].nome).toBe('Respiração Aquática');
  });

  it('does NOT activate passive in irrelevant scene', () => {
    const personagem = makePersonagem({
      vantagens: [
        { nome: 'Resistência ao Frio', usar: 0, efeito: { bonus: '+3' } },
      ],
    });
    const sessao = makeSessao({
      estadoJogo: { cenaAtual: 'Uma planície ensolarada e quente' },
    });
    const state = buildTurnState(sessao, 'user1', personagem);
    expect(state.passivasAplicaveis).toHaveLength(0);
  });

  it('ignores active vantagens (usar >= 1) for passive filtering', () => {
    const personagem = makePersonagem({
      vantagens: [
        { nome: 'Visão Noturna', usar: 2, efeito: { descricao: 'Enxerga no escuro' } },
      ],
    });
    const sessao = makeSessao({
      estadoJogo: { cenaAtual: 'Caverna escura' },
    });
    const state = buildTurnState(sessao, 'user1', personagem);
    expect(state.passivasAplicaveis).toHaveLength(0);
  });

  it('matches passives via terreno tags', () => {
    const personagem = makePersonagem({
      vantagens: [
        { nome: 'Rastreador', usar: 0, efeito: { descricao: 'Segue rastros', bonus: '+2' } },
      ],
    });
    const sessao = makeSessao({
      estadoJogo: { terreno: { tipo: 'bosque', label: 'Bosque Denso', tags: ['floresta', 'úmido'] } },
    });
    const state = buildTurnState(sessao, 'user1', personagem);
    expect(state.passivasAplicaveis).toHaveLength(1);
    expect(state.passivasAplicaveis[0].motivo).toBe('floresta');
  });

  it('matches via combat-specific fallback when combate is ativo', () => {
    const personagem = makePersonagem({
      vantagens: [
        { nome: 'Instinto de Luta', usar: 0, efeito: { descricao: 'melhora em luta corpo a corpo' } },
      ],
    });
    const sessao = makeSessao({
      estadoJogo: { combate: { ativo: true, jogadores: {} } },
    });
    const state = buildTurnState(sessao, 'user1', personagem);
    expect(state.passivasAplicaveis).toHaveLength(1);
    expect(state.passivasAplicaveis[0].motivo).toBe('luta');
  });

  it('activates multiple passives simultaneously', () => {
    const personagem = makePersonagem({
      vantagens: [
        { nome: 'Visão Noturna', usar: 0, efeito: { descricao: 'Enxerga no escuro', bonus: '+2' } },
        { nome: 'Furtividade', usar: 0, efeito: { descricao: 'Move-se sem ser visto', bonus: '+1' } },
      ],
    });
    const sessao = makeSessao({
      estadoJogo: { cenaAtual: 'Noite escura na floresta sombria' },
    });
    const state = buildTurnState(sessao, 'user1', personagem);
    expect(state.passivasAplicaveis.length).toBe(2);
    const nomes = state.passivasAplicaveis.map(p => p.nome);
    expect(nomes).toContain('Visão Noturna');
    expect(nomes).toContain('Furtividade');
  });

  it('matches via horaFiccional', () => {
    const personagem = makePersonagem({
      vantagens: [
        { nome: 'Visão no Escuro', usar: 0, efeito: { bonus: '+2' } },
      ],
    });
    const sessao = makeSessao({
      estadoJogo: { horaFiccional: 'Noite profunda' },
    });
    const state = buildTurnState(sessao, 'user1', personagem);
    expect(state.passivasAplicaveis).toHaveLength(1);
  });
});

// ── formatTurnStateText ──────────────────────────────────────────────

describe('formatTurnStateText', () => {
  function makeState(overrides = {}) {
    return {
      nome: 'Eldric',
      classe: 'Mago',
      nivel: 5,
      hp: { atual: 22, max: 30 },
      mana: { atual: 15, max: 20 },
      inconsciente: false,
      xpGanho: 0,
      itensGanhos: [],
      itensPerdidos: [],
      efeitos: [],
      cooldowns: [],
      concentracao: null,
      habilidadesDisponiveis: [],
      magiasDisponiveis: [],
      passivasAplicaveis: [],
      vantagensPassivas: [],
      desvantagensAlerta: [],
      desvantagensAtivadas: 0,
      desvantagensLimiteCena: 2,
      inventario: [],
      cenaAtual: null,
      ambiente: null,
      horaFiccional: null,
      rodadaAtual: 1,
      ultimoTeste: null,
      terreno: null,
      terreno_tags: [],
      efeitos_terreno: [],
      tensao: null,
      ameacas: [],
      boss: null,
      batalha_grande: null,
      missao_tatica: null,
      ...overrides,
    };
  }

  it('includes header with nome, classe, and nivel', () => {
    const text = formatTurnStateText(makeState());
    expect(text).toContain('[Estado de Eldric — Mago Nv5]');
  });

  it('includes HP and mana line', () => {
    const text = formatTurnStateText(makeState());
    expect(text).toContain('HP: 22/30 | Mana: 15/20');
  });

  it('includes INCONSCIENTE warning when inconsciente is true', () => {
    const text = formatTurnStateText(makeState({ inconsciente: true }));
    expect(text).toContain('INCONSCIENTE');
    expect(text).toContain('não pode agir');
  });

  it('does NOT include INCONSCIENTE when inconsciente is false', () => {
    const text = formatTurnStateText(makeState({ inconsciente: false }));
    expect(text).not.toContain('INCONSCIENTE');
  });

  it('includes rodada line when rodadaAtual > 1', () => {
    const text = formatTurnStateText(makeState({ rodadaAtual: 5 }));
    expect(text).toContain('Rodada: 5');
  });

  it('does NOT include rodada line when rodadaAtual is 1', () => {
    const text = formatTurnStateText(makeState({ rodadaAtual: 1 }));
    expect(text).not.toContain('Rodada:');
  });

  it('includes XP when xpGanho > 0', () => {
    const text = formatTurnStateText(makeState({ xpGanho: 250 }));
    expect(text).toContain('XP acumulado: 250');
  });

  it('does NOT include XP when xpGanho is 0', () => {
    const text = formatTurnStateText(makeState({ xpGanho: 0 }));
    expect(text).not.toContain('XP acumulado');
  });

  it('includes efeitos with duration', () => {
    const text = formatTurnStateText(makeState({
      efeitos: [
        { nome: 'Veneno', duracao: 3 },
        { nome: 'Bênção', duracao: 5 },
      ],
    }));
    expect(text).toContain('Efeitos: Veneno(3t), Bênção(5t)');
  });

  it('includes cooldowns with remaining turns', () => {
    const text = formatTurnStateText(makeState({
      cooldowns: [
        { id: 'hab_toque_gelido', turnos: 2 },
        { id: 'mag_bola_fogo', turnos: 1 },
      ],
    }));
    expect(text).toContain('Cooldowns: hab_toque_gelido(2t), mag_bola_fogo(1t)');
  });

  it('includes concentração with remaining turns', () => {
    const text = formatTurnStateText(makeState({
      concentracao: { nome: 'Levitação', turnos_restantes: 4 },
    }));
    expect(text).toContain('Concentração: Levitação (4t restantes)');
  });

  it('includes habilidades with cooldown and mana cost', () => {
    const text = formatTurnStateText(makeState({
      habilidadesDisponiveis: [
        { nome: 'Toque Gélido', cd: 2, custo_mana: 3 },
        { nome: 'Golpe Rápido', cd: 0, custo_mana: 0 },
      ],
    }));
    expect(text).toContain('Habilidades:');
    expect(text).toContain('Toque Gélido (cd:2t, 3MP)');
    expect(text).toContain('Golpe Rápido');
    // Golpe Rápido should have no parenthetical since cd=0 and custo=0
    expect(text).not.toContain('Golpe Rápido (');
  });

  it('includes magias with mana cost, cd, and concentracao', () => {
    const text = formatTurnStateText(makeState({
      magiasDisponiveis: [
        { nome: 'Bola de Fogo', custo_mana: 5, cd: 1, concentracao: true },
        { nome: 'Mísseis Mágicos', custo_mana: 2, cd: 0, concentracao: false },
      ],
    }));
    expect(text).toContain('Magias:');
    expect(text).toContain('Bola de Fogo (5MP, cd:1t, conc)');
    expect(text).toContain('Mísseis Mágicos (2MP)');
  });

  it('includes passivas aplicáveis with bonus and motivo', () => {
    const text = formatTurnStateText(makeState({
      passivasAplicaveis: [
        { nome: 'Visão Noturna', bonus: '+2 percepção', motivo: 'escuro' },
      ],
    }));
    expect(text).toContain('Vantagens ATIVAS nesta cena');
    expect(text).toContain('Visão Noturna [+2 percepção]');
    expect(text).toContain('Cena contém: escuro');
  });

  it('lists vantagensPassivas NOT active in context separately', () => {
    const text = formatTurnStateText(makeState({
      vantagensPassivas: ['Visão Noturna', 'Rastreador'],
      passivasAplicaveis: [{ nome: 'Visão Noturna', bonus: '+2', motivo: 'escuro' }],
    }));
    expect(text).toContain('Vantagens passivas (fora do contexto): Rastreador');
    expect(text).not.toContain('fora do contexto): Visão Noturna');
  });

  it('does NOT show "fora do contexto" when all passives are active', () => {
    const text = formatTurnStateText(makeState({
      vantagensPassivas: ['Visão Noturna'],
      passivasAplicaveis: [{ nome: 'Visão Noturna', bonus: '+2', motivo: 'escuro' }],
    }));
    expect(text).not.toContain('fora do contexto');
  });

  it('includes desvantagens alerta', () => {
    const text = formatTurnStateText(makeState({
      desvantagensAlerta: ['Medo de Fogo', 'Amaldiçoado'],
    }));
    expect(text).toContain('Desvantagens (alerta): Medo de Fogo, Amaldiçoado');
  });

  it('includes desvantagens ativadas counter', () => {
    const text = formatTurnStateText(makeState({
      desvantagensAtivadas: 1,
      desvantagensLimiteCena: 2,
    }));
    expect(text).toContain('Desvantagens ativadas nesta cena: 1/2');
  });

  it('includes inventário', () => {
    const text = formatTurnStateText(makeState({
      inventario: [
        { nome: 'Cajado Arcano', tipo: 'arma' },
        { nome: 'Poção de Cura', tipo: 'consumível' },
      ],
    }));
    expect(text).toContain('Inventário: Cajado Arcano, Poção de Cura');
  });

  it('includes itens ganhos e perdidos', () => {
    const text = formatTurnStateText(makeState({
      itensGanhos: [{ nome: 'Espada Flamejante' }],
      itensPerdidos: [{ nome: 'Tocha' }],
    }));
    expect(text).toContain('Itens ganhos: Espada Flamejante');
    expect(text).toContain('Itens perdidos: Tocha');
  });

  it('handles itensGanhos as plain strings', () => {
    const text = formatTurnStateText(makeState({
      itensGanhos: ['Espada', 'Escudo'],
    }));
    expect(text).toContain('Itens ganhos: Espada, Escudo');
  });

  it('includes último teste with DC, success, and total', () => {
    const text = formatTurnStateText(makeState({
      ultimoTeste: { teste: 'Percepção', dc: 15, sucesso: true, total: 18 },
    }));
    expect(text).toContain('Último teste: Percepção DC 15 Sucesso (total 18)');
  });

  it('includes último teste showing "Falha"', () => {
    const text = formatTurnStateText(makeState({
      ultimoTeste: { teste: 'Furtividade', dc: 12, sucesso: false, total: 8 },
    }));
    expect(text).toContain('Último teste: Furtividade DC 12 Falha (total 8)');
  });

  it('handles último teste with null dc/sucesso', () => {
    const text = formatTurnStateText(makeState({
      ultimoTeste: { teste: 'Acrobacia' },
    }));
    expect(text).toContain('Último teste: Acrobacia');
    expect(text).not.toContain('DC');
    expect(text).not.toContain('Sucesso');
    expect(text).not.toContain('Falha');
  });

  it('includes cena, ambiente, and hora when present', () => {
    const text = formatTurnStateText(makeState({
      cenaAtual: 'Caverna dos Cristais',
      ambiente: 'Subterrâneo',
      horaFiccional: 'Meia-noite',
    }));
    expect(text).toContain('Cena: Caverna dos Cristais');
    expect(text).toContain('Ambiente: Subterrâneo');
    expect(text).toContain('Hora: Meia-noite');
  });

  it('does NOT include cena line when all scene fields are null', () => {
    const text = formatTurnStateText(makeState({
      cenaAtual: null,
      ambiente: null,
      horaFiccional: null,
    }));
    expect(text).not.toContain('Cena:');
    expect(text).not.toContain('Ambiente:');
    expect(text).not.toContain('Hora:');
  });

  it('includes terreno with label and tags', () => {
    const text = formatTurnStateText(makeState({
      terreno: { tipo: 'caverna', label: 'Caverna Profunda', tags: ['subterrâneo', 'úmido'] },
      terreno_tags: ['subterrâneo', 'úmido'],
    }));
    expect(text).toContain('Terreno: Caverna Profunda [subterrâneo, úmido]');
  });

  it('includes efeitos_terreno descriptions', () => {
    const text = formatTurnStateText(makeState({
      efeitos_terreno: [
        { descricao: 'Chão escorregadio', elemento: 'gelo' },
        { descricao: 'Fumaça tóxica', elemento: 'veneno' },
      ],
    }));
    expect(text).toContain('Efeitos terreno: Chão escorregadio, Fumaça tóxica');
  });

  it('falls back to elemento when descricao is missing in efeitos_terreno', () => {
    const text = formatTurnStateText(makeState({
      efeitos_terreno: [{ elemento: 'fogo' }],
    }));
    expect(text).toContain('Efeitos terreno: fogo');
  });

  it('includes tensão', () => {
    const text = formatTurnStateText(makeState({ tensao: 'alta' }));
    expect(text).toContain('Tensão: alta');
  });

  it('includes ameaças', () => {
    const text = formatTurnStateText(makeState({
      ameacas: ['Dragão', 'Armadilhas'],
    }));
    expect(text).toContain('Ameaças: Dragão, Armadilhas');
  });

  it('includes boss info', () => {
    const text = formatTurnStateText(makeState({
      boss: { nome: 'Dragão Vermelho', fase_atual: 3 },
    }));
    expect(text).toContain('Boss: Dragão Vermelho (Fase 3)');
  });

  it('includes batalha_grande info with frentes', () => {
    const text = formatTurnStateText(makeState({
      batalha_grande: {
        nome: 'Cerco ao Castelo',
        objetivo: 'Defender os portões principais do castelo',
        frentes: [
          { nome: 'Portão Norte', status: 'ativa', progresso: 40 },
          { nome: 'Muralha Leste', status: 'crítica', progresso: 80 },
        ],
      },
    }));
    expect(text).toContain('Batalha: Cerco ao Castelo | Objetivo: Defender os portões principais do castelo');
    expect(text).toContain('Frentes: Portão Norte(ativa 40%), Muralha Leste(crítica 80%)');
  });

  it('includes missao_tatica info', () => {
    const text = formatTurnStateText(makeState({
      missao_tatica: {
        objetivo: 'Infiltrar a masmorra',
        descricao: 'Resgatar o prisioneiro',
        status: 'em_andamento',
        progresso: 30,
      },
    }));
    expect(text).toContain('Missão tática: Infiltrar a masmorra');
    expect(text).toContain('[em_andamento 30%]');
  });

  it('produces clean output with minimal state (no extra blank lines)', () => {
    const text = formatTurnStateText(makeState());
    const lines = text.split('\n');

    // First line is always the header
    expect(lines[0]).toContain('[Estado de Eldric');

    // Should not contain consecutive empty lines
    for (let i = 0; i < lines.length - 1; i++) {
      expect(lines[i] === '' && lines[i + 1] === '').toBe(false);
    }
  });

  it('handles mana with missing values using "?" fallback', () => {
    const state = makeState();
    state.mana = {};
    const text = formatTurnStateText(state);
    expect(text).toContain('Mana: ?/?');
  });

  it('shows passiva without bonus when bonus is null', () => {
    const text = formatTurnStateText(makeState({
      passivasAplicaveis: [
        { nome: 'Furtividade', bonus: null, motivo: 'escuro' },
      ],
    }));
    expect(text).toContain('Furtividade —');
    expect(text).not.toContain('[]');
  });

  it('uses "Teste" as default label when ultimoTeste.teste is missing', () => {
    const text = formatTurnStateText(makeState({
      ultimoTeste: { dc: 10, sucesso: true, total: 15 },
    }));
    expect(text).toContain('Último teste: Teste DC 10 Sucesso');
  });
});
