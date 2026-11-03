import { describe, it, expect } from 'vitest';
import lunariaEngine from '../game-systems/lunaria/index.js';
import {
  calcularHP as hpHelper,
  calcularMana as manaHelper,
  calcularEsquiva as esquivaHelper,
  calcularArmadura as armaduraHelper,
  calcularAbsorcao as absorcaoHelper,
  getMultRaca,
} from '../helpers/combateHelper.js';
import {
  calcularHP as hpEngine,
  calcularMP as mpEngine,
  calcularEsquiva as esquivaEngine,
  calcularArmadura as armaduraEngine,
  calcularAbsorcao as absorcaoEngine,
} from '../game-systems/lunaria/characterEngine.js';

// Caracteriza a reconciliacao combateHelper <-> characterEngine: o helper
// passou a reexportar do engine, entao as duas vias devem produzir numeros
// identicos para todo shape de personagem.

const personagens = [
  { label: 'N1 Humano', nome: 'Aria', nivel: 1, raca_nome: 'Humano',
    atributos: { forca: 12, destreza: 14, constituicao: 13, inteligencia: 10, agilidade: 11, carisma: 9 } },
  { label: 'N5 Anao', nome: 'Borin', nivel: 5, raca_nome: 'Anão',
    atributos: { forca: 16, destreza: 10, constituicao: 16, inteligencia: 8, agilidade: 9, carisma: 12 } },
  { label: 'N12 Orc', nome: 'Gronak', nivel: 12, raca_nome: 'Orc',
    atributos: { forca: 18, destreza: 12, constituicao: 18, inteligencia: 14, agilidade: 16, carisma: 10 } },
];

const bonusEquip = { esquiva_bonus: 2, esquiva_penalidade: 1, armadura: 3 };

// Snapshot numerico congelado (valores pre-refatoracao).
const ESPERADO = {
  'N1 Humano':  { mult: 5, hp: 10,  mana: 11, esquiva: 6,  armadura: 3, absorcao: 3 },
  'N5 Anao':    { mult: 6, hp: 48,  mana: 17, esquiva: 0,  armadura: 3, absorcao: 4 },
  'N12 Orc':    { mult: 7, hp: 112, mana: 26, esquiva: 22, armadura: 3, absorcao: 5 },
};

describe('reconciliacao characterEngine <-> combateHelper (Lunaria)', () => {
  for (const p of personagens) {
    it(`${p.label}: helper e engine produzem os mesmos numeros`, () => {
      const mult = getMultRaca(p.raca_nome);
      const exp = ESPERADO[p.label];

      expect(mult).toBe(exp.mult);
      expect(hpHelper(p, mult)).toBe(exp.hp);
      expect(hpEngine(p, mult)).toBe(exp.hp);
      expect(manaHelper(p)).toBe(exp.mana);
      expect(mpEngine(p)).toBe(exp.mana);
      expect(esquivaHelper(p, bonusEquip)).toBe(exp.esquiva);
      expect(esquivaEngine(p, bonusEquip)).toBe(exp.esquiva);
      expect(armaduraHelper(bonusEquip)).toBe(exp.armadura);
      expect(armaduraEngine(bonusEquip)).toBe(exp.armadura);
      expect(absorcaoHelper(p.atributos.constituicao, 3)).toBe(exp.absorcao);
      expect(absorcaoEngine(p.atributos.constituicao, 3)).toBe(exp.absorcao);

      const state = lunariaEngine.buildCombatState(p, bonusEquip);
      expect(state.hp_max).toBe(exp.hp);
      expect(state.mana_max).toBe(exp.mana);
      expect(state.esquiva).toBe(exp.esquiva);
      expect(state.armadura).toBe(exp.armadura);
    });
  }

  it('shape atributos_personagem (array): engine le o array igual ao helper', () => {
    const arrShape = {
      nome: 'ArrShape', nivel: 3, raca_nome: 'Elfo',
      atributos_personagem: [
        { nome: 'constituicao', valor: 15 },
        { nome: 'inteligencia', valor: 17 },
        { nome: 'carisma', valor: 8 },
        { nome: 'agilidade', valor: 14 },
        { nome: 'destreza', valor: 13 },
        { nome: 'forca', valor: 11 },
      ],
    };
    const mult = getMultRaca(arrShape.raca_nome);
    expect(hpEngine(arrShape, mult)).toBe(hpHelper(arrShape, mult));
    expect(mpEngine(arrShape)).toBe(manaHelper(arrShape));
    expect(hpEngine(arrShape, mult)).toBe(20);
    expect(mpEngine(arrShape)).toBe(19);
  });
});

describe('getMultRaca: coluna mult_raca primeiro, MULT_RACA_MAP como fallback', () => {
  it('usa a coluna mult_raca da raca carregada', () => {
    expect(getMultRaca({ nome: 'Dwarf', mult_raca: 6 })).toBe(6);
    expect(getMultRaca({ racas: { nome: 'Dwarf', mult_raca: 8 } })).toBe(8);
  });

  it('cai no MULT_RACA_MAP quando so o nome esta disponivel', () => {
    expect(getMultRaca('Anão')).toBe(6);
    expect(getMultRaca({ nome: 'Anão' })).toBe(6);
  });

  it('usa HP_MULT_DEFAULT (5) para raca desconhecida ou vazia', () => {
    expect(getMultRaca('Dwarf')).toBe(5);
    expect(getMultRaca('')).toBe(5);
    expect(getMultRaca(null)).toBe(5);
  });
});
