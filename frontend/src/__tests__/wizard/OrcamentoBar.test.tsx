// src/__tests__/wizard/OrcamentoBar.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import OrcamentoBar from '../../Pages/Personagem/Wizard/stages/OrcamentoBar';
import { idsAcimaDoOrcamento, pontosDevolvidos } from '../../Pages/Personagem/Wizard/stages/orcamento';
import { montar, clicar } from '../helpers/montar';

const base = {
  tipo: 'vantagem' as const, total: 12, gastos: 7, restantes: 5, custoRaca: 2, custoClasse: 1, pontosVantagem: 4,
  devolvidos: 2, maxDevolucao: 3, escolhidas: [{ id: 10, nome: 'Riqueza', custo: 4 }], enviando: false, onRemover: () => {}, isLight: false,
};

describe('idsAcimaDoOrcamento', () => {
  const o = { pontosCriacaoRestantes: 3, pontosDesvantagem: -2, maxCustoDesvantagem: 3 };

  it('vantagem mais cara que o saldo fica de fora', () => {
    const itens = [{ id: 1, custo: 3 }, { id: 2, custo: 4 }, { id: 3, custo: null }];
    expect(idsAcimaDoOrcamento('vantagem', itens, o)).toEqual([2]);
  });

  it('desvantagem que passa do limite de devolução fica de fora', () => {
    const itens = [{ id: 4, custo: -1 }, { id: 5, custo: -2 }];
    expect(idsAcimaDoOrcamento('desvantagem', itens, o)).toEqual([5]);
  });

  it('a já escolhida nunca fica bloqueada: clicar nela remove', () => {
    const itens = [{ id: 2, custo: 4 }, { id: 6, custo: 5 }];
    expect(idsAcimaDoOrcamento('vantagem', itens, { ...o, pontosCriacaoRestantes: -1 }, ['2'])).toEqual([6]);
  });
});

describe('pontosDevolvidos', () => {
  it('limita ao máximo de devolução', () => {
    expect(pontosDevolvidos(-5, 3)).toBe(3);
    expect(pontosDevolvidos(-2, 3)).toBe(2);
    expect(pontosDevolvidos(0, 3)).toBe(0);
  });
});

describe('OrcamentoBar', () => {
  it('mostra saldo, composição e a escolhida com botão de remover', () => {
    const html = renderToStaticMarkup(<OrcamentoBar {...base} />);
    expect(html).toContain('Pontos de criação');
    expect(html).toMatch(/data-saldo="5"/);
    expect(html).toContain('Raça 2');
    expect(html).toContain('Classe 1');
    expect(html).toContain('Vantagens 4');
    expect(html).toContain('Desvantagens +2 de 3');
    expect(html).toContain('aria-label="Remover Riqueza"');
    expect(html).toContain('data-remover="10"');
    expect(html).toContain('focus-visible:ring-2');
  });

  it('saldo negativo avisa', () => {
    const html = renderToStaticMarkup(<OrcamentoBar {...base} restantes={-1} />);
    expect(html).toContain('Orçamento excedido');
    expect(html).toContain('text-red-400');
  });

  it('sem escolhidas mostra o vazio do tipo', () => {
    expect(renderToStaticMarkup(<OrcamentoBar {...base} escolhidas={[]} />)).toContain('Nenhuma vantagem escolhida ainda.');
    expect(renderToStaticMarkup(<OrcamentoBar {...base} tipo="desvantagem" escolhidas={[]} />)).toContain('Nenhuma desvantagem escolhida ainda.');
  });

  it('desvantagem mostra o custo como pontos devolvidos', () => {
    const html = renderToStaticMarkup(<OrcamentoBar {...base} tipo="desvantagem" escolhidas={[{ id: 3, nome: 'Fobia', custo: -2 }]} />);
    expect(html).toContain('Devolve 2 pts');
  });

  it('saldo anunciado e custo no formato único', () => {
    const html = renderToStaticMarkup(<OrcamentoBar {...base} />);
    expect(html).toMatch(/role="status"[^>]*aria-live="polite"/);
    expect(html).toContain('Custa 4 pts');
  });

  it('enviando desabilita a remoção', () => {
    const html = renderToStaticMarkup(<OrcamentoBar {...base} enviando />);
    expect(html).toMatch(/aria-label="Remover Riqueza"[^>]*\sdisabled=""/);
  });

  it('o X remove com um clique', () => {
    const onRemover = vi.fn();
    const m = montar(<OrcamentoBar {...base} onRemover={onRemover} />);
    clicar(m.container.querySelector('[data-remover="10"]'));
    expect(onRemover).toHaveBeenCalledWith(10);
    m.desmontar();
  });
});
