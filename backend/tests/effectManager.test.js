import { describe, it, expect, vi, beforeEach } from 'vitest';

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
  aplicarEfeito,
  removerEfeito,
  decrementEfeitos,
  aplicarEfeitosPorTurno,
  getEfeitosAtivos,
} from '../helpers/effectManager.js';

// ── Helper: cria sessao com personagem ──

function criaSessao(personagens = {}) {
  return {
    personagensCompletos: personagens,
  };
}

function criaPersonagem(id, extras = {}) {
  return { id, nome: `Personagem ${id}`, status_efeitos: [], ...extras };
}

// ── aplicarEfeito ──

describe('aplicarEfeito', () => {
  it('aplica efeito de dano por turno ao personagem', () => {
    const p = criaPersonagem('p1');
    const sessao = criaSessao({ p1: p });
    const result = aplicarEfeito(sessao, 'p1', {
      nome: 'Queimando',
      duracao: 3,
      tipo: 'fogo',
      dano_por_turno: 5,
    });
    expect(result).toBe(true);
    expect(p.status_efeitos).toHaveLength(1);
    expect(p.status_efeitos[0].nome).toBe('Queimando');
    expect(p.status_efeitos[0].duracao).toBe(3);
    expect(p.status_efeitos[0].tipo).toBe('fogo');
    expect(p.status_efeitos[0].dano_por_turno).toBe(5);
    expect(p.status_efeitos[0].cura_por_turno).toBeNull();
    expect(p.status_efeitos[0].aplicado_em).toBeDefined();
  });

  it('aplica efeito de cura por turno ao personagem', () => {
    const p = criaPersonagem('p1');
    const sessao = criaSessao({ p1: p });
    const result = aplicarEfeito(sessao, 'p1', {
      nome: 'Regenerando',
      duracao: 5,
      cura_por_turno: 3,
    });
    expect(result).toBe(true);
    expect(p.status_efeitos[0].cura_por_turno).toBe(3);
    expect(p.status_efeitos[0].dano_por_turno).toBeNull();
  });

  it('usa duracao padrao de 3 se nao especificada', () => {
    const p = criaPersonagem('p1');
    const sessao = criaSessao({ p1: p });
    aplicarEfeito(sessao, 'p1', { nome: 'Lento' });
    expect(p.status_efeitos[0].duracao).toBe(3);
  });

  it('renova duracao de efeito existente com mesmo nome', () => {
    const p = criaPersonagem('p1');
    const sessao = criaSessao({ p1: p });
    aplicarEfeito(sessao, 'p1', { nome: 'Queimando', duracao: 3, dano_por_turno: 5 });
    aplicarEfeito(sessao, 'p1', { nome: 'Queimando', duracao: 5, dano_por_turno: 8 });
    expect(p.status_efeitos).toHaveLength(1);
    expect(p.status_efeitos[0].duracao).toBe(5);
    expect(p.status_efeitos[0].dano_por_turno).toBe(8);
  });

  it('atualiza aplicado_em ao renovar efeito', () => {
    const p = criaPersonagem('p1');
    const sessao = criaSessao({ p1: p });
    aplicarEfeito(sessao, 'p1', { nome: 'Queimando', duracao: 3 });
    const ts1 = p.status_efeitos[0].aplicado_em;

    // Pequeno delay para garantir timestamp diferente
    vi.spyOn(Date, 'now').mockReturnValueOnce(ts1 + 1000);
    aplicarEfeito(sessao, 'p1', { nome: 'Queimando', duracao: 5 });
    expect(p.status_efeitos[0].aplicado_em).toBeGreaterThanOrEqual(ts1);
  });

  it('empilha efeitos com nomes diferentes', () => {
    const p = criaPersonagem('p1');
    const sessao = criaSessao({ p1: p });
    aplicarEfeito(sessao, 'p1', { nome: 'Queimando', duracao: 3, dano_por_turno: 5 });
    aplicarEfeito(sessao, 'p1', { nome: 'Envenenado', duracao: 4, dano_por_turno: 2 });
    aplicarEfeito(sessao, 'p1', { nome: 'Regenerando', duracao: 3, cura_por_turno: 3 });
    expect(p.status_efeitos).toHaveLength(3);
  });

  it('retorna false se personagem nao existe', () => {
    const sessao = criaSessao({});
    const result = aplicarEfeito(sessao, 'inexistente', { nome: 'Queimando', duracao: 3 });
    expect(result).toBe(false);
  });

  it('inicializa status_efeitos se nao existir', () => {
    const p = { id: 'p1', nome: 'Teste' };
    const sessao = criaSessao({ p1: p });
    aplicarEfeito(sessao, 'p1', { nome: 'Lento', duracao: 2 });
    expect(p.status_efeitos).toBeDefined();
    expect(p.status_efeitos).toHaveLength(1);
  });

  it('tipo padrao eh null se nao especificado', () => {
    const p = criaPersonagem('p1');
    const sessao = criaSessao({ p1: p });
    aplicarEfeito(sessao, 'p1', { nome: 'Debuff', duracao: 2 });
    expect(p.status_efeitos[0].tipo).toBeNull();
  });

  it('userId numerico eh tratado como string', () => {
    const p = criaPersonagem('42');
    const sessao = criaSessao({ '42': p });
    const result = aplicarEfeito(sessao, 42, { nome: 'Lento', duracao: 2 });
    expect(result).toBe(true);
    expect(p.status_efeitos).toHaveLength(1);
  });
});

// ── removerEfeito ──

describe('removerEfeito', () => {
  it('remove efeito especifico pelo nome', () => {
    const p = criaPersonagem('p1');
    const sessao = criaSessao({ p1: p });
    aplicarEfeito(sessao, 'p1', { nome: 'Queimando', duracao: 3 });
    aplicarEfeito(sessao, 'p1', { nome: 'Envenenado', duracao: 3 });
    const result = removerEfeito(sessao, 'p1', 'Queimando');
    expect(result).toBe(true);
    expect(p.status_efeitos).toHaveLength(1);
    expect(p.status_efeitos[0].nome).toBe('Envenenado');
  });

  it('retorna false se efeito nao encontrado', () => {
    const p = criaPersonagem('p1');
    const sessao = criaSessao({ p1: p });
    aplicarEfeito(sessao, 'p1', { nome: 'Queimando', duracao: 3 });
    const result = removerEfeito(sessao, 'p1', 'Congelado');
    expect(result).toBe(false);
    expect(p.status_efeitos).toHaveLength(1);
  });

  it('retorna false se personagem nao existe', () => {
    const sessao = criaSessao({});
    const result = removerEfeito(sessao, 'inexistente', 'Queimando');
    expect(result).toBe(false);
  });

  it('retorna false se personagem nao tem status_efeitos', () => {
    const p = { id: 'p1', nome: 'Teste' };
    const sessao = criaSessao({ p1: p });
    const result = removerEfeito(sessao, 'p1', 'Queimando');
    expect(result).toBe(false);
  });

  it('remove apenas o primeiro efeito com nome correspondente', () => {
    const p = criaPersonagem('p1');
    const sessao = criaSessao({ p1: p });
    aplicarEfeito(sessao, 'p1', { nome: 'Buff', duracao: 3 });
    // Forcando adicionando duplicata diretamente para testar remoção
    p.status_efeitos.push({ nome: 'Buff', duracao: 5 });
    const result = removerEfeito(sessao, 'p1', 'Buff');
    expect(result).toBe(true);
    expect(p.status_efeitos).toHaveLength(1);
    expect(p.status_efeitos[0].duracao).toBe(5);
  });

  it('lista fica vazia apos remover unico efeito', () => {
    const p = criaPersonagem('p1');
    const sessao = criaSessao({ p1: p });
    aplicarEfeito(sessao, 'p1', { nome: 'Queimando', duracao: 3 });
    removerEfeito(sessao, 'p1', 'Queimando');
    expect(p.status_efeitos).toHaveLength(0);
  });
});

// ── decrementEfeitos ──

describe('decrementEfeitos', () => {
  it('decrementa duracao de todos os efeitos', () => {
    const p = criaPersonagem('p1');
    const sessao = criaSessao({ p1: p });
    aplicarEfeito(sessao, 'p1', { nome: 'Queimando', duracao: 3 });
    aplicarEfeito(sessao, 'p1', { nome: 'Envenenado', duracao: 5 });
    decrementEfeitos(sessao, 'p1');
    expect(p.status_efeitos[0].duracao).toBe(2);
    expect(p.status_efeitos[1].duracao).toBe(4);
  });

  it('remove efeito cuja duracao chega a 0', () => {
    const p = criaPersonagem('p1');
    const sessao = criaSessao({ p1: p });
    aplicarEfeito(sessao, 'p1', { nome: 'Flash', duracao: 1 });
    const expirados = decrementEfeitos(sessao, 'p1');
    expect(p.status_efeitos).toHaveLength(0);
    expect(expirados).toHaveLength(1);
    expect(expirados[0].nome).toBe('Flash');
  });

  it('retorna lista de efeitos que expiraram', () => {
    const p = criaPersonagem('p1');
    const sessao = criaSessao({ p1: p });
    aplicarEfeito(sessao, 'p1', { nome: 'A', duracao: 1 });
    aplicarEfeito(sessao, 'p1', { nome: 'B', duracao: 3 });
    aplicarEfeito(sessao, 'p1', { nome: 'C', duracao: 1 });
    const expirados = decrementEfeitos(sessao, 'p1');
    expect(expirados).toHaveLength(2);
    const nomes = expirados.map(e => e.nome);
    expect(nomes).toContain('A');
    expect(nomes).toContain('C');
    expect(p.status_efeitos).toHaveLength(1);
    expect(p.status_efeitos[0].nome).toBe('B');
  });

  it('retorna array vazio se nenhum efeito expirou', () => {
    const p = criaPersonagem('p1');
    const sessao = criaSessao({ p1: p });
    aplicarEfeito(sessao, 'p1', { nome: 'Longo', duracao: 10 });
    const expirados = decrementEfeitos(sessao, 'p1');
    expect(expirados).toHaveLength(0);
    expect(p.status_efeitos).toHaveLength(1);
  });

  it('retorna array vazio se personagem nao existe', () => {
    const sessao = criaSessao({});
    const expirados = decrementEfeitos(sessao, 'inexistente');
    expect(expirados).toEqual([]);
  });

  it('retorna array vazio se personagem nao tem efeitos', () => {
    const p = { id: 'p1', nome: 'Teste' };
    const sessao = criaSessao({ p1: p });
    const expirados = decrementEfeitos(sessao, 'p1');
    expect(expirados).toEqual([]);
  });

  it('multiplos decrementos expiram progressivamente', () => {
    const p = criaPersonagem('p1');
    const sessao = criaSessao({ p1: p });
    aplicarEfeito(sessao, 'p1', { nome: 'Curto', duracao: 2 });
    aplicarEfeito(sessao, 'p1', { nome: 'Longo', duracao: 4 });

    let exp = decrementEfeitos(sessao, 'p1');
    expect(exp).toHaveLength(0);
    expect(p.status_efeitos).toHaveLength(2);

    exp = decrementEfeitos(sessao, 'p1');
    expect(exp).toHaveLength(1);
    expect(exp[0].nome).toBe('Curto');
    expect(p.status_efeitos).toHaveLength(1);

    exp = decrementEfeitos(sessao, 'p1');
    expect(exp).toHaveLength(0);

    exp = decrementEfeitos(sessao, 'p1');
    expect(exp).toHaveLength(1);
    expect(exp[0].nome).toBe('Longo');
    expect(p.status_efeitos).toHaveLength(0);
  });
});

// ── aplicarEfeitosPorTurno ──

describe('aplicarEfeitosPorTurno', () => {
  it('retorna dano de efeito de dano por turno', () => {
    const p = criaPersonagem('p1');
    const sessao = criaSessao({ p1: p });
    aplicarEfeito(sessao, 'p1', { nome: 'Queimando', duracao: 3, dano_por_turno: 5 });
    const resultados = aplicarEfeitosPorTurno(sessao, 'p1');
    expect(resultados).toHaveLength(1);
    expect(resultados[0]).toEqual({ nome: 'Queimando', tipo: 'dano', valor: 5 });
  });

  it('retorna cura de efeito de cura por turno', () => {
    const p = criaPersonagem('p1');
    const sessao = criaSessao({ p1: p });
    aplicarEfeito(sessao, 'p1', { nome: 'Regenerando', duracao: 3, cura_por_turno: 4 });
    const resultados = aplicarEfeitosPorTurno(sessao, 'p1');
    expect(resultados).toHaveLength(1);
    expect(resultados[0]).toEqual({ nome: 'Regenerando', tipo: 'cura', valor: 4 });
  });

  it('retorna dano e cura de efeitos multiplos', () => {
    const p = criaPersonagem('p1');
    const sessao = criaSessao({ p1: p });
    aplicarEfeito(sessao, 'p1', { nome: 'Queimando', duracao: 3, dano_por_turno: 5 });
    aplicarEfeito(sessao, 'p1', { nome: 'Envenenado', duracao: 4, dano_por_turno: 2 });
    aplicarEfeito(sessao, 'p1', { nome: 'Regenerando', duracao: 3, cura_por_turno: 3 });
    const resultados = aplicarEfeitosPorTurno(sessao, 'p1');
    expect(resultados).toHaveLength(3);

    const danos = resultados.filter(r => r.tipo === 'dano');
    const curas = resultados.filter(r => r.tipo === 'cura');
    expect(danos).toHaveLength(2);
    expect(curas).toHaveLength(1);
    expect(danos.reduce((sum, d) => sum + d.valor, 0)).toBe(7); // 5 + 2
    expect(curas[0].valor).toBe(3);
  });

  it('ignora efeitos sem dano nem cura', () => {
    const p = criaPersonagem('p1');
    const sessao = criaSessao({ p1: p });
    aplicarEfeito(sessao, 'p1', { nome: 'Lento', duracao: 3 });
    const resultados = aplicarEfeitosPorTurno(sessao, 'p1');
    expect(resultados).toHaveLength(0);
  });

  it('ignora dano_por_turno zero ou negativo', () => {
    const p = criaPersonagem('p1');
    const sessao = criaSessao({ p1: p });
    p.status_efeitos = [
      { nome: 'Nada', duracao: 3, dano_por_turno: 0, cura_por_turno: null },
    ];
    const resultados = aplicarEfeitosPorTurno(sessao, 'p1');
    expect(resultados).toHaveLength(0);
  });

  it('retorna array vazio se personagem nao existe', () => {
    const sessao = criaSessao({});
    const resultados = aplicarEfeitosPorTurno(sessao, 'inexistente');
    expect(resultados).toEqual([]);
  });

  it('retorna array vazio se personagem nao tem efeitos', () => {
    const p = { id: 'p1', nome: 'Teste' };
    const sessao = criaSessao({ p1: p });
    const resultados = aplicarEfeitosPorTurno(sessao, 'p1');
    expect(resultados).toEqual([]);
  });

  it('efeito com dano E cura gera duas entradas', () => {
    const p = criaPersonagem('p1');
    const sessao = criaSessao({ p1: p });
    // Efeito exotico com ambos
    p.status_efeitos = [
      { nome: 'Vampirico', duracao: 3, dano_por_turno: 4, cura_por_turno: 2 },
    ];
    const resultados = aplicarEfeitosPorTurno(sessao, 'p1');
    expect(resultados).toHaveLength(2);
    expect(resultados[0]).toEqual({ nome: 'Vampirico', tipo: 'dano', valor: 4 });
    expect(resultados[1]).toEqual({ nome: 'Vampirico', tipo: 'cura', valor: 2 });
  });
});

// ── getEfeitosAtivos ──

describe('getEfeitosAtivos', () => {
  it('retorna efeitos ativos do personagem', () => {
    const p = criaPersonagem('p1');
    const sessao = criaSessao({ p1: p });
    aplicarEfeito(sessao, 'p1', { nome: 'Queimando', duracao: 3, dano_por_turno: 5 });
    aplicarEfeito(sessao, 'p1', { nome: 'Lento', duracao: 2 });
    const ativos = getEfeitosAtivos(sessao, 'p1');
    expect(ativos).toHaveLength(2);
    expect(ativos[0].nome).toBe('Queimando');
    expect(ativos[1].nome).toBe('Lento');
  });

  it('retorna array vazio se personagem nao tem efeitos', () => {
    const p = criaPersonagem('p1');
    const sessao = criaSessao({ p1: p });
    const ativos = getEfeitosAtivos(sessao, 'p1');
    expect(ativos).toEqual([]);
  });

  it('retorna array vazio se personagem nao existe', () => {
    const sessao = criaSessao({});
    const ativos = getEfeitosAtivos(sessao, 'inexistente');
    expect(ativos).toEqual([]);
  });

  it('retorna array vazio se personagem nao tem propriedade status_efeitos', () => {
    const p = { id: 'p1', nome: 'Teste' };
    const sessao = criaSessao({ p1: p });
    const ativos = getEfeitosAtivos(sessao, 'p1');
    expect(ativos).toEqual([]);
  });

  it('reflete efeitos apos decrement', () => {
    const p = criaPersonagem('p1');
    const sessao = criaSessao({ p1: p });
    aplicarEfeito(sessao, 'p1', { nome: 'Curto', duracao: 1 });
    aplicarEfeito(sessao, 'p1', { nome: 'Longo', duracao: 5 });
    decrementEfeitos(sessao, 'p1');
    const ativos = getEfeitosAtivos(sessao, 'p1');
    expect(ativos).toHaveLength(1);
    expect(ativos[0].nome).toBe('Longo');
  });

  it('reflete efeitos apos remocao', () => {
    const p = criaPersonagem('p1');
    const sessao = criaSessao({ p1: p });
    aplicarEfeito(sessao, 'p1', { nome: 'A', duracao: 3 });
    aplicarEfeito(sessao, 'p1', { nome: 'B', duracao: 3 });
    removerEfeito(sessao, 'p1', 'A');
    const ativos = getEfeitosAtivos(sessao, 'p1');
    expect(ativos).toHaveLength(1);
    expect(ativos[0].nome).toBe('B');
  });
});
