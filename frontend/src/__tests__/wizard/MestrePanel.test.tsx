// src/__tests__/wizard/MestrePanel.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { act } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import MestrePanel from '../../Pages/Personagem/Wizard/components/MestrePanel';
import type { WizardMessage } from '../../Pages/Personagem/Wizard/hooks/useChatState';
import { montar, clicar } from '../helpers/montar';

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

describe('MestrePanel: conversar não grava nem avança (A14/A15)', () => {
  const enviarPeloForm = (inputTexto: string, etapaAtual: string) => {
    const onEnviar = vi.fn();
    const { container, desmontar } = montar(<MestrePanel {...base} aberto={true} mensagens={[]} etapaAtual={etapaAtual} inputTexto={inputTexto} onEnviar={onEnviar} />);
    act(() => { container.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    desmontar();
    return onEnviar;
  };

  it('texto livre em boas_vindas vai com manterEtapa', () => {
    expect(enviarPeloForm('quero um elfo', 'boas_vindas')).toHaveBeenCalledWith('quero um elfo', { manterEtapa: true });
  });

  it('texto livre em background vai com manterEtapa', () => {
    expect(enviarPeloForm('o que combina com um ladino?', 'background')).toHaveBeenCalledWith('o que combina com um ladino?', { manterEtapa: true });
  });

  it('chips mantêm o comportamento: nome aceita, background envia sem manterEtapa, raça escolhe', () => {
    const onEnviar = vi.fn();
    const onEscolherSugestao = vi.fn();
    const msgs = [{ role: 'mestre', content: 'Opções', sugestoes: [
      { tipo: 'nome', nome: 'Kaelen' }, { tipo: 'background', nome: 'Órfão do porto' }, { tipo: 'raca', id: 3, nome: 'Elfo' },
    ] }] as WizardMessage[];
    const { container, desmontar } = montar(<MestrePanel {...base} aberto={true} mensagens={msgs} onEnviar={onEnviar} onEscolherSugestao={onEscolherSugestao} />);
    clicar(container.querySelector('[data-sugestao="nome"]'));
    clicar(container.querySelector('[data-sugestao="background"]'));
    clicar(container.querySelector('[data-sugestao="raca"]'));
    expect(onEnviar).toHaveBeenNthCalledWith(1, 'Kaelen', { aceitarNome: true });
    expect(onEnviar).toHaveBeenNthCalledWith(2, 'Órfão do porto');
    expect(onEscolherSugestao).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'raca', id: 3 }));
    desmontar();
  });
});
