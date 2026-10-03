// src/__tests__/wizard/AttributeDistributor.test.tsx
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import AttributeDistributor from '../../Pages/Personagem/Wizard/components/AttributeDistributor';
import AtributoTile from '../../Pages/Personagem/Wizard/components/AtributoTile';
import { pvEstimado } from '../../Pages/Personagem/Wizard/stages/atributos';

const atributos = { forca: 5, inteligencia: 10, constituicao: 12, agilidade: 10, destreza: 16, carisma: 9 };
const base = { atributos, setAtributo: () => {}, pontosDistribuidos: 12, pontosRestantes: 3, pontosTotais: 15, isLight: false, attrMin: 5, attrMax: 16,
  bonusFontes: { constituicao: [{ label: 'Anão', valor: 2 }] }, multRaca: 6 };

describe('pvEstimado', () => {
  it('mult × (nível 1 + max(1, mod CON))', () => {
    expect(pvEstimado(14, 6)).toBe(18);
    expect(pvEstimado(8, null)).toBe(10);
  });
});

describe('AtributoTile', () => {
  it('base, bônus por fonte, final e mod do final', () => {
    const html = renderToStaticMarkup(<AtributoTile chave="forca" rotulo="Força" base={12} fontes={[{ label: 'Elfo', valor: 2 }]} isLight={false} />);
    expect(html).toContain('data-atributo="forca"');
    expect(html).toMatch(/data-base="12"/);
    expect(html).toMatch(/data-final="14"/);
    expect(html).toContain('+2 Elfo');
    expect(html).toMatch(/mod \+2/); // mod de 14
  });
  it('bônus negativo aparece com sinal', () => {
    const html = renderToStaticMarkup(<AtributoTile chave="carisma" rotulo="Carisma" base={10} fontes={[{ label: 'Orc', valor: -2 }]} isLight />);
    expect(html).toMatch(/data-final="8"/);
    expect(html).toContain('-2 Orc');
    expect(html).toMatch(/mod -1/);
  });
});

describe('AttributeDistributor', () => {
  it('radar presente e tiles na ordem da ficha', () => {
    const html = renderToStaticMarkup(<AttributeDistributor {...base} />);
    expect(html).toContain('<svg');
    expect([...html.matchAll(/data-atributo="([a-z]+)"/g)].map((m) => m[1])).toEqual(['forca', 'inteligencia', 'constituicao', 'agilidade', 'destreza', 'carisma']);
  });
  it('PV usa a CON final (com bônus) antes de confirmar', () => {
    expect(renderToStaticMarkup(<AttributeDistributor {...base} />)).toMatch(/data-pv="18"/);
  });
  it('contador anunciado e botões rotulados', () => {
    const html = renderToStaticMarkup(<AttributeDistributor {...base} />);
    expect(html).toMatch(/role="status"[^>]*>[\s\S]*?3 pts restantes/);
    expect(html).toMatch(/aria-label="Diminuir Força"[^>]*\sdisabled=""/);
    expect(html).toMatch(/aria-label="Aumentar Destreza"[^>]*\sdisabled=""/);
    expect(html).not.toMatch(/aria-label="Aumentar Força"[^>]*\sdisabled=""/);
  });
});
