// src/__tests__/wizard/ConfirmDialog.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { act } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConfirmDialog } from '../../components/shared';
import { montar, clicar, tecla } from '../helpers/montar';

const base = { aberto: true, titulo: 'Trocar a raça?', itens: ['Atributos', 'Equipamentos'], rotuloConfirmar: 'Trocar e refazer', onConfirmar: () => {}, onCancelar: () => {} };

describe('ConfirmDialog', () => {
  it('é um alertdialog modal com título, lista do que será refeito e dois botões', () => {
    const html = renderToStaticMarkup(<ConfirmDialog {...base} />);
    expect(html).toContain('role="alertdialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('Trocar a raça?');
    expect(html).toContain('<li>Atributos</li>');
    expect(html).toContain('data-acao="confirmar"');
    expect(html).toContain('data-acao="cancelar"');
    expect(html).toContain('focus-visible:ring-2');
  });

  it('fechado não renderiza nada', () => {
    expect(renderToStaticMarkup(<ConfirmDialog {...base} aberto={false} />)).toBe('');
  });

  it('abre com foco em Cancelar; Esc cancela; os botões chamam os callbacks', () => {
    const onCancelar = vi.fn();
    const onConfirmar = vi.fn();
    const m = montar(<ConfirmDialog {...base} onCancelar={onCancelar} onConfirmar={onConfirmar} />);
    expect(document.activeElement?.getAttribute('data-acao')).toBe('cancelar');
    tecla(document, 'Escape');
    expect(onCancelar).toHaveBeenCalledTimes(1);
    clicar(m.container.querySelector('[data-acao="confirmar"]'));
    expect(onConfirmar).toHaveBeenCalledTimes(1);
    m.desmontar();
  });

  it('Tab fica preso dentro do diálogo', () => {
    const m = montar(<ConfirmDialog {...base} />);
    const cancelar = m.container.querySelector<HTMLElement>('[data-acao="cancelar"]');
    const confirmar = m.container.querySelector<HTMLElement>('[data-acao="confirmar"]');
    act(() => { confirmar?.focus(); });
    tecla(document, 'Tab');
    expect(document.activeElement).toBe(cancelar);
    act(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true })); });
    expect(document.activeElement).toBe(confirmar);
    m.desmontar();
  });

  it('re-render do pai não rouba o foco, e fechar devolve o foco a quem abriu', () => {
    const gatilho = document.createElement('button');
    document.body.appendChild(gatilho);
    gatilho.focus();
    const m = montar(<ConfirmDialog {...base} onCancelar={() => {}} />);
    const confirmar = m.container.querySelector<HTMLElement>('[data-acao="confirmar"]');
    act(() => { confirmar?.focus(); });
    // callback novo a cada render (arrow inline no pai) não pode refazer o efeito de foco
    m.rerender(<ConfirmDialog {...base} onCancelar={() => {}} />);
    expect(document.activeElement).toBe(confirmar);
    m.rerender(<ConfirmDialog {...base} aberto={false} />);
    expect(document.activeElement).toBe(gatilho);
    m.desmontar();
    gatilho.remove();
  });
});
