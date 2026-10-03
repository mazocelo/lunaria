// src/__tests__/wizard/WizardView.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { act, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider } from '../../contexts/theme';
import WizardView from '../../Pages/Personagem/Wizard/wizard.view';
import WizardFooter from '../../Pages/Personagem/Wizard/components/WizardFooter';
import { criarPropsDaView } from './wizardViewFixture';
import { montar, clicar, digitar } from '../helpers/montar';

const render = (el: ReactElement) => renderToStaticMarkup(<ThemeProvider>{el}</ThemeProvider>);

describe('WizardFooter', () => {
  const base = { etapaIndex: 2, etapasTotal: 5, podeContinuar: true, enviando: false, onVoltar: () => {}, isLight: false };

  it('sem onContinuar mostra só Voltar', () => {
    const html = render(<WizardFooter {...base} />);
    expect(html).toContain('data-acao="voltar"');
    expect(html).not.toContain('data-acao="continuar"');
  });

  it('com onContinuar mostra Voltar e Continuar', () => {
    const html = render(<WizardFooter {...base} onContinuar={() => {}} />);
    expect(html).toContain('data-acao="voltar"');
    expect(html).toContain('data-acao="continuar"');
  });
});

describe('WizardView: rodapé (A01)', () => {
  it('etapa legado tem Voltar e não tem Continuar (o chat avança)', () => {
    const html = render(<WizardView {...criarPropsDaView({ etapaAtual: 'background', etapaIndex: 3 })} />);
    expect(html).toContain('data-acao="voltar"');
    expect(html).not.toContain('data-acao="continuar"');
  });

  it('tela nova segue com Voltar e Continuar', () => {
    const html = render(<WizardView {...criarPropsDaView({ etapaAtual: 'raca', etapaIndex: 1 })} />);
    expect(html).toContain('data-acao="voltar"');
    expect(html).toContain('data-acao="continuar"');
  });
});

describe('WizardView: sair do wizard (A03)', () => {
  it('cabeçalho tem Sair avisando que o rascunho fica salvo', () => {
    const html = render(<WizardView {...criarPropsDaView()} />);
    expect(html).toMatch(/data-acao="sair"[^>]*title="[^"]*Seu rascunho fica salvo/);
  });

  it('Sair navega para /personagens', () => {
    const navigate = vi.fn();
    const { container, desmontar } = montar(<ThemeProvider><WizardView {...criarPropsDaView({ navigate })} /></ThemeProvider>);
    clicar(container.querySelector('[data-acao="sair"]'));
    expect(navigate).toHaveBeenCalledWith('/personagens');
    desmontar();
  });
});

describe('WizardView: etapa Nome (A11)', () => {
  const continuar = (c: HTMLElement) => c.querySelector('[data-acao="continuar"]');

  it('sem nome e sem rascunho o Continuar fica desabilitado', () => {
    const html = render(<WizardView {...criarPropsDaView()} />);
    expect(html).toMatch(/data-acao="continuar"[^>]*\sdisabled=""/);
  });

  it('digitar o nome habilita o Continuar, que grava o rascunho e avança', () => {
    const definirNome = vi.fn();
    const avancarComMestre = vi.fn();
    const enviarMensagem = vi.fn();
    const { container, desmontar } = montar(<ThemeProvider><WizardView {...criarPropsDaView({ definirNome, avancarComMestre, enviarMensagem })} /></ThemeProvider>);
    digitar(container.querySelector('#nome-heroi'), '  Kaelen ');
    expect(continuar(container)?.hasAttribute('disabled')).toBe(false);
    clicar(continuar(container));
    expect(definirNome).toHaveBeenCalledWith('Kaelen');
    expect(avancarComMestre).toHaveBeenCalledWith({ nome: 'Kaelen' });
    expect(enviarMensagem).not.toHaveBeenCalled();
    desmontar();
  });

  it('nome já salvo e editado: Continuar usa a edição, não o nome antigo', () => {
    const definirNome = vi.fn();
    const avancarComMestre = vi.fn();
    const { container, desmontar } = montar(<ThemeProvider><WizardView {...criarPropsDaView({ nome: 'Runa', definirNome, avancarComMestre })} /></ThemeProvider>);
    digitar(container.querySelector('#nome-heroi'), 'Runa Vel');
    clicar(continuar(container));
    expect(definirNome).toHaveBeenCalledWith('Runa Vel');
    expect(avancarComMestre).toHaveBeenCalledWith({ nome: 'Runa Vel' });
    desmontar();
  });

  it('Enter no input segue o mesmo caminho do Continuar', () => {
    const avancarComMestre = vi.fn();
    const { container, desmontar } = montar(<ThemeProvider><WizardView {...criarPropsDaView({ nome: 'Runa', definirNome: vi.fn(), avancarComMestre })} /></ThemeProvider>);
    const form = container.querySelector('#nome-heroi')?.closest('form');
    act(() => { form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    expect(avancarComMestre).toHaveBeenCalledWith({ nome: 'Runa' });
    desmontar();
  });
});
