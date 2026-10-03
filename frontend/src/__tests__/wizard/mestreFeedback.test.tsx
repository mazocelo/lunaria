// src/__tests__/wizard/mestreFeedback.test.tsx
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { falaDeRecusa, avisoDeFalha } from '../../Pages/Personagem/Wizard/stages/mestreFeedback';
import MestrePensando from '../../Pages/Personagem/Wizard/components/MestrePensando';
import type { WizardMessage } from '../../Pages/Personagem/Wizard/hooks/useChatState';

const antes: WizardMessage[] = [{ role: 'mestre', content: 'Escolha sua raça.', etapa: 'raca' }];

describe('falaDeRecusa (A06)', () => {
  const tentativa = { etapa: 'raca', qtdMensagens: antes.length };

  it('sem tentativa não há recusa', () => {
    expect(falaDeRecusa(null, 'raca', false, antes)).toBeNull();
  });

  it('enquanto o Mestre pensa ainda não é recusa', () => {
    const depois = [...antes, { role: 'mestre', content: 'Ainda não.', etapa: 'raca' }];
    expect(falaDeRecusa(tentativa, 'raca', true, depois)).toBeNull();
  });

  it('respondeu e a etapa não mudou: devolve a fala nova do Mestre', () => {
    const depois = [...antes, { role: 'mestre', content: 'Esse elfo não cabe no orçamento.', etapa: 'raca' }];
    expect(falaDeRecusa(tentativa, 'raca', false, depois)?.content).toBe('Esse elfo não cabe no orçamento.');
  });

  it('etapa mudou: não é recusa', () => {
    const depois = [...antes, { role: 'mestre', content: 'Agora a classe.', etapa: 'classe' }];
    expect(falaDeRecusa(tentativa, 'classe', false, depois)).toBeNull();
  });

  it('sem fala nova do Mestre (ex.: erro de rede) não inventa recusa', () => {
    expect(falaDeRecusa(tentativa, 'raca', false, antes)).toBeNull();
  });
});

describe('avisoDeFalha (A07)', () => {
  it('última mensagem de sistema marcada como falha, na etapa atual: avisa', () => {
    const msgs = [...antes, { role: 'sistema', content: 'Nao foi possivel contatar o Mestre Criador.', etapa: 'classe', falha: true }];
    expect(avisoDeFalha(msgs, 'classe')).not.toBeNull();
  });

  it('mensagem de sistema que não é falha (rascunho restaurado) não avisa', () => {
    const msgs = [{ role: 'sistema', content: '**Rascunho restaurado.**', etapa: 'raca' }];
    expect(avisoDeFalha(msgs, 'raca')).toBeNull();
  });

  it('falha de outra etapa não avisa nesta', () => {
    const msgs = [{ role: 'sistema', content: 'falhou', etapa: 'classe', falha: true }];
    expect(avisoDeFalha(msgs, 'raca')).toBeNull();
  });

  it('se o Mestre falou depois da falha, não avisa mais', () => {
    const msgs = [{ role: 'sistema', content: 'falhou', etapa: 'raca', falha: true }, { role: 'mestre', content: 'Voltei.', etapa: 'raca' }];
    expect(avisoDeFalha(msgs, 'raca')).toBeNull();
  });
});

describe('MestrePensando (A10/M2)', () => {
  it('é uma região viva com o texto do Mestre pensando', () => {
    const html = renderToStaticMarkup(<MestrePensando isLight={false} />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('O Mestre está pensando…');
  });
});
