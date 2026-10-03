// src/__tests__/wizard/WizardChatPonte.test.tsx
// Ponte temporária (Task 15 → Task 20): sem botão nos blocos, o dock do WizardChat segura a ação.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import WizardChat from '../../Pages/Personagem/Wizard/components/WizardChat';

type Props = Parameters<typeof WizardChat>[0];
const noop = () => {};
const base = {
  mensagens: [], inputTexto: '', setInputTexto: noop, enviando: false, onEnviar: noop, onSelecionarSugestao: noop,
  vantagensIds: [], desvantagensIds: [], isLight: false, chatEndRef: { current: null },
} as unknown as Props;
const render = (p: Partial<Props>) => renderToStaticMarkup(<WizardChat {...base} {...p} />).replace(/<!-- -->/g, '');
const desabilitado = (rotulo: string) => new RegExp(`data-acao="continuar"\\sdisabled=""[^>]*>(?:(?!</button>)[\\s\\S])*${rotulo.replace(/[()/]/g, '\\$&')}`);

describe('WizardChat: ação no dock enquanto a view não migra', () => {
  it('D&D atributos: Confirmar atributos (0/6) desabilitado', () => {
    const html = render({ etapaAtual: 'atributos', sistema: 'dnd5e', isDnd5e: true } as Partial<Props>);
    expect(html).toMatch(desabilitado('Confirmar atributos (0/6)'));
  });
  it('D&D perícias: guerreiro com 2 escolhidas habilita Confirmar perícias (2/2)', () => {
    const html = render({ etapaAtual: 'skills', sistema: 'dnd5e', isDnd5e: true, classeNome: 'fighter', dndSkillProficiencies: ['athletics', 'perception'] } as Partial<Props>);
    expect(html).toContain('Confirmar perícias (2/2)');
    expect(html).not.toMatch(desabilitado('Confirmar perícias'));
  });
  it('Equipamentos e Grimório: ação presente e travada sem dados', () => {
    expect(render({ etapaAtual: 'equipamentos', sistema: 'lunaria', comboPreviewLoading: true } as Partial<Props>)).toMatch(desabilitado('Continuar'));
    expect(render({ etapaAtual: 'grimorio', sistema: 'lunaria', grimorioSlots: 2 } as Partial<Props>)).toMatch(desabilitado('Confirmar magias (0/2)'));
  });
});
