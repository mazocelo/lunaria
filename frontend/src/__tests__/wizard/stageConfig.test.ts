// src/__tests__/wizard/stageConfig.test.ts
import { describe, it, expect } from 'vitest';
import { getSystemStages, getStageConfig } from '../../Pages/Personagem/Wizard/stages/stageConfig';

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
});
