import { describe, it, expect } from 'vitest';
import { calcularHP, calcularMP } from '../game-systems/tresdet/characterEngine.js';
import { parseCustoPM, processarDescansoTresDet } from '../game-systems/tresdet/combatEngine.js';

function makePersonagem(R) {
  return {
    atributos_personagem: [{ nome: 'R', valor: R }],
  };
}

// ─── calcularHP / calcularMP ─────────────────────────────────────────────────

describe('calcularHP', () => {
  it('R=0 retorna mínimo 1', () => {
    expect(calcularHP(makePersonagem(0))).toBe(1);
  });

  it('R=1 retorna 5', () => {
    expect(calcularHP(makePersonagem(1))).toBe(5);
  });

  it('R=3 retorna 15', () => {
    expect(calcularHP(makePersonagem(3))).toBe(15);
  });

  it('R=5 retorna 25', () => {
    expect(calcularHP(makePersonagem(5))).toBe(25);
  });
});

describe('calcularMP', () => {
  it('R=0 retorna mínimo 1', () => {
    expect(calcularMP(makePersonagem(0))).toBe(1);
  });

  it('R=1 retorna 5', () => {
    expect(calcularMP(makePersonagem(1))).toBe(5);
  });

  it('R=3 retorna 15', () => {
    expect(calcularMP(makePersonagem(3))).toBe(15);
  });

  it('R=5 retorna 25', () => {
    expect(calcularMP(makePersonagem(5))).toBe(25);
  });

  it('HP e MP usam a mesma fórmula (R*5, mínimo 1)', () => {
    for (const R of [0, 1, 2, 4]) {
      const p = makePersonagem(R);
      expect(calcularHP(p)).toBe(calcularMP(p));
    }
  });
});

// ─── parseCustoPM ────────────────────────────────────────────────────────────

describe('parseCustoPM', () => {
  it('parseia string simples "3"', () => {
    expect(parseCustoPM('3')).toBe(3);
  });

  it('parseia "1 a 5" → 1 (primeiro número)', () => {
    expect(parseCustoPM('1 a 5')).toBe(1);
  });

  it('parseia "2 PMs por turno" → 2', () => {
    expect(parseCustoPM('2 PMs por turno')).toBe(2);
  });

  it('parseia "20 PMs" → 20', () => {
    expect(parseCustoPM('20 PMs')).toBe(20);
  });

  it('aceita número diretamente', () => {
    expect(parseCustoPM(5)).toBe(5);
  });

  it('null → 0', () => {
    expect(parseCustoPM(null)).toBe(0);
  });

  it('undefined → 0', () => {
    expect(parseCustoPM(undefined)).toBe(0);
  });

  it('string vazia → 0', () => {
    expect(parseCustoPM('')).toBe(0);
  });

  it('"padrão" (sem número) → 0', () => {
    expect(parseCustoPM('padrão')).toBe(0);
  });

  it('"variável" → 0', () => {
    expect(parseCustoPM('variável')).toBe(0);
  });
});

// ─── processarDescansoTresDet ────────────────────────────────────────────────

describe('processarDescansoTresDet', () => {
  it('recupera HP e PM (resultado >= valor anterior)', () => {
    const personagem = {
      ...makePersonagem(3),
      hp_atual: 5,
      mana_atual: 5,
    };
    const result = processarDescansoTresDet(personagem);
    expect(result.hp_atual).toBeGreaterThanOrEqual(5);
    expect(result.mana_atual).toBeGreaterThanOrEqual(5);
  });

  it('HP e PM são limitados ao máximo (R=1, máx=5)', () => {
    const personagem = {
      ...makePersonagem(1),
      hp_atual: 4,
      mana_atual: 4,
    };
    const result = processarDescansoTresDet(personagem);
    expect(result.hp_atual).toBeLessThanOrEqual(5);
    expect(result.mana_atual).toBeLessThanOrEqual(5);
  });

  it('R=2 → 2 dados para PV e PM, valores entre 1 e 6', () => {
    const personagem = {
      ...makePersonagem(2),
      hp_atual: 0,
      mana_atual: 0,
    };
    const result = processarDescansoTresDet(personagem);
    expect(result.detalhes.pv.dados).toHaveLength(2);
    expect(result.detalhes.pm.dados).toHaveLength(2);
    expect(result.detalhes.pv.dados.every(d => d >= 1 && d <= 6)).toBe(true);
    expect(result.detalhes.pm.dados.every(d => d >= 1 && d <= 6)).toBe(true);
  });

  it('R=0 ainda rola pelo menos 1 dado (Math.max(1, R))', () => {
    const personagem = makePersonagem(0);
    const result = processarDescansoTresDet(personagem);
    expect(result.detalhes.pv.dados).toHaveLength(1);
    expect(result.detalhes.pm.dados).toHaveLength(1);
  });

  it('retorna breakdown detalhado com antes/depois/max', () => {
    const personagem = {
      ...makePersonagem(2),
      hp_atual: 3,
      mana_atual: 2,
    };
    const result = processarDescansoTresDet(personagem);
    expect(result.detalhes.pv).toMatchObject({ antes: 3, max: 10 });
    expect(result.detalhes.pm).toMatchObject({ antes: 2, max: 10 });
    expect(result.detalhes.pv.depois).toBe(result.hp_atual);
    expect(result.detalhes.pm.depois).toBe(result.mana_atual);
  });

  it('personagem já com HP/PM cheio não ultrapassa o máximo', () => {
    const personagem = makePersonagem(2); // hp_max=10, sem hp_atual → usa hp_max
    const result = processarDescansoTresDet(personagem);
    expect(result.hp_atual).toBe(10);
    expect(result.mana_atual).toBe(10);
  });
});

// ─── focus_requisito eligibility ─────────────────────────────────────────────

describe('focus eligibility filter', () => {
  const isEligible = (magia, focus) => {
    if (!magia.focus_requisito || !Array.isArray(magia.focus_requisito)) return true;
    return magia.focus_requisito.every(req => {
      const key = Object.keys(req)[0];
      return (focus[key] || 0) >= req[key];
    });
  };

  it('magia sem focus_requisito é sempre elegível', () => {
    expect(isEligible({ nome: 'Bola de Fogo' }, {})).toBe(true);
  });

  it('focus_requisito null é elegível', () => {
    expect(isEligible({ nome: 'Luz', focus_requisito: null }, {})).toBe(true);
  });

  it('requisito único atendido', () => {
    const magia = { focus_requisito: [{ fogo: 2 }] };
    expect(isEligible(magia, { fogo: 2 })).toBe(true);
    expect(isEligible(magia, { fogo: 3 })).toBe(true);
  });

  it('requisito único não atendido', () => {
    const magia = { focus_requisito: [{ fogo: 3 }] };
    expect(isEligible(magia, { fogo: 2 })).toBe(false);
    expect(isEligible(magia, {})).toBe(false);
  });

  it('múltiplos requisitos todos atendidos', () => {
    const magia = { focus_requisito: [{ fogo: 2 }, { arcano: 1 }] };
    expect(isEligible(magia, { fogo: 2, arcano: 1 })).toBe(true);
  });

  it('múltiplos requisitos parcialmente atendidos → não elegível', () => {
    const magia = { focus_requisito: [{ fogo: 2 }, { arcano: 1 }] };
    expect(isEligible(magia, { fogo: 2, arcano: 0 })).toBe(false);
    expect(isEligible(magia, { fogo: 1, arcano: 1 })).toBe(false);
  });

  it('focus_requisito array vazio é sempre elegível', () => {
    expect(isEligible({ focus_requisito: [] }, {})).toBe(true);
  });
});
