// src/__tests__/wizard/CatalogStage.test.tsx
import { describe, it, expect } from 'vitest';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider } from '../../contexts/theme';
import CatalogStage from '../../Pages/Personagem/Wizard/stages/CatalogStage';

// CatalogCard e EmptyState leem useTheme(), que lança fora do provider.
const render = (el: ReactElement) => renderToStaticMarkup(<ThemeProvider>{el}</ThemeProvider>);

const itens = [
  { id: 1, nome: 'Elfo', descricao: 'Ágeis e longevos.', imagem: 'https://img/elfo.png', custo: 1, detalhe: '+1 Agilidade' },
  { id: 2, nome: 'Humano', descricao: 'Versáteis.', imagem: null, custo: 0 },
  { id: 3, nome: 'Tiefling', descricao: 'Linhagem infernal.', imagem: 'https://img/tief.png', custo: 2 },
];
const base = { modo: 'unica' as const, enviando: false, onSelecionar: () => {}, rotuloBusca: 'Buscar raça...', isLight: false };

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
