// src/__tests__/wizard/ResultModal.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import WizardCreationResultModal from '../../Pages/Personagem/Wizard/components/WizardCreationResultModal';
import { montar, tecla } from '../helpers/montar';

type Props = Parameters<typeof WizardCreationResultModal>[0];
const props: Props = { open: true, isLight: true, onClose: () => {}, onViewSheet: () => {}, onGoToCharacters: () => {},
  data: { personagem: { id: 1, nome: 'Ayla' }, preview: null, background_final: 'Nasceu na lua.', falhas: ['magias'] } };

describe('WizardCreationResultModal', () => {
  it('é diálogo modal, sem casca wizard-atelier, com aviso de falha', () => {
    const html = renderToStaticMarkup(<WizardCreationResultModal {...props} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toMatch(/aria-labelledby="resultado-titulo"[\s\S]*id="resultado-titulo"/);
    expect(html).not.toContain('wizard-atelier');
    expect(html).not.toMatch(/(?<![\w-])wa-|--wa-|text-slate-|text-white/);
    expect(html).toContain('As magias não foram gravadas');
    expect(html).not.toContain('O retrato não foi salvo');
  });

  it('sem preview (D&D): não mostra seções vazias do Mestre nem o combo', () => {
    const html = renderToStaticMarkup(<WizardCreationResultModal {...props} />);
    expect(html).toContain('Nasceu na lua.');
    expect(html).not.toContain('Primeiras palavras');
    expect(html).not.toContain('Leitura da ficha');
    expect(html).not.toContain('Combo usado');
  });

  it('background indisponível vira frase para o jogador, não jargão', () => {
    const html = renderToStaticMarkup(<WizardCreationResultModal {...props} data={{ ...props.data, falhas: [], background_indisponivel: true }} />);
    expect(html).toContain('O Mestre não conseguiu reescrever sua história; usamos o seu texto.');
    expect(html).not.toContain('Fallback');
  });

  it('foco no primeiro botão ao abrir; Esc fecha', () => {
    const onClose = vi.fn();
    const m = montar(<WizardCreationResultModal {...props} onClose={onClose} />);
    const dialogo = m.container.querySelector('[role="dialog"]');
    expect(dialogo?.contains(document.activeElement)).toBe(true);
    expect(document.activeElement?.tagName).toBe('BUTTON');
    tecla(document, 'Escape');
    expect(onClose).toHaveBeenCalledTimes(1);
    m.desmontar();
  });
});
