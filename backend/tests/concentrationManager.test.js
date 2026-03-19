import { describe, it, expect, vi } from 'vitest';

// Mock logger before importing the module
vi.mock('../helpers/logger.js', () => ({
  default: {
    child: () => ({
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {},
    }),
  },
}));

import {
  setConcentracao,
  getConcentracao,
  quebrarConcentracao,
  checkDanoConcentracao,
  decrementConcentracao,
} from '../helpers/concentrationManager.js';

// ── Helper: cria sessao vazia ──

function criaSessao() {
  return { estadoJogo: {} };
}

function criaMagia(overrides = {}) {
  return { id: 1, nome: 'Bendicao', duracao: 10, ...overrides };
}

// ── setConcentracao ──

describe('setConcentracao', () => {
  it('define concentracao ativa para um jogador', () => {
    const sessao = criaSessao();
    const result = setConcentracao(sessao, 'u1', criaMagia({ id: 5, nome: 'Levitatacao', duracao: 10 }));
    expect(result.quebrada).toBeNull();
    const conc = sessao.estadoJogo.concentracao['u1'];
    expect(conc).toEqual({
      magia_id: 5,
      nome: 'Levitatacao',
      turnos_restantes: 10,
    });
  });

  it('usa duracao padrao de 10 se nao especificada', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', { id: 1, nome: 'Luz' });
    expect(sessao.estadoJogo.concentracao['u1'].turnos_restantes).toBe(10);
  });

  it('retorna magia anterior ao definir nova concentracao', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', criaMagia({ id: 1, nome: 'Bendicao', duracao: 10 }));
    const result = setConcentracao(sessao, 'u1', criaMagia({ id: 2, nome: 'Escudo', duracao: 5 }));
    expect(result.quebrada).not.toBeNull();
    expect(result.quebrada.magia_id).toBe(1);
    expect(result.quebrada.nome).toBe('Bendicao');
    // Nova magia esta ativa
    expect(sessao.estadoJogo.concentracao['u1'].magia_id).toBe(2);
    expect(sessao.estadoJogo.concentracao['u1'].nome).toBe('Escudo');
    expect(sessao.estadoJogo.concentracao['u1'].turnos_restantes).toBe(5);
  });

  it('nao afeta concentracao de outros jogadores', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', criaMagia({ id: 1, nome: 'Bendicao' }));
    setConcentracao(sessao, 'u2', criaMagia({ id: 2, nome: 'Escudo' }));
    expect(sessao.estadoJogo.concentracao['u1'].magia_id).toBe(1);
    expect(sessao.estadoJogo.concentracao['u2'].magia_id).toBe(2);
  });

  it('userId numerico eh convertido para string', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 42, criaMagia({ id: 1, nome: 'Luz' }));
    expect(sessao.estadoJogo.concentracao['42']).toBeDefined();
    expect(sessao.estadoJogo.concentracao['42'].magia_id).toBe(1);
  });

  it('inicializa estadoJogo se nao existir', () => {
    const sessao = {};
    setConcentracao(sessao, 'u1', criaMagia());
    expect(sessao.estadoJogo).toBeDefined();
    expect(sessao.estadoJogo.concentracao).toBeDefined();
    expect(sessao.estadoJogo.concentracao['u1']).toBeDefined();
  });

  it('inicializa concentracao se nao existir', () => {
    const sessao = { estadoJogo: {} };
    setConcentracao(sessao, 'u1', criaMagia());
    expect(sessao.estadoJogo.concentracao).toBeDefined();
  });

  it('retorna quebrada null na primeira concentracao', () => {
    const sessao = criaSessao();
    const result = setConcentracao(sessao, 'u1', criaMagia());
    expect(result).toEqual({ quebrada: null });
  });
});

// ── getConcentracao ──

describe('getConcentracao', () => {
  it('retorna concentracao ativa do jogador', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', criaMagia({ id: 5, nome: 'Levitatacao', duracao: 8 }));
    const conc = getConcentracao(sessao, 'u1');
    expect(conc).toEqual({
      magia_id: 5,
      nome: 'Levitatacao',
      turnos_restantes: 8,
    });
  });

  it('retorna null se jogador nao tem concentracao', () => {
    const sessao = criaSessao();
    const conc = getConcentracao(sessao, 'u1');
    expect(conc).toBeNull();
  });

  it('retorna null apos concentracao ser quebrada', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', criaMagia());
    quebrarConcentracao(sessao, 'u1');
    expect(getConcentracao(sessao, 'u1')).toBeNull();
  });

  it('retorna null com sessao vazia', () => {
    const sessao = {};
    expect(getConcentracao(sessao, 'u1')).toBeNull();
  });

  it('userId numerico funciona como string', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 42, criaMagia({ id: 1, nome: 'Luz' }));
    expect(getConcentracao(sessao, 42)).not.toBeNull();
    expect(getConcentracao(sessao, '42')).not.toBeNull();
    expect(getConcentracao(sessao, 42).magia_id).toBe(1);
  });

  it('retorna dados corretos de outro jogador sem interferir', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', criaMagia({ id: 1, nome: 'Bendicao' }));
    setConcentracao(sessao, 'u2', criaMagia({ id: 2, nome: 'Escudo' }));
    expect(getConcentracao(sessao, 'u1').nome).toBe('Bendicao');
    expect(getConcentracao(sessao, 'u2').nome).toBe('Escudo');
  });
});

// ── quebrarConcentracao ──

describe('quebrarConcentracao', () => {
  it('quebra concentracao ativa e retorna magia quebrada', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', criaMagia({ id: 5, nome: 'Levitatacao' }));
    const result = quebrarConcentracao(sessao, 'u1');
    expect(result).not.toBeNull();
    expect(result.magia_id).toBe(5);
    expect(result.nome).toBe('Levitatacao');
    expect(getConcentracao(sessao, 'u1')).toBeNull();
  });

  it('retorna null se nao havia concentracao ativa', () => {
    const sessao = criaSessao();
    const result = quebrarConcentracao(sessao, 'u1');
    expect(result).toBeNull();
  });

  it('aceita motivo como parametro (manual)', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', criaMagia());
    // Nao lanca erro ao passar motivo
    expect(() => quebrarConcentracao(sessao, 'u1', 'manual')).not.toThrow();
  });

  it('aceita motivo como parametro (dano)', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', criaMagia());
    const result = quebrarConcentracao(sessao, 'u1', 'dano');
    expect(result).not.toBeNull();
  });

  it('nao afeta outros jogadores', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', criaMagia({ id: 1, nome: 'A' }));
    setConcentracao(sessao, 'u2', criaMagia({ id: 2, nome: 'B' }));
    quebrarConcentracao(sessao, 'u1');
    expect(getConcentracao(sessao, 'u1')).toBeNull();
    expect(getConcentracao(sessao, 'u2')).not.toBeNull();
    expect(getConcentracao(sessao, 'u2').nome).toBe('B');
  });

  it('pode quebrar e redefinir concentracao', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', criaMagia({ id: 1, nome: 'Antiga' }));
    quebrarConcentracao(sessao, 'u1');
    expect(getConcentracao(sessao, 'u1')).toBeNull();
    setConcentracao(sessao, 'u1', criaMagia({ id: 2, nome: 'Nova' }));
    expect(getConcentracao(sessao, 'u1').nome).toBe('Nova');
  });

  it('funciona com sessao vazia', () => {
    const sessao = {};
    expect(() => quebrarConcentracao(sessao, 'u1')).not.toThrow();
    expect(quebrarConcentracao(sessao, 'u1')).toBeNull();
  });
});

// ── checkDanoConcentracao ──

describe('checkDanoConcentracao', () => {
  it('retorna precisaTestar false se nao ha concentracao', () => {
    const sessao = criaSessao();
    const result = checkDanoConcentracao(sessao, 'u1', 10);
    expect(result.precisaTestar).toBe(false);
    expect(result.dc).toBe(0);
    expect(result.atributo).toBe('');
  });

  it('retorna precisaTestar true com DC 10 para dano baixo', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', criaMagia());
    const result = checkDanoConcentracao(sessao, 'u1', 8);
    expect(result.precisaTestar).toBe(true);
    // DC = max(10, floor(8/2)) = max(10, 4) = 10
    expect(result.dc).toBe(10);
    expect(result.atributo).toBe('constituicao');
  });

  it('retorna DC igual a metade do dano quando maior que 10', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', criaMagia());
    const result = checkDanoConcentracao(sessao, 'u1', 30);
    // DC = max(10, floor(30/2)) = max(10, 15) = 15
    expect(result.dc).toBe(15);
  });

  it('DC minimo eh 10', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', criaMagia());
    const result = checkDanoConcentracao(sessao, 'u1', 2);
    // DC = max(10, floor(2/2)) = max(10, 1) = 10
    expect(result.dc).toBe(10);
  });

  it('DC com dano 20 eh exatamente 10', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', criaMagia());
    const result = checkDanoConcentracao(sessao, 'u1', 20);
    // DC = max(10, floor(20/2)) = max(10, 10) = 10
    expect(result.dc).toBe(10);
  });

  it('DC com dano 21 eh 10 (floor(21/2) = 10)', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', criaMagia());
    const result = checkDanoConcentracao(sessao, 'u1', 21);
    // DC = max(10, floor(21/2)) = max(10, 10) = 10
    expect(result.dc).toBe(10);
  });

  it('DC com dano 22 eh 11 (floor(22/2) = 11)', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', criaMagia());
    const result = checkDanoConcentracao(sessao, 'u1', 22);
    // DC = max(10, floor(22/2)) = max(10, 11) = 11
    expect(result.dc).toBe(11);
  });

  it('DC com dano muito alto escala com metade do dano', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', criaMagia());
    const result = checkDanoConcentracao(sessao, 'u1', 100);
    // DC = max(10, floor(100/2)) = max(10, 50) = 50
    expect(result.dc).toBe(50);
  });

  it('DC com dano 0 eh 10', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', criaMagia());
    const result = checkDanoConcentracao(sessao, 'u1', 0);
    // DC = max(10, floor(0/2)) = max(10, 0) = 10
    expect(result.dc).toBe(10);
  });

  it('atributo eh sempre constituicao', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', criaMagia());
    const result = checkDanoConcentracao(sessao, 'u1', 15);
    expect(result.atributo).toBe('constituicao');
  });

  it('funciona com sessao vazia (sem concentracao)', () => {
    const sessao = {};
    const result = checkDanoConcentracao(sessao, 'u1', 10);
    expect(result.precisaTestar).toBe(false);
  });

  it('apos quebrar concentracao, nao precisa testar', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', criaMagia());
    quebrarConcentracao(sessao, 'u1');
    const result = checkDanoConcentracao(sessao, 'u1', 50);
    expect(result.precisaTestar).toBe(false);
  });
});

// ── decrementConcentracao ──

describe('decrementConcentracao', () => {
  it('decrementa turnos restantes', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', criaMagia({ id: 1, nome: 'Luz', duracao: 5 }));
    const result = decrementConcentracao(sessao, 'u1');
    expect(result).toBeNull(); // nao expirou
    expect(getConcentracao(sessao, 'u1').turnos_restantes).toBe(4);
  });

  it('quebra automaticamente quando turnos chegam a 0', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', criaMagia({ id: 1, nome: 'Flash', duracao: 1 }));
    const result = decrementConcentracao(sessao, 'u1');
    expect(result).not.toBeNull();
    expect(result.nome).toBe('Flash');
    expect(result.magia_id).toBe(1);
    expect(getConcentracao(sessao, 'u1')).toBeNull();
  });

  it('retorna null se jogador nao tem concentracao', () => {
    const sessao = criaSessao();
    const result = decrementConcentracao(sessao, 'u1');
    expect(result).toBeNull();
  });

  it('decrementos progressivos ate expirar', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', criaMagia({ id: 1, nome: 'Escudo', duracao: 3 }));

    let result = decrementConcentracao(sessao, 'u1');
    expect(result).toBeNull();
    expect(getConcentracao(sessao, 'u1').turnos_restantes).toBe(2);

    result = decrementConcentracao(sessao, 'u1');
    expect(result).toBeNull();
    expect(getConcentracao(sessao, 'u1').turnos_restantes).toBe(1);

    result = decrementConcentracao(sessao, 'u1');
    expect(result).not.toBeNull();
    expect(result.nome).toBe('Escudo');
    expect(getConcentracao(sessao, 'u1')).toBeNull();
  });

  it('nao afeta outros jogadores', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', criaMagia({ id: 1, nome: 'A', duracao: 2 }));
    setConcentracao(sessao, 'u2', criaMagia({ id: 2, nome: 'B', duracao: 5 }));

    decrementConcentracao(sessao, 'u1');
    expect(getConcentracao(sessao, 'u1').turnos_restantes).toBe(1);
    expect(getConcentracao(sessao, 'u2').turnos_restantes).toBe(5);
  });

  it('retorna null apos concentracao ja ter sido quebrada', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', criaMagia());
    quebrarConcentracao(sessao, 'u1');
    const result = decrementConcentracao(sessao, 'u1');
    expect(result).toBeNull();
  });

  it('funciona com sessao vazia', () => {
    const sessao = {};
    expect(() => decrementConcentracao(sessao, 'u1')).not.toThrow();
    expect(decrementConcentracao(sessao, 'u1')).toBeNull();
  });

  it('magia expirada contem dados completos', () => {
    const sessao = criaSessao();
    setConcentracao(sessao, 'u1', criaMagia({ id: 7, nome: 'Invisibilidade', duracao: 1 }));
    const result = decrementConcentracao(sessao, 'u1');
    expect(result).toHaveProperty('magia_id', 7);
    expect(result).toHaveProperty('nome', 'Invisibilidade');
    expect(result).toHaveProperty('turnos_restantes', 0);
  });
});
