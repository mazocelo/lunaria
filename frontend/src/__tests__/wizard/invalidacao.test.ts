// src/__tests__/wizard/invalidacao.test.ts
import { describe, it, expect } from 'vitest';
import { etapasAfetadas, type Escolhas, type Feitos } from '../../Pages/Personagem/Wizard/stages/invalidacao';

const e: Escolhas = { racaId: 1, classeId: 2, vantagensIds: [7], desvantagensIds: [] };
const tudo: Feitos = { bonusAplicados: true, comboPronto: true, grimorioSelecionado: true, dndAbilitiesConfirmed: true, dndSkillsConfirmed: true, racaDaBonusDnd: true };

describe('etapasAfetadas', () => {
  it('lunaria: raça derruba atributos e equipamentos; classe também magias', () => {
    expect(etapasAfetadas(e, { ...e, racaId: 3 }, tudo, 'lunaria')).toEqual(['atributos', 'equipamentos']);
    expect(etapasAfetadas(e, { ...e, classeId: 9 }, tudo, 'lunaria')).toEqual(['atributos', 'equipamentos', 'grimorio']);
    expect(etapasAfetadas(e, { ...e, vantagensIds: [7, 8] }, tudo, 'lunaria')).toEqual(['atributos', 'equipamentos']);
  });
  it('não lista o que não estava feito', () => {
    expect(etapasAfetadas(e, { ...e, racaId: 3 }, { ...tudo, bonusAplicados: false, comboPronto: false }, 'lunaria')).toEqual([]);
    expect(etapasAfetadas(e, e, tudo, 'lunaria')).toEqual([]);
  });
  it('mesma lista em outro array (ou id como string) não conta como troca', () => {
    expect(etapasAfetadas(e, { ...e, racaId: '1', vantagensIds: ['7'] }, tudo, 'lunaria')).toEqual([]);
  });
  it('dnd5e: classe derruba perícias; raça com bônus derruba atributos', () => {
    expect(etapasAfetadas(e, { ...e, classeId: 9 }, tudo, 'dnd5e')).toEqual(['skills']);
    expect(etapasAfetadas(e, { ...e, racaId: 3 }, tudo, 'dnd5e')).toEqual(['atributos']);
    expect(etapasAfetadas(e, { ...e, racaId: 3 }, { ...tudo, racaDaBonusDnd: false }, 'dnd5e')).toEqual([]);
  });
});
