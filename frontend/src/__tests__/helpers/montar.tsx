// Monta um elemento no jsdom com createRoot + act, para testes de clique/teclado/foco.
import { act, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// O ThemeProvider escuta prefers-color-scheme; o jsdom não implementa matchMedia.
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  }) as MediaQueryList;
}

export function montar(el: ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => { root.render(el); });
  return {
    container,
    rerender: (novo: ReactElement) => act(() => { root.render(novo); }),
    desmontar: () => { act(() => { root.unmount(); }); container.remove(); },
  };
}

export const clicar = (el: Element | null) => {
  if (!el) throw new Error('elemento não encontrado');
  act(() => { (el as HTMLElement).click(); });
};

/** Muda o valor de um input controlado pelo React (dispara o onChange). */
export const digitar = (el: Element | null, valor: string) => {
  if (!el) throw new Error('elemento não encontrado');
  const input = el as HTMLInputElement | HTMLTextAreaElement;
  const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  act(() => {
    Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(input, valor);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
};

export const tecla = (el: EventTarget, key: string) => {
  act(() => { el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })); });
};
