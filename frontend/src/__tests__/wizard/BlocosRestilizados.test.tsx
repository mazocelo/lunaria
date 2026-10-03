// src/__tests__/wizard/BlocosRestilizados.test.tsx
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import EquipamentosBlock from '../../Pages/Personagem/Wizard/components/EquipamentosBlock';
import GrimorioBlock from '../../Pages/Personagem/Wizard/components/GrimorioBlock';

/** HTML estático sem os `<!-- -->` que o React põe entre nós de texto vizinhos. */
const render = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el).replace(/<!-- -->/g, '');

/** Botão desabilitado cujo texto contém o rótulo (disabled vem antes de className nos blocos). */
const desabilitado = (rotulo: string) => new RegExp(`\\sdisabled=""[^>]*>(?:(?!</button>)[\\s\\S])*${rotulo.replace(/[()/]/g, '\\$&')}`);

describe('EquipamentosBlock', () => {
  it('carregando: spinner e nenhuma classe wa-', () => {
    const html = render(<EquipamentosBlock loading data={null} isLight={false} />);
    expect(html).toContain('animate-spin');
    expect(html).not.toMatch(/(?<![\w-])wa-/);
  });

  it('erro aparece com o texto do modelo', () => {
    const html = render(<EquipamentosBlock loading={false} data={null} error="O combo falhou" onRetry={() => {}} isLight={false} />);
    expect(html).toContain('O combo falhou');
    expect(html).not.toMatch(/(?<![\w-])wa-/);
  });
});

describe('GrimorioBlock', () => {
  it('sem magia escolhida: Confirmar magias desabilitado', () => {
    const html = render(
      <GrimorioBlock magias={[{ id: 1, nome: 'Mísseis Mágicos', escola_magia: 'evocacao', nivel: 1, custo_mana: 2 }]} slots={2} selecionadas={[]} onContinuar={() => {}} isLight={false} />,
    );
    expect(html).toContain('Mísseis Mágicos');
    expect(html).toMatch(desabilitado('Confirmar magias (0/2)'));
    expect(html).not.toContain('font-mono');
    expect(html).not.toMatch(/(?<![\w-])wa-/);
  });
});
