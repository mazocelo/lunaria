// src/__tests__/wizard/NomeStage.test.tsx
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import NomeStage from '../../Pages/Personagem/Wizard/stages/NomeStage';

const base = { enviando: false, onConfirmar: () => {}, onPedirSugestoes: () => {}, isLight: false };

describe('NomeStage', () => {
  it('sem nome: input vazio e Continuar desabilitado', () => {
    const html = renderToStaticMarkup(<NomeStage {...base} nomeAtual="" sugestoes={[]} />);
    expect(html).toMatch(/<input[^>]*id="nome-heroi"[^>]*value=""/);
    expect(html).toMatch(/data-acao="confirmar-nome"[^>]*\sdisabled=""/);
    expect(html).toContain('Pedir nomes ao Mestre');
  });

  it('com nome e sugestões: input preenchido, chips visíveis, Continuar habilitado', () => {
    const html = renderToStaticMarkup(<NomeStage {...base} nomeAtual="Kaelen" sugestoes={['Runa', 'Jamal']} />);
    expect(html).toMatch(/<input[^>]*value="Kaelen"/);
    expect(html).toContain('>Runa<');
    expect(html).toContain('>Jamal<');
    expect(html).not.toMatch(/data-acao="confirmar-nome"[^>]*\sdisabled=""/);
  });

  it('nome só com espaços não habilita Continuar', () => {
    const html = renderToStaticMarkup(<NomeStage {...base} nomeAtual="   " sugestoes={[]} />);
    expect(html).toMatch(/data-acao="confirmar-nome"[^>]*\sdisabled=""/);
  });
});
