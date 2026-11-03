// src/__tests__/wizard/HeroStrip.test.tsx
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import HeroStrip from '../../Pages/Personagem/Wizard/components/HeroStrip';

const atributos = [
  { chave: 'forca', sigla: 'FOR', valor: 8 },
  { chave: 'inteligencia', sigla: 'INT', valor: 12 },
  { chave: 'constituicao', sigla: 'CON', valor: 10 },
  { chave: 'agilidade', sigla: 'AGI', valor: 14 },
  { chave: 'destreza', sigla: 'DES', valor: 12 },
  { chave: 'carisma', sigla: 'CAR', valor: 13 },
];

describe('HeroStrip', () => {
  it('mostra nome, raça · classe, progresso e pílulas', () => {
    const html = renderToStaticMarkup(
      <HeroStrip nome="Kaelen" racaNome="Elfo" classeNome="Bardo" atributos={atributos} etapasConcluidas={4} etapasTotal={10} pontosRestantes={3} expandida={false} onToggle={() => {}} isLight={false} />,
    );
    expect(html).toContain('Kaelen');
    expect(html).toContain('Elfo · Bardo');
    expect(html).toContain('4/10');
    expect(html).toContain('FOR');
    expect(html).toContain('>14<');
    expect(html).toContain('3 pts');
    expect(html).toContain('aria-expanded="false"');
  });

  it('sem nome mostra "Herói sem nome" e inicial "?"', () => {
    const html = renderToStaticMarkup(
      <HeroStrip nome="" atributos={atributos} etapasConcluidas={0} etapasTotal={10} expandida={false} onToggle={() => {}} isLight={true} />,
    );
    expect(html).toContain('Herói sem nome');
    expect(html).toContain('>?<');
    expect(html).toContain('Raça e classe pendentes');
  });

  it('expandida renderiza os filhos', () => {
    const html = renderToStaticMarkup(
      <HeroStrip nome="Kaelen" atributos={atributos} etapasConcluidas={1} etapasTotal={10} expandida={true} onToggle={() => {}} isLight={false}>
        <div>FICHA COMPLETA</div>
      </HeroStrip>,
    );
    expect(html).toContain('FICHA COMPLETA');
    expect(html).toContain('aria-expanded="true"');
  });
});
