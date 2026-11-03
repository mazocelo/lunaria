// src/__tests__/wizard/stageConfig.test.ts
import { describe, it, expect } from 'vitest';
import { getSystemStages, getStageConfig } from '../../Pages/Personagem/Wizard/stages/stageConfig';
import { getProgressItems, getStageTooltip } from '../../Pages/Personagem/Wizard/stages/stageSelectors';

describe('stageConfig: vocabulário do app', () => {
  it('etapas do sistema lunaria usam os nomes do app', () => {
    const labels = getSystemStages('lunaria').stages.map((s) => s.label);
    expect(labels).toEqual([
      'Nome', 'Raça', 'Classe', 'Background', 'Desvantagens', 'Vantagens',
      'Atributos', 'Equipamentos', 'Magias', 'Finalizar',
    ]);
  });

  it('etapas do sistema dnd5e usam os nomes do app', () => {
    const labels = getSystemStages('dnd5e').stages.map((s) => s.label);
    expect(labels).toEqual(['Nome', 'Raça', 'Classe', 'Antecedente', 'Atributos', 'Perícias', 'Finalizar']);
  });

  it('toda etapa de lunaria e dnd5e tem flavor curto e title igual ao label', () => {
    for (const sistema of ['lunaria', 'dnd5e']) {
      for (const s of getSystemStages(sistema).stages) {
        expect(s.flavor.length).toBeGreaterThan(10);
        expect(s.flavor.length).toBeLessThan(80);
        expect(s.title).toBe(s.label);
      }
    }
  });

  it('flavor da raça é a frase da spec', () => {
    expect(getStageConfig('raca', 'lunaria').flavor).toBe('A linhagem que molda o seu herói.');
  });

  it('progressLabel de lunaria e dnd5e é o próprio nome da etapa (Finalizar fica fora)', () => {
    for (const sistema of ['lunaria', 'dnd5e']) {
      for (const s of getSystemStages(sistema).stages) {
        expect(s.progressLabel).toBe(s.id === 'resumo' ? null : s.label);
      }
    }
    expect(getProgressItems({}, 'lunaria').map((i) => i.label)).toEqual([
      'Nome', 'Raça', 'Classe', 'Background', 'Desvantagens', 'Vantagens', 'Atributos', 'Equipamentos', 'Magias',
    ]);
  });
});

describe('stageSelectors: pendências no vocabulário do app', () => {
  const vazio = { vantagensIds: [], desvantagensIds: [] };

  it('lunaria não usa mais Linhagem/Vocação/Origem/Marcas/Dons/Arsenal', () => {
    const textos = ['boas_vindas', 'raca', 'classe', 'background', 'desvantagens', 'vantagens', 'atributos', 'equipamentos', 'grimorio', 'resumo']
      .map((id) => getStageTooltip(id, vazio, 'lunaria'));
    expect(textos).toEqual([
      'Nome pendente', 'Raça pendente', 'Classe pendente', 'Background pendente', 'Desvantagens pendentes',
      'Vantagens pendentes', 'Atributos pendentes', 'Equipamentos pendentes', 'Magias pendentes', 'Em preparo',
    ]);
    expect(getStageTooltip('vantagens', { vantagensIds: [1, 2] }, 'lunaria')).toBe('2 vantagens escolhidas');
    expect(getStageTooltip('desvantagens', { desvantagensIds: [7] }, 'lunaria')).toBe('1 desvantagem escolhida');
  });

  it('dnd5e acentua Raça e Perícias', () => {
    expect(getStageTooltip('raca', vazio, 'dnd5e')).toBe('Raça pendente');
    expect(getStageTooltip('skills', vazio, 'dnd5e')).toBe('Perícias pendentes');
    expect(getStageTooltip('skills', { dndSkillsConfirmed: true }, 'dnd5e')).toBe('Perícias confirmadas');
  });
});
