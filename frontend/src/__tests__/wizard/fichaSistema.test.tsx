// src/__tests__/wizard/fichaSistema.test.tsx
import { describe, it, expect } from 'vitest';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider } from '../../contexts/theme';
import { siglasDaFaixa } from '../../Pages/Personagem/Wizard/stages/atributos';
import { parseBonusVantagens } from '../../utils/bonusTracos';
import PersonagemPreviewCard from '../../components/PersonagemPreviewCard';
import HeroStrip from '../../Pages/Personagem/Wizard/components/HeroStrip';
import CatalogStage from '../../Pages/Personagem/Wizard/stages/CatalogStage';

const render = (el: ReactElement) => renderToStaticMarkup(<ThemeProvider>{el}</ThemeProvider>).replace(/<!-- -->/g, '');

describe('siglasDaFaixa', () => {
  it('D&D usa os seis atributos D&D, com vazio enquanto não atribuído', () => {
    expect(siglasDaFaixa('dnd5e', {}, { STR: 15, DEX: null, CON: 14, INT: 8, WIS: 12, CHA: 10 }))
      .toEqual([{ sigla: 'FOR', valor: 15 }, { sigla: 'DES', valor: null }, { sigla: 'CON', valor: 14 }, { sigla: 'INT', valor: 8 }, { sigla: 'SAB', valor: 12 }, { sigla: 'CAR', valor: 10 }]);
  });
  it('Lunaria na ordem da ficha', () => {
    expect(siglasDaFaixa('lunaria', { forca: 12, inteligencia: 10, constituicao: 14, agilidade: 9, destreza: 11, carisma: 8 }, {}).map((s) => s.sigla))
      .toEqual(['FOR', 'INT', 'CON', 'AGI', 'DES', 'CAR']);
  });
});

describe('HeroStrip', () => {
  it('atributo sem valor mostra "—"', () => {
    const html = render(<HeroStrip nome="Bram" atributos={[{ sigla: 'FOR', valor: 15 }, { sigla: 'DES', valor: null }]} etapasConcluidas={1} etapasTotal={7} expandida={false} onToggle={() => {}} isLight={false} />);
    expect(html).toMatch(/DES<\/span><b>—<\/b>/);
    expect(html).toMatch(/FOR<\/span><b>15<\/b>/);
  });
});

describe('PersonagemPreviewCard por sistema', () => {
  const base = { nome: 'Bram', raca: 1, classe: 2, racasDisponiveis: [{ id: 1, nome: 'Anão' }], classesDisponiveis: [{ id: 2, nome: 'Guerreiro' }], mostrarPendencias: true, bonusAplicados: true };
  it('D&D: sem Dons/Marcas e sem HP, atributos D&D, Pronto para criar sem pendência, background', () => {
    const html = render(<PersonagemPreviewCard {...base} sistema="dnd5e" atributosDnd={{ STR: 17, DEX: null, CON: 14, INT: 8, WIS: 12, CHA: 10 }} pendencias={[]} background="Ferreiro exilado." />);
    expect(html).toContain('SAB');
    expect(html).toContain('17');
    expect(html).not.toContain('AGI');
    expect(html).not.toMatch(/Dons|Marcas/);
    expect(html).not.toMatch(/>\d+\/\d+</);
    expect(html).toContain('Pronto para criar');
    expect(html).toContain('Ferreiro exilado.');
    expect(html).toContain('line-clamp-2');
  });
  it('pendências vindas de fora decidem o status', () => {
    const html = render(<PersonagemPreviewCard {...base} sistema="dnd5e" atributosDnd={{}} pendencias={[{ etapa: 'skills', texto: 'Perícias: confirme as escolhas' }]} />);
    expect(html).toContain('Em montagem');
    expect(html).not.toContain('Pronto para criar');
  });
  it('Lunaria: PV pela fórmula da ficha com o mult_raca da raça', () => {
    const html = render(<PersonagemPreviewCard {...base} racasDisponiveis={[{ id: 1, nome: 'Anão', mult_raca: 6 }]} atributos={{ constituicao: 14 }} bonusJaAplicado />);
    expect(html).toContain('18/18');
  });
});

describe('traços concedidos na carta (G-05)', () => {
  it('parseBonusVantagens lê objeto e JSON', () => {
    expect(parseBonusVantagens('{"vantagens":[{"id":1,"nome":"Visão no Escuro"}]}').vantagens).toEqual([{ id: 1, nome: 'Visão no Escuro' }]);
    expect(parseBonusVantagens(null)).toEqual({ vantagens: [], desvantagens: [] });
  });
  it('CatalogStage mostra Concede e Impõe', () => {
    const html = render(
      <CatalogStage itens={[{ id: 1, nome: 'Anão', tracos: { concede: ['Visão no Escuro'], impoe: ['Lento'] } }]} selecionados={[]} modo="unica" enviando={false} onSelecionar={() => {}}
        rotuloBusca="Buscar raça..." textoVazio="Nenhuma" textoErro="Falhou" isLight={false} />,
    );
    expect(html).toContain('Concede: Visão no Escuro');
    expect(html).toContain('Impõe: Lento');
  });
});
