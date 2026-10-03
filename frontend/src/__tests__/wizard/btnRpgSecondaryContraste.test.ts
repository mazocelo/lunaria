// src/__tests__/wizard/btnRpgSecondaryContraste.test.ts
// G2: .btn-rpg-secondary tinha texto purple-300 sobre fundo claro (1,01:1) no tema claro.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Lido do disco: no vitest o import de .css (mesmo ?raw) chega vazio.
const css = readFileSync('src/index.css', 'utf8'); // o vitest roda da raiz do projeto

const bloco = (seletor: string) => {
  const i = css.indexOf(`${seletor} {`);
  if (i < 0) return null;
  return css.slice(i, css.indexOf('}', i));
};
const prop = (corpo: string, nome: string) => corpo.match(new RegExp(`(?:^|[\\s;{])${nome}:\\s*([^;]+);`))?.[1].trim() ?? null;

type Rgb = [number, number, number];
const hex = (h: string): Rgb => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
const mix = (cor: Rgb, pct: number, base: Rgb): Rgb => cor.map((c, i) => c * pct + base[i] * (1 - pct)) as Rgb;
const lum = ([r, g, b]: Rgb) => {
  const f = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contraste = (a: Rgb, b: Rgb) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

/** Resolve var(--primary) e color-mix(in srgb, var(--primary) N%, white) com o --primary do tema claro (:root). */
const primaryClaro = hex(prop(bloco(':root') ?? '', '--primary')?.match(/#[0-9a-fA-F]{6}/)?.[0] ?? '#000000');
const BRANCO: Rgb = [255, 255, 255];
const resolver = (valor: string): Rgb => {
  if (valor === 'var(--primary)') return primaryClaro;
  const m = valor.match(/^color-mix\(in srgb, var\(--primary\) (\d+)%, white\)$/);
  if (m) return mix(primaryClaro, Number(m[1]) / 100, BRANCO);
  throw new Error(`cor não suportada no teste: ${valor}`);
};

describe('.btn-rpg-secondary no tema claro (G2)', () => {
  const regra = bloco(':root:not(.dark) .btn-rpg-secondary');

  it('tem override para o tema claro (o gótico também leva .dark, então fica de fora)', () => {
    expect(regra).not.toBeNull();
  });

  it('texto com contraste ≥ 4,5:1 sobre o próprio fundo e sobre branco', () => {
    const cor = resolver(prop(regra ?? '', 'color') ?? '');
    const fundo = resolver(prop(regra ?? '', 'background') ?? '');
    expect(contraste(cor, fundo)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(cor, BRANCO)).toBeGreaterThanOrEqual(4.5);
  });

  it('borda visível (≥ 2:1 sobre branco)', () => {
    const borda = resolver(prop(regra ?? '', 'border-color') ?? '');
    expect(contraste(borda, BRANCO)).toBeGreaterThanOrEqual(2);
  });

  it('não mexe nas regras escura/gótica', () => {
    expect(css).toMatch(/\.btn-rpg-secondary \{\s*@apply [^;]*text-purple-300 bg-purple-900\/30/);
    expect(bloco('.gothic .btn-rpg-secondary')).toContain('color: #f87171');
  });
});
