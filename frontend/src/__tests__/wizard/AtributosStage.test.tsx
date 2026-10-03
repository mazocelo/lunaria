// src/__tests__/wizard/AtributosStage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import AtributosStage from '../../Pages/Personagem/Wizard/stages/AtributosStage';
import { montar, clicar } from '../helpers/montar';

const atributosBase = { forca: 12, inteligencia: 10, constituicao: 10, agilidade: 10, destreza: 10, carisma: 10 };
const base = { atributosBase, bonusFontes: { forca: [{ label: 'Raça', valor: 2 }] }, bonusAplicados: false, setAtributo: () => {},
  pontosDistribuidos: 12, pontosRestantes: 3, pontosTotais: 15, atributosSugeridos: null, aplicarAtributosSugeridos: () => {},
  attrMin: 5, attrMax: 16, multRaca: 5, enviando: false, onRedistribuir: () => {}, isLight: false };

describe('AtributosStage', () => {
  it('distribuindo: controles, bônus já visível e nenhum botão de confirmar na etapa', () => {
    const html = renderToStaticMarkup(<AtributosStage {...base} />);
    expect(html).toContain('aria-label="Aumentar Força"');
    expect(html).toMatch(/data-atributo="forca"[^>]*data-final="14"/);
    expect(html).not.toContain('Confirmar atributos');
    expect(html).not.toContain('data-acao="redistribuir"');
  });
  it('confirmado: só leitura, final com bônus e Redistribuir', () => {
    const html = renderToStaticMarkup(<AtributosStage {...base} bonusAplicados />);
    expect(html).toContain('Atributos confirmados');
    expect(html).toMatch(/data-atributo="forca"[^>]*data-final="14"/);
    expect(html).not.toContain('aria-label="Aumentar Força"');
    expect(html).toContain('data-acao="redistribuir"');
    expect(html).toContain('<svg');
  });
  it('confirmado: sem sugestão do Mestre', () => {
    const html = renderToStaticMarkup(<AtributosStage {...base} bonusAplicados atributosSugeridos={{ forca: 14 }} />);
    expect(html).not.toContain('data-acao="aplicar-sugestao"');
  });
  it('Redistribuir chama o modelo e fica travado enquanto envia', () => {
    const onRedistribuir = vi.fn();
    const m = montar(<AtributosStage {...base} bonusAplicados onRedistribuir={onRedistribuir} />);
    clicar(m.container.querySelector('[data-acao="redistribuir"]'));
    expect(onRedistribuir).toHaveBeenCalledTimes(1);
    m.desmontar();
    expect(renderToStaticMarkup(<AtributosStage {...base} bonusAplicados enviando />)).toMatch(/data-acao="redistribuir"[^>]*\sdisabled=""/);
  });
});
