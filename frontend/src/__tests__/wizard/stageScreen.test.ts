import { describe, it, expect } from 'vitest';
import { telaDaEtapa } from '../../Pages/Personagem/Wizard/stages/stageScreen';

describe('telaDaEtapa', () => {
  it('mapeia as etapas migradas na Fase 1', () => {
    expect(telaDaEtapa('boas_vindas', 'lunaria')).toBe('nome');
    expect(telaDaEtapa('raca', 'lunaria')).toBe('catalogo-raca');
    expect(telaDaEtapa('classe', 'dnd5e')).toBe('catalogo-classe');
  });
  it('todo o resto cai no adaptador legado', () => {
    for (const id of ['background', 'desvantagens', 'vantagens', 'atributos', 'equipamentos', 'grimorio', 'skills', 'resumo', 'inexistente']) {
      expect(telaDaEtapa(id, 'lunaria')).toBe('legado');
    }
  });
});
