// src/__tests__/wizard/selecao.test.ts
import { describe, it, expect } from 'vitest';
import { precisaConfirmarTroca } from '../../Pages/Personagem/Wizard/stages/invalidacao';
import { maxPericiasDaClasse } from '../../Pages/Personagem/Wizard/stages/dnd';

describe('precisaConfirmarTroca', () => {
  it('primeira escolha e mesma carta: não', () => {
    expect(precisaConfirmarTroca(false, null, 3, [], 5)).toBe(false);
    expect(precisaConfirmarTroca(true, 3, 3, ['atributos'], 5)).toBe(false);
  });
  it('troca que derruba trabalho ou deixa saldo negativo: sim', () => {
    expect(precisaConfirmarTroca(true, 3, 4, ['atributos'], 2)).toBe(true);
    expect(precisaConfirmarTroca(true, 3, 4, [], -1)).toBe(true);
    expect(precisaConfirmarTroca(true, 3, 4, [], 1)).toBe(false);
  });
  it('primeira escolha que deixa o saldo negativo também pede confirmação (decisão do dono)', () => {
    expect(precisaConfirmarTroca(false, null, 3, [], -2)).toBe(true);
  });
  it('etapa ainda não concluída: trocar sem saldo negativo não pergunta', () => {
    expect(precisaConfirmarTroca(false, 3, 4, ['atributos'], 2)).toBe(false);
  });
});

describe('maxPericiasDaClasse', () => {
  it('lê a quantidade da classe D&D e cai no padrão sem classe', () => {
    expect(maxPericiasDaClasse('fighter')).toBe(2);
    expect(maxPericiasDaClasse('rogue')).toBe(4);
    expect(maxPericiasDaClasse('')).toBeGreaterThan(0);
  });
});
