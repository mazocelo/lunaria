// src/__tests__/wizard/MestrePanel.test.tsx
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MestrePanel from '../../Pages/Personagem/Wizard/components/MestrePanel';
import type { WizardMessage } from '../../Pages/Personagem/Wizard/hooks/useChatState';

const mensagens: WizardMessage[] = [
  { role: 'mestre', content: 'Diga-me o nome do herói.', sugestoes: [{ tipo: 'nome', nome: 'Kaelen' }, { tipo: 'nome', nome: 'Runa' }] },
] as WizardMessage[];

const base = {
  onFechar: () => {}, enviando: false, inputTexto: '', setInputTexto: () => {},
  etapaAtual: 'boas_vindas', sistema: 'lunaria', onEnviar: () => {}, onEscolherSugestao: () => {}, isLight: false,
};

describe('MestrePanel', () => {
  it('fechado não renderiza o painel', () => {
    expect(renderToStaticMarkup(<MestrePanel {...base} aberto={false} mensagens={mensagens} />)).toBe('');
  });

  it('aberto mostra a mensagem, os chips de nome e o botão Mais sugestões', () => {
    const html = renderToStaticMarkup(<MestrePanel {...base} aberto={true} mensagens={mensagens} />);
    expect(html).toContain('Mestre Criador');
    expect(html).toContain('Diga-me o nome do herói.');
    expect(html).toContain('>Kaelen<');
    expect(html).toContain('>Runa<');
    expect(html).toContain('Mais sugestões');
    expect(html).toContain('role="dialog"');
  });

  it('enviando desabilita chips, input e botão', () => {
    const html = renderToStaticMarkup(<MestrePanel {...base} aberto={true} mensagens={mensagens} enviando={true} />);
    expect(html).toMatch(/data-sugestao="nome"[^>]*\sdisabled=""/);
    expect(html).toMatch(/<textarea[^>]*\sdisabled=""/);
    expect(html).toMatch(/data-acao="enviar-mestre"[^>]*\sdisabled=""/);
  });

  it('sem mensagens mostra estado vazio', () => {
    const html = renderToStaticMarkup(<MestrePanel {...base} aberto={true} mensagens={[]} />);
    expect(html).toContain('O Mestre ainda não falou');
  });
});
