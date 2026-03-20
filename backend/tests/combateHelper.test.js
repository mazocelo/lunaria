import { describe, it, expect } from 'vitest';
import {
  rolarDado,
  calcularHP,
  calcularMana,
  calcularEsquiva,
  calcularArmadura,
  verificarEsquiva,
  calcularDano,
  calcularAbsorcao,
  calcularDCEsquiva,
  calcularBonusNivelCombate,
  aplicarResistencias,
  verificarAcerto,
  normalizeCombatLogEntry,
  verificarFimCombate,
  processarHabilidade,
  formatarResultadoMecanico,
} from '../helpers/combateHelper.js';

// ── rolarDado ──

describe('rolarDado', () => {
  it('1d20 retorna entre 1 e 20', () => {
    for (let i = 0; i < 50; i++) {
      const r = rolarDado('1d20');
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(20);
    }
  });

  it('2d6 retorna entre 2 e 12', () => {
    for (let i = 0; i < 50; i++) {
      const r = rolarDado('2d6');
      expect(r).toBeGreaterThanOrEqual(2);
      expect(r).toBeLessThanOrEqual(12);
    }
  });

  it('1d6+3 retorna entre 4 e 9', () => {
    for (let i = 0; i < 50; i++) {
      const r = rolarDado('1d6+3');
      expect(r).toBeGreaterThanOrEqual(4);
      expect(r).toBeLessThanOrEqual(9);
    }
  });

  it('1d4-1 retorna entre 0 e 3', () => {
    for (let i = 0; i < 50; i++) {
      const r = rolarDado('1d4-1');
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(3);
    }
  });

  it('notacao invalida retorna 1', () => {
    expect(rolarDado('abc')).toBe(1);
    expect(rolarDado(null)).toBe(1);
    expect(rolarDado(undefined)).toBe(1);
    expect(rolarDado('')).toBe(1);
  });
});

// ── calcularHP ──

describe('calcularHP', () => {
  it('personagem nivel 1, CON 10 → 10', () => {
    // multRaca=5, modCON=0, max(1,0)=1 → 5*(1+1) = 10
    expect(calcularHP({ constituicao: 10, nivel: 1 })).toBe(10);
  });

  it('personagem nivel 5, CON 16 → 40', () => {
    // modCON = floor((16-10)/2) = 3, max(1,3)=3 → 5*(5+3) = 40
    expect(calcularHP({ constituicao: 16, nivel: 5 })).toBe(40);
  });

  it('CON baixo nunca retorna menos que 1', () => {
    expect(calcularHP({ constituicao: 1, nivel: 1 })).toBeGreaterThanOrEqual(1);
  });

  it('sem parametros usa defaults (CON 10, nivel 1)', () => {
    // multRaca default 5 → 5*(1+1) = 10
    expect(calcularHP({})).toBe(10);
  });

  it('multRaca customizado altera HP', () => {
    // Anão multRaca=6, nivel=1, CON=10 → 6*(1+1) = 12
    expect(calcularHP({ constituicao: 10, nivel: 1 }, 6)).toBe(12);
  });
});

// ── calcularMana ──

describe('calcularMana', () => {
  it('INT 10, nivel 1 → 11', () => {
    // 10 + 1 + 0*2 = 11
    expect(calcularMana({ inteligencia: 10, nivel: 1 })).toBe(11);
  });

  it('INT 16, nivel 5 → 21', () => {
    // modInt = 3, 10 + 5 + 3*2 = 21
    expect(calcularMana({ inteligencia: 16, nivel: 5 })).toBe(21);
  });

  it('minimo de 5', () => {
    expect(calcularMana({ inteligencia: 1, nivel: 1 })).toBeGreaterThanOrEqual(5);
  });
});

// ── calcularEsquiva ──

describe('calcularEsquiva', () => {
  it('AGI 10, DEX 10, nivel 1 → 0', () => {
    // modAgi=0, modDex=0, base=0, bonusNivel=0
    expect(calcularEsquiva({ agilidade: 10, destreza: 10, nivel: 1 })).toBe(0);
  });

  it('AGI 16, DEX 14, nivel 5 → capped at 50', () => {
    // modAgi=3, modDex=2, base=(3+1)*5=20, bonusNivel=2
    const result = calcularEsquiva({ agilidade: 16, destreza: 14, nivel: 5 });
    expect(result).toBeLessThanOrEqual(50);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('cap maximo 50%', () => {
    const result = calcularEsquiva(
      { agilidade: 30, destreza: 30, nivel: 20 },
      { esquiva_bonus: 50 }
    );
    expect(result).toBe(50);
  });

  it('cap minimo 0%', () => {
    const result = calcularEsquiva(
      { agilidade: 1, destreza: 1, nivel: 1 },
      { esquiva_penalidade: 100 }
    );
    expect(result).toBe(0);
  });

  it('bonus de equipamento soma, penalidade subtrai', () => {
    const base = calcularEsquiva({ agilidade: 14, destreza: 10, nivel: 1 });
    const comBonus = calcularEsquiva({ agilidade: 14, destreza: 10, nivel: 1 }, { esquiva_bonus: 5 });
    const comPenalidade = calcularEsquiva({ agilidade: 14, destreza: 10, nivel: 1 }, { esquiva_penalidade: 5 });
    expect(comBonus).toBe(base + 5);
    expect(comPenalidade).toBe(Math.max(0, base - 5));
  });
});

// ── calcularArmadura ──

describe('calcularArmadura', () => {
  it('retorna valor de armadura do bonus', () => {
    expect(calcularArmadura({ armadura: 5 })).toBe(5);
  });

  it('sem bonus retorna 0', () => {
    expect(calcularArmadura({})).toBe(0);
    expect(calcularArmadura()).toBe(0);
  });
});

// ── verificarEsquiva ──

describe('verificarEsquiva', () => {
  it('taxa 0 nunca esquiva', () => {
    for (let i = 0; i < 20; i++) {
      expect(verificarEsquiva(0)).toBe(false);
    }
  });

  it('taxa 100 sempre esquiva', () => {
    for (let i = 0; i < 20; i++) {
      expect(verificarEsquiva(100)).toBe(true);
    }
  });

  it('retorna boolean', () => {
    expect(typeof verificarEsquiva(25)).toBe('boolean');
  });
});

// ── verificarAcerto ──

describe('verificarAcerto', () => {
  it('nat 20 → critico', () => {
    const r = verificarAcerto(20);
    expect(r.acertou).toBe(true);
    expect(r.critico).toBe(true);
  });

  it('nat 1 → miss automatico', () => {
    const r = verificarAcerto(1);
    expect(r.acertou).toBe(false);
    expect(r.critico).toBe(false);
  });

  it('rolagem normal (2-19) → acerta sem critico', () => {
    for (let i = 2; i <= 19; i++) {
      const r = verificarAcerto(i);
      expect(r.acertou).toBe(true);
      expect(r.critico).toBe(false);
    }
  });
});

// ── calcularDano ──

describe('calcularDano', () => {
  it('dano basico retorna valor positivo', () => {
    // Nova formula: rola dado + modFOR, sem armadura (absorcao e tratada separadamente)
    for (let i = 0; i < 20; i++) {
      const dano = calcularDano('1d8', 0, false);
      expect(dano).toBeGreaterThanOrEqual(1);
    }
  });

  it('critico dobra o dano', () => {
    // Critico: dano * 2, range (1d6+2)*2 = 6-16
    for (let i = 0; i < 20; i++) {
      const dano = calcularDano('1d6', 2, true);
      expect(dano).toBeGreaterThanOrEqual(6);
      expect(dano).toBeLessThanOrEqual(16);
    }
  });

  it('dano com modForca positivo aumenta resultado', () => {
    // 1d4 + 3 = 4-7
    for (let i = 0; i < 20; i++) {
      const dano = calcularDano('1d4', 3, false);
      expect(dano).toBeGreaterThanOrEqual(4);
      expect(dano).toBeLessThanOrEqual(7);
    }
  });
});

// ── calcularAbsorcao ──

describe('calcularAbsorcao', () => {
  it('CON 10 → modCON=0, dados=max(0,-1)=0 → apenas armadura', () => {
    const absorcao = calcularAbsorcao(10, 3);
    expect(absorcao).toBe(3); // 0d4 + 3
  });

  it('CON 12 → modCON=1, dados=0 → apenas armadura', () => {
    const absorcao = calcularAbsorcao(12, 2);
    expect(absorcao).toBe(2); // max(0,0)=0 dados + 2
  });

  it('CON 14 → modCON=2, dados=1 → 1d4 + armadura', () => {
    for (let i = 0; i < 20; i++) {
      const absorcao = calcularAbsorcao(14, 0);
      expect(absorcao).toBeGreaterThanOrEqual(1);
      expect(absorcao).toBeLessThanOrEqual(4);
    }
  });

  it('CON 18 → modCON=4, dados=3 → 3d4 + armadura', () => {
    for (let i = 0; i < 20; i++) {
      const absorcao = calcularAbsorcao(18, 0);
      expect(absorcao).toBeGreaterThanOrEqual(3);
      expect(absorcao).toBeLessThanOrEqual(12);
    }
  });

  it('sem armadura usa 0 como default', () => {
    const absorcao = calcularAbsorcao(10);
    expect(absorcao).toBe(0); // 0d4 + 0
  });
});

// ── calcularDCEsquiva ──

describe('calcularDCEsquiva', () => {
  it('AGI 10 → DC 8', () => {
    expect(calcularDCEsquiva(10)).toBe(8);
  });

  it('AGI 14 → modAGI=2 → DC 10', () => {
    expect(calcularDCEsquiva(14)).toBe(10);
  });

  it('AGI 8 → modAGI=-1 → DC 7', () => {
    expect(calcularDCEsquiva(8)).toBe(7);
  });

  it('AGI undefined → usa 10 como default → DC 8', () => {
    expect(calcularDCEsquiva(undefined)).toBe(8);
  });
});

// ── calcularBonusNivelCombate ──

describe('calcularBonusNivelCombate', () => {
  it('nivel 1 → bonus 0', () => {
    expect(calcularBonusNivelCombate(1)).toBe(0);
  });

  it('nivel 2 → bonus 1', () => {
    expect(calcularBonusNivelCombate(2)).toBe(1);
  });

  it('nivel 5 → bonus 2', () => {
    expect(calcularBonusNivelCombate(5)).toBe(2);
  });

  it('nivel undefined → usa 1 → bonus 0', () => {
    expect(calcularBonusNivelCombate(undefined)).toBe(0);
  });
});

// ── aplicarResistencias ──

describe('aplicarResistencias', () => {
  it('sem elemento retorna dano inteiro', () => {
    expect(aplicarResistencias(10, null)).toBe(10);
    expect(aplicarResistencias(10, undefined)).toBe(10);
  });

  it('imunidade retorna 0', () => {
    expect(aplicarResistencias(10, 'fogo', {}, ['fogo'])).toBe(0);
  });

  it('resistencia parcial reduz dano', () => {
    expect(aplicarResistencias(10, 'gelo', { gelo: 0.5 })).toBe(5);
  });

  it('sem resistencia retorna dano inteiro', () => {
    expect(aplicarResistencias(10, 'raio', {})).toBe(10);
  });

  it('resistencia zero retorna 0', () => {
    expect(aplicarResistencias(10, 'fogo', { fogo: 0 })).toBe(0);
  });
});

// ── normalizeCombatLogEntry ──

describe('normalizeCombatLogEntry', () => {
  it('normaliza atacante string para objeto', () => {
    const entry = { atacante: 'Goblin', atacanteId: 'g1' };
    const result = normalizeCombatLogEntry(entry);
    expect(result.atacante).toEqual({ id: 'g1', nome: 'Goblin' });
    expect(result.atacanteId).toBeUndefined();
  });

  it('normaliza alvo string para objeto', () => {
    const entry = { alvo: 'Heroi', alvoId: 'h1' };
    const result = normalizeCombatLogEntry(entry);
    expect(result.alvo).toEqual({ id: 'h1', nome: 'Heroi' });
    expect(result.alvoId).toBeUndefined();
  });

  it('alvoNome vira alvo objeto', () => {
    const entry = { alvoNome: 'Boss', alvoId: 'b1' };
    const result = normalizeCombatLogEntry(entry);
    expect(result.alvo).toEqual({ id: 'b1', nome: 'Boss' });
  });

  it('null retorna null', () => {
    expect(normalizeCombatLogEntry(null)).toBeNull();
  });

  it('entry sem campos especiais retorna copia', () => {
    const entry = { tipo: 'ataque', dano: 5 };
    const result = normalizeCombatLogEntry(entry);
    expect(result).toEqual(entry);
    expect(result).not.toBe(entry); // copia
  });
});

// ── verificarFimCombate ──

describe('verificarFimCombate', () => {
  it('todos monstros mortos → vitoria', () => {
    const state = {
      ativo: true,
      monstros: [{ status: 'morto' }, { status: 'morto' }],
      jogadores: { u1: { status: 'vivo' } },
    };
    const result = verificarFimCombate(state);
    expect(result.finalizado).toBe(true);
    expect(result.resultado).toBe('vitoria');
  });

  it('todos jogadores mortos → derrota', () => {
    const state = {
      ativo: true,
      monstros: [{ status: 'vivo' }],
      jogadores: { u1: { status: 'morto' } },
    };
    const result = verificarFimCombate(state);
    expect(result.finalizado).toBe(true);
    expect(result.resultado).toBe('derrota');
  });

  it('combate em andamento → nao finalizado', () => {
    const state = {
      ativo: true,
      monstros: [{ status: 'vivo' }],
      jogadores: { u1: { status: 'vivo' } },
    };
    const result = verificarFimCombate(state);
    expect(result.finalizado).toBe(false);
    expect(result.resultado).toBeNull();
  });

  it('state null/inativo → nao finalizado', () => {
    expect(verificarFimCombate(null).finalizado).toBe(false);
    expect(verificarFimCombate({ ativo: false }).finalizado).toBe(false);
  });
});

// ── processarHabilidade ──

describe('processarHabilidade', () => {
  it('mana insuficiente → invalido', () => {
    const result = processarHabilidade(
      { custo_mana: 10, id: 1 },
      { mana_atual: 5, cooldowns: {} }
    );
    expect(result.valido).toBe(false);
    expect(result.erro).toContain('Mana insuficiente');
  });

  it('em cooldown → invalido', () => {
    const result = processarHabilidade(
      { custo_mana: 0, id: 1 },
      { mana_atual: 20, cooldowns: { 'hab_1': 3 } }
    );
    expect(result.valido).toBe(false);
    expect(result.erro).toContain('cooldown');
  });

  it('habilidade valida sem custo → valido', () => {
    const result = processarHabilidade(
      { custo_mana: 0, id: 1, dano_base: '1d6' },
      { mana_atual: 20, cooldowns: {} }
    );
    expect(result.valido).toBe(true);
    expect(result.dano).toBeGreaterThanOrEqual(0);
  });

  it('habilidade valida com custo mana → retorna custoMana', () => {
    const result = processarHabilidade(
      { custo_mana: 5, id: 2, dano_base: '1d8', cooldown_turnos: 2 },
      { mana_atual: 20, cooldowns: {} }
    );
    expect(result.valido).toBe(true);
    expect(result.custoMana).toBe(5);
    expect(result.cooldown).toBe(2);
  });
});

// ── formatarResultadoMecanico ──

describe('formatarResultadoMecanico', () => {
  it('retorna string formatada', () => {
    const result = formatarResultadoMecanico({
      ataqueJogador: { acertou: true, dano: 8, critico: false, esquivou: false },
      contraAtaques: [],
      statusEfeitos: [],
    }, 'Arthas');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('sem resultado retorna string vazia ou minimal', () => {
    const result = formatarResultadoMecanico({ statusEfeitos: [], contraAtaques: [] }, 'Heroi');
    expect(typeof result).toBe('string');
  });
});
