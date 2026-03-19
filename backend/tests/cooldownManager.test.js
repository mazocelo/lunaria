import { describe, it, expect } from 'vitest';
import {
  setCooldown,
  decrementCooldowns,
  checkCooldown,
  getCooldownsAtivos,
} from '../helpers/cooldownManager.js';

// ── Helper: cria sessao vazia ──

function criaSessao() {
  return { estadoJogo: {} };
}

// ── setCooldown ──

describe('setCooldown', () => {
  it('define cooldown para habilidade no jogador', () => {
    const sessao = criaSessao();
    setCooldown(sessao, 'u1', 'hab', 5, 3);
    expect(sessao.estadoJogo.cooldowns['u1']['hab_5']).toBe(3);
  });

  it('define cooldown para magia no jogador', () => {
    const sessao = criaSessao();
    setCooldown(sessao, 'u1', 'mag', 10, 2);
    expect(sessao.estadoJogo.cooldowns['u1']['mag_10']).toBe(2);
  });

  it('turnos negativos sao clamped a 0', () => {
    const sessao = criaSessao();
    setCooldown(sessao, 'u1', 'hab', 1, -5);
    expect(sessao.estadoJogo.cooldowns['u1']['hab_1']).toBe(0);
  });

  it('turnos zero define cooldown como 0', () => {
    const sessao = criaSessao();
    setCooldown(sessao, 'u1', 'hab', 1, 0);
    expect(sessao.estadoJogo.cooldowns['u1']['hab_1']).toBe(0);
  });

  it('sobrescreve cooldown existente', () => {
    const sessao = criaSessao();
    setCooldown(sessao, 'u1', 'hab', 5, 3);
    setCooldown(sessao, 'u1', 'hab', 5, 1);
    expect(sessao.estadoJogo.cooldowns['u1']['hab_5']).toBe(1);
  });

  it('define multiplos cooldowns para o mesmo jogador', () => {
    const sessao = criaSessao();
    setCooldown(sessao, 'u1', 'hab', 1, 3);
    setCooldown(sessao, 'u1', 'mag', 2, 5);
    setCooldown(sessao, 'u1', 'hab', 3, 1);
    const cds = sessao.estadoJogo.cooldowns['u1'];
    expect(cds['hab_1']).toBe(3);
    expect(cds['mag_2']).toBe(5);
    expect(cds['hab_3']).toBe(1);
  });

  it('define cooldowns para jogadores diferentes', () => {
    const sessao = criaSessao();
    setCooldown(sessao, 'u1', 'hab', 1, 3);
    setCooldown(sessao, 'u2', 'hab', 1, 5);
    expect(sessao.estadoJogo.cooldowns['u1']['hab_1']).toBe(3);
    expect(sessao.estadoJogo.cooldowns['u2']['hab_1']).toBe(5);
  });

  it('userId numerico eh convertido para string', () => {
    const sessao = criaSessao();
    setCooldown(sessao, 42, 'hab', 1, 2);
    expect(sessao.estadoJogo.cooldowns['42']['hab_1']).toBe(2);
  });

  it('inicializa estadoJogo se nao existir', () => {
    const sessao = {};
    setCooldown(sessao, 'u1', 'hab', 1, 2);
    expect(sessao.estadoJogo).toBeDefined();
    expect(sessao.estadoJogo.cooldowns['u1']['hab_1']).toBe(2);
  });

  it('inicializa cooldowns se nao existir', () => {
    const sessao = { estadoJogo: {} };
    setCooldown(sessao, 'u1', 'hab', 1, 2);
    expect(sessao.estadoJogo.cooldowns).toBeDefined();
    expect(sessao.estadoJogo.cooldowns['u1']['hab_1']).toBe(2);
  });
});

// ── decrementCooldowns ──

describe('decrementCooldowns', () => {
  it('decrementa cooldown de 3 para 2', () => {
    const sessao = criaSessao();
    setCooldown(sessao, 'u1', 'hab', 1, 3);
    decrementCooldowns(sessao, 'u1');
    expect(sessao.estadoJogo.cooldowns['u1']['hab_1']).toBe(2);
  });

  it('decrementa cooldown de 1 para 0 e remove a chave', () => {
    const sessao = criaSessao();
    setCooldown(sessao, 'u1', 'hab', 1, 1);
    decrementCooldowns(sessao, 'u1');
    expect(sessao.estadoJogo.cooldowns['u1']['hab_1']).toBeUndefined();
  });

  it('remove cooldown que chega a zero', () => {
    const sessao = criaSessao();
    setCooldown(sessao, 'u1', 'hab', 1, 1);
    decrementCooldowns(sessao, 'u1');
    const keys = Object.keys(sessao.estadoJogo.cooldowns['u1']);
    expect(keys).toHaveLength(0);
  });

  it('decrementa multiplos cooldowns simultaneamente', () => {
    const sessao = criaSessao();
    setCooldown(sessao, 'u1', 'hab', 1, 3);
    setCooldown(sessao, 'u1', 'mag', 2, 1);
    setCooldown(sessao, 'u1', 'hab', 3, 2);
    decrementCooldowns(sessao, 'u1');
    const cds = sessao.estadoJogo.cooldowns['u1'];
    expect(cds['hab_1']).toBe(2);
    expect(cds['mag_2']).toBeUndefined(); // era 1, decrementou e removeu
    expect(cds['hab_3']).toBe(1);
  });

  it('nao afeta cooldowns de outros jogadores', () => {
    const sessao = criaSessao();
    setCooldown(sessao, 'u1', 'hab', 1, 3);
    setCooldown(sessao, 'u2', 'hab', 1, 3);
    decrementCooldowns(sessao, 'u1');
    expect(sessao.estadoJogo.cooldowns['u1']['hab_1']).toBe(2);
    expect(sessao.estadoJogo.cooldowns['u2']['hab_1']).toBe(3);
  });

  it('nao falha se jogador nao tem cooldowns', () => {
    const sessao = criaSessao();
    expect(() => decrementCooldowns(sessao, 'u1')).not.toThrow();
  });

  it('nao falha com sessao vazia', () => {
    const sessao = {};
    expect(() => decrementCooldowns(sessao, 'u1')).not.toThrow();
  });

  it('decrementar ate zero remove todos os cooldowns progressivamente', () => {
    const sessao = criaSessao();
    setCooldown(sessao, 'u1', 'hab', 1, 2);
    decrementCooldowns(sessao, 'u1');
    expect(sessao.estadoJogo.cooldowns['u1']['hab_1']).toBe(1);
    decrementCooldowns(sessao, 'u1');
    expect(sessao.estadoJogo.cooldowns['u1']['hab_1']).toBeUndefined();
  });
});

// ── checkCooldown ──

describe('checkCooldown', () => {
  it('retorna true se habilidade esta em cooldown', () => {
    const sessao = criaSessao();
    setCooldown(sessao, 'u1', 'hab', 5, 3);
    expect(checkCooldown(sessao, 'u1', 'hab', 5)).toBe(true);
  });

  it('retorna false se habilidade nao esta em cooldown', () => {
    const sessao = criaSessao();
    expect(checkCooldown(sessao, 'u1', 'hab', 5)).toBe(false);
  });

  it('retorna false apos cooldown expirar', () => {
    const sessao = criaSessao();
    setCooldown(sessao, 'u1', 'hab', 5, 1);
    decrementCooldowns(sessao, 'u1');
    expect(checkCooldown(sessao, 'u1', 'hab', 5)).toBe(false);
  });

  it('retorna true enquanto cooldown ainda esta ativo', () => {
    const sessao = criaSessao();
    setCooldown(sessao, 'u1', 'hab', 5, 2);
    decrementCooldowns(sessao, 'u1');
    expect(checkCooldown(sessao, 'u1', 'hab', 5)).toBe(true);
  });

  it('retorna false para cooldown com valor 0', () => {
    const sessao = criaSessao();
    setCooldown(sessao, 'u1', 'hab', 5, 0);
    expect(checkCooldown(sessao, 'u1', 'hab', 5)).toBe(false);
  });

  it('diferencia hab de mag para o mesmo id', () => {
    const sessao = criaSessao();
    setCooldown(sessao, 'u1', 'hab', 1, 3);
    expect(checkCooldown(sessao, 'u1', 'hab', 1)).toBe(true);
    expect(checkCooldown(sessao, 'u1', 'mag', 1)).toBe(false);
  });

  it('nao falha com sessao vazia', () => {
    const sessao = {};
    expect(checkCooldown(sessao, 'u1', 'hab', 1)).toBe(false);
  });

  it('userId numerico funciona igual a string', () => {
    const sessao = criaSessao();
    setCooldown(sessao, 42, 'hab', 1, 3);
    expect(checkCooldown(sessao, 42, 'hab', 1)).toBe(true);
    expect(checkCooldown(sessao, '42', 'hab', 1)).toBe(true);
  });
});

// ── getCooldownsAtivos ──

describe('getCooldownsAtivos', () => {
  it('retorna mapa vazio se nao ha cooldowns', () => {
    const sessao = criaSessao();
    const result = getCooldownsAtivos(sessao, 'u1');
    expect(result).toEqual({});
  });

  it('retorna mapa com cooldowns ativos', () => {
    const sessao = criaSessao();
    setCooldown(sessao, 'u1', 'hab', 15, 2);
    setCooldown(sessao, 'u1', 'mag', 7, 1);
    const result = getCooldownsAtivos(sessao, 'u1');
    expect(result).toEqual({ hab_15: 2, mag_7: 1 });
  });

  it('nao retorna cooldowns de outros jogadores', () => {
    const sessao = criaSessao();
    setCooldown(sessao, 'u1', 'hab', 1, 3);
    setCooldown(sessao, 'u2', 'hab', 2, 5);
    const result = getCooldownsAtivos(sessao, 'u1');
    expect(result).toEqual({ hab_1: 3 });
    expect(result['hab_2']).toBeUndefined();
  });

  it('retorna referencia ao objeto real (mutacoes refletem)', () => {
    const sessao = criaSessao();
    setCooldown(sessao, 'u1', 'hab', 1, 3);
    const result = getCooldownsAtivos(sessao, 'u1');
    result['mag_99'] = 5;
    expect(sessao.estadoJogo.cooldowns['u1']['mag_99']).toBe(5);
  });

  it('funciona com sessao vazia', () => {
    const sessao = {};
    const result = getCooldownsAtivos(sessao, 'u1');
    expect(result).toEqual({});
  });

  it('reflete estado apos decrementos', () => {
    const sessao = criaSessao();
    setCooldown(sessao, 'u1', 'hab', 1, 2);
    setCooldown(sessao, 'u1', 'mag', 2, 1);
    decrementCooldowns(sessao, 'u1');
    const result = getCooldownsAtivos(sessao, 'u1');
    expect(result['hab_1']).toBe(1);
    expect(result['mag_2']).toBeUndefined(); // removido apos chegar a 0
  });
});
