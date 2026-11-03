import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider } from '../../contexts/theme';
import GrimorioBlock from '../../Pages/Personagem/Wizard/components/GrimorioBlock';

const render = (slots: number) => renderToStaticMarkup(
  <ThemeProvider>
    <GrimorioBlock magias={[]} slots={slots} selecionadas={[]} onToggleMagia={() => {}} onRetry={() => {}} loading={false} error={null} isLight={false} />
  </ThemeProvider>,
);

describe('GrimorioBlock sem slots', () => {
  it('classe que não conjura no nível 1 mostra aviso claro, sem "Escolha até 0"', () => {
    const html = render(0);
    expect(html).toContain('Sua classe não conjura magias no nível 1');
    expect(html).not.toContain('Escolha ate 0');
  });
});
