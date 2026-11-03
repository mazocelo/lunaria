// src/__tests__/wizard/BlocosRestilizados.test.tsx
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import EquipamentosBlock from '../../Pages/Personagem/Wizard/components/EquipamentosBlock';
import GrimorioBlock from '../../Pages/Personagem/Wizard/components/GrimorioBlock';
import DnDAbilityScoreBlock from '../../Pages/Personagem/Wizard/components/DnDAbilityScoreBlock';
import DnDSkillsBlock from '../../Pages/Personagem/Wizard/components/DnDSkillsBlock';

/** HTML estático sem os `<!-- -->` que o React põe entre nós de texto vizinhos. */
const render = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el).replace(/<!-- -->/g, '');

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

describe('blocos sem botão próprio (ação no rodapé)', () => {
  it('Grimório: sem Confirmar, erro com Tentar de novo', () => {
    const html = render(<GrimorioBlock magias={[]} slots={2} selecionadas={[]} error="falhou" onRetry={() => {}} isLight={false} />);
    expect(html).not.toContain('Confirmar magias');
    expect(html).toMatch(/role="alert"[\s\S]*Tentar de novo/);
  });
  it('Grimório: lista sem Confirmar, contador de slots com role="status", sem mono', () => {
    const html = render(
      <GrimorioBlock magias={[{ id: 1, nome: 'Mísseis Mágicos', escola_magia: 'evocacao', nivel: 1, custo_mana: 2 }]} slots={2} selecionadas={[]} isLight={false} />,
    );
    expect(html).toContain('Mísseis Mágicos');
    expect(html).not.toContain('Confirmar magias');
    expect(html).toMatch(/role="status"[^>]*>[\s\S]*?0 de 2 slots/);
    expect(html).not.toContain('font-mono');
  });
  it('Equipamentos: sem Confirmar e continuar; erro com role="alert" e Tentar de novo', () => {
    const html = render(<EquipamentosBlock loading={false} data={null} error="O combo falhou" onRetry={() => {}} isLight={false} />);
    expect(html).not.toContain('Confirmar e continuar');
    expect(html).toMatch(/role="alert"[\s\S]*O combo falhou[\s\S]*Tentar de novo/);
  });
  it('Equipamentos: item com raridade, tipo, dano, preço e peso vindos do catálogo editável', () => {
    const data = {
      combo: { equipamentos: [{ id: 3, nome: 'Espada Longa', motivo: 'Combina com o guerreiro' }] },
      catalogo_editavel: { equipamentos: [{ id: 3, nome: 'Espada Longa', raridade: 'Raro', categoria: 'Arma', dano_base: '1d8', preco_sugerido: 15, peso: '3.00' }] },
    };
    const html = render(<EquipamentosBlock loading={false} data={data} isLight={false} />);
    expect(html).toContain('Espada Longa');
    expect(html).toContain('Combina com o guerreiro');
    expect(html).toContain('Raro');
    expect(html).toMatch(/Tipo[\s\S]*Arma/);
    expect(html).toMatch(/Dano[\s\S]*1d8/);
    expect(html).toMatch(/Preço[\s\S]*15/);
    expect(html).toMatch(/Peso[\s\S]*3/);
    expect(html).not.toContain('Inventario<');
    expect(html).not.toContain('Confirmar e continuar');
  });
  it('D&D atributos: sem botão de confirmar; contador com role="status"', () => {
    const html = render(<DnDAbilityScoreBlock scores={{}} racialBonuses={{ DEX: 2 }} onSetScore={() => {}} confirmado={false} isLight={false} />);
    expect(html).not.toContain('Confirmar atributos');
    expect(html).toMatch(/role="status"[^>]*>[\s\S]*?0 \/ 6/);
    expect(html).not.toContain('não traz bônus de atributo');
  });
  it('D&D atributos: raça sem bônus cadastrado avisa', () => {
    const html = render(<DnDAbilityScoreBlock scores={{}} racialBonuses={{}} onSetScore={() => {}} confirmado={false} isLight={false} />);
    expect(html).toContain('Esta raça não traz bônus de atributo cadastrado; o valor final mostrado é o da distribuição.');
  });
  it('D&D atributos: confirmado mostra Editar', () => {
    const html = render(<DnDAbilityScoreBlock scores={{}} racialBonuses={{}} onSetScore={() => {}} onEditar={() => {}} confirmado isLight={false} />);
    expect(html).toContain('Editar atributos');
    expect(html).not.toContain('Confirmar atributos');
  });
  it('D&D perícias: sem botão de confirmar; contador com role="status"; motivo com acento', () => {
    const html = render(<DnDSkillsBlock selecionadas={[]} classeNome="wizard" abilityScores={{}} onToggle={() => {}} confirmado={false} isLight={false} />);
    expect(html).not.toMatch(/Confirmar per[ií]cias/);
    expect(html).toMatch(/role="status"[^>]*>[\s\S]*?0\/2/);
    expect(html).toContain('Perícia indisponível para esta classe');
  });
  it('D&D perícias: confirmado mostra Editar', () => {
    const html = render(<DnDSkillsBlock selecionadas={['athletics']} classeNome="fighter" abilityScores={{}} onToggle={() => {}} onEditar={() => {}} confirmado isLight={false} />);
    expect(html).toContain('Editar perícias');
  });
});
