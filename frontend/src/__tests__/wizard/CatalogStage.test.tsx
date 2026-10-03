// src/__tests__/wizard/CatalogStage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider } from '../../contexts/theme';
import CatalogStage from '../../Pages/Personagem/Wizard/stages/CatalogStage';
import { montar, clicar, digitar, tecla } from '../helpers/montar';

// CatalogCard e EmptyState leem useTheme(), que lança fora do provider.
const render = (el: ReactElement) => renderToStaticMarkup(<ThemeProvider>{el}</ThemeProvider>);

const itens = [
  { id: 1, nome: 'Elfo', descricao: 'Ágeis e longevos.', imagem: 'https://img/elfo.png', custo: 1, detalhe: '+1 Agilidade' },
  { id: 2, nome: 'Humano', descricao: 'Versáteis.', imagem: null, custo: 0 },
  { id: 3, nome: 'Tiefling', descricao: 'Linhagem infernal.', imagem: 'https://img/tief.png', custo: 2 },
];
const base = {
  modo: 'unica' as const, enviando: false, onSelecionar: () => {}, rotuloBusca: 'Buscar raça...', isLight: false,
  textoVazio: 'Nenhuma raça cadastrada para este sistema', textoErro: 'Não conseguimos carregar as raças',
};

describe('CatalogStage', () => {
  it('renderiza uma carta por item, com custo, Gratuita e detalhe', () => {
    const html = render(<CatalogStage {...base} itens={itens} selecionados={[]} />);
    expect(html).toContain('Elfo');
    expect(html).toContain('1 pts');
    expect(html).toContain('Gratuita');
    expect(html).toContain('+1 Agilidade');
    expect((html.match(/data-item=/g) ?? []).length).toBe(3);
  });

  it('item sem imagem não renderiza <img> com src vazio', () => {
    const html = render(<CatalogStage {...base} itens={[itens[1]]} selecionados={[]} />);
    expect(html).not.toMatch(/<img[^>]*src=""/);
  });

  it('marca o selecionado e a sugestão do Mestre', () => {
    const html = render(<CatalogStage {...base} itens={itens} selecionados={[1]} sugeridos={[3]} />);
    expect(html).toMatch(/data-item="1"[^>]*data-selecionada="true"/);
    expect(html).toMatch(/data-item="2"[^>]*data-selecionada="false"/);
    expect(html).toContain('Sugestão do Mestre');
  });

  it('mostra link para o catálogo completo quando há href', () => {
    const html = render(<CatalogStage {...base} itens={itens} selecionados={[]} catalogoHref="/racas" />);
    expect(html).toMatch(/href="\/racas"[^>]*target="_blank"/);
    expect(html).toContain('Ver catálogo completo');
  });

  it('enviando marca a grade como inerte', () => {
    const html = render(<CatalogStage {...base} itens={itens} selecionados={[]} enviando={true} />);
    expect(html).toContain('aria-busy="true"');
  });
});

describe('CatalogStage: limite de cartas', () => {
  const muitos = Array.from({ length: 40 }, (_, i) => ({ id: i + 1, nome: 'Raça ' + (i + 1), imagem: 'https://img/' + (i + 1) + '.png', custo: 1 }));

  it('com 40 itens renderiza só 12 cartas e o botão Mostrar mais', () => {
    const html = render(<CatalogStage {...base} itens={muitos} selecionados={[]} />);
    expect((html.match(/data-item=/g) ?? []).length).toBe(12);
    expect(html).toContain('Mostrar mais');
    expect(html).toContain('12 de 40');
  });

  it('selecionado e sugeridos vêm primeiro mesmo fora dos 12 iniciais', () => {
    const html = render(<CatalogStage {...base} itens={muitos} selecionados={[35]} sugeridos={[30]} />);
    const ordem = [...html.matchAll(/data-item="([0-9]+)"/g)].map((m) => m[1]);
    expect(ordem.slice(0, 2)).toEqual(['35', '30']);
    expect(ordem.length).toBe(12);
  });

  it('com até 12 itens não mostra Mostrar mais', () => {
    const html = render(<CatalogStage {...base} itens={itens} selecionados={[]} />);
    expect(html).not.toContain('Mostrar mais');
  });
});

describe('CatalogStage: carregando, erro e vazio (A04)', () => {
  it('carregando mostra a grade de esqueletos, sem cartas nem estado vazio', () => {
    const html = render(<CatalogStage {...base} itens={[]} selecionados={[]} carregando={true} />);
    expect(html).toContain('data-estado="carregando"');
    expect(html).toContain('animate-pulse');
    expect(html).not.toContain('data-item=');
    expect(html).not.toContain('Nenhum');
  });

  it('erro mostra a mensagem e Tentar de novo, que chama onTentarDeNovo', () => {
    const onTentarDeNovo = vi.fn();
    const { container, desmontar } = montar(<ThemeProvider><CatalogStage {...base} itens={[]} selecionados={[]} erro="Network Error" onTentarDeNovo={onTentarDeNovo} /></ThemeProvider>);
    expect(container.textContent).toContain('Não conseguimos carregar as raças');
    expect(container.textContent).not.toContain('Nenhum item com esse nome');
    clicar(container.querySelector('[data-acao="tentar-de-novo"]'));
    expect(onTentarDeNovo).toHaveBeenCalled();
    desmontar();
  });

  it('lista vazia sem busca diz que não há nada cadastrado', () => {
    const html = render(<CatalogStage {...base} itens={[]} selecionados={[]} />);
    expect(html).toContain('Nenhuma raça cadastrada para este sistema');
    expect(html).not.toContain('Nenhum item com esse nome');
  });

  it('"Nenhum item com esse nome" só aparece quando há busca', () => {
    const { container, desmontar } = montar(<ThemeProvider><CatalogStage {...base} itens={itens} selecionados={[]} /></ThemeProvider>);
    expect(container.textContent).not.toContain('Nenhum item com esse nome');
    digitar(container.querySelector('#catalog-busca'), 'zzz');
    expect(container.textContent).toContain('Nenhum item com esse nome');
    desmontar();
  });
});

describe('CatalogStage: seleção acessível e bloqueio', () => {
  const itens = [
    { id: 10, nome: 'Sentidos Aguçados', descricao: 'Percebe.', imagem: null, custo: 1 },
    { id: 11, nome: 'Riqueza', descricao: 'Recursos.', imagem: null, custo: 4 },
  ];
  const multi = { ...base, modo: 'multipla' as const, rotuloBusca: 'Buscar vantagem...', itens, formatoCusto: 'traco' as const };

  it('carta é botão com aria-pressed e estado Escolhida', () => {
    const html = render(<CatalogStage {...multi} selecionados={[10]} />);
    expect(html).toMatch(/data-item="10"[\s\S]*?role="button"[^>]*tabindex="0"[^>]*aria-pressed="true"/);
    expect(html).toMatch(/data-item="11"[\s\S]*?aria-pressed="false"/);
    expect(html).toContain('Escolhida');
  });
  it('bloqueio mostra o motivo e não vale para a selecionada', () => {
    const html = render(<CatalogStage {...multi} selecionados={[]} bloqueios={{ 11: 'Saldo insuficiente (faltam 1 pt)' }} />);
    expect(html).toMatch(/data-item="11"[^>]*data-bloqueada="true"/);
    expect(html).toContain('Saldo insuficiente (faltam 1 pt)');
    expect(html).toMatch(/aria-disabled="true"/);
    expect(render(<CatalogStage {...multi} selecionados={[11]} bloqueios={{ 11: 'x' }} />)).toMatch(/data-item="11"[^>]*data-bloqueada="false"/);
  });
  it('custo no formato único e aviso de saldo', () => {
    const html = render(<CatalogStage {...multi} selecionados={[]} avisoPorItem={{ 11: 'Seu saldo ficaria −1' }} />);
    expect(html).toContain('Custa 4 pts');
    expect(html).toContain('Seu saldo ficaria −1');
  });
  it('contador de escolhidas é anunciado', () => {
    expect(render(<CatalogStage {...multi} selecionados={[10]} />)).toMatch(/role="status"[^>]*aria-live="polite"[^>]*>1 escolhida</);
  });
  it('Enter e Espaço selecionam; carta bloqueada não chama onSelecionar', () => {
    const onSelecionar = vi.fn();
    const { container, desmontar } = montar(<ThemeProvider><CatalogStage {...multi} selecionados={[]} bloqueios={{ 11: 'Saldo insuficiente (faltam 1 pt)' }} onSelecionar={onSelecionar} /></ThemeProvider>);
    const carta = (id: number) => container.querySelector(`[data-item="${id}"] [role="button"]`) as HTMLElement;
    tecla(carta(10), 'Enter');
    tecla(carta(10), ' ');
    expect(onSelecionar).toHaveBeenCalledTimes(2);
    expect(onSelecionar).toHaveBeenCalledWith(expect.objectContaining({ id: 10 }));
    tecla(carta(11), 'Enter');
    clicar(carta(11));
    expect(onSelecionar).toHaveBeenCalledTimes(2);
    desmontar();
  });
});
