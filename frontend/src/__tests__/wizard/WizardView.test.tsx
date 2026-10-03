// src/__tests__/wizard/WizardView.test.tsx
import { describe, it, expect } from 'vitest';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider } from '../../contexts/theme';
import WizardView from '../../Pages/Personagem/Wizard/wizard.view';
import WizardFooter from '../../Pages/Personagem/Wizard/components/WizardFooter';
import { criarPropsDaView } from './wizardViewFixture';

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
