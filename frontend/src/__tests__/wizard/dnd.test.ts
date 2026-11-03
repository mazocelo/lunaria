// src/__tests__/wizard/dnd.test.ts
import { describe, it, expect } from 'vitest';
import { bonusRacialDnd } from '../../Pages/Personagem/Wizard/stages/dnd';
import { lerItemCombo } from '../../Pages/Personagem/Wizard/stages/itemCombo';

describe('bonusRacialDnd', () => {
  it('aceita siglas em inglês, português e nomes', () => {
    expect(bonusRacialDnd({ bonus: { DEX: 2, int: '1' } })).toEqual({ DEX: 2, INT: 1 });
    expect(bonusRacialDnd({ atributos_bonus: { forca: 2, sabedoria: 1, carisma: 0 } })).toEqual({ STR: 2, WIS: 1 });
    expect(bonusRacialDnd({ bonus: 'texto' })).toEqual({});
    expect(bonusRacialDnd(null)).toEqual({});
  });

  it('lê bonus.abilityBonuses, formato real das raças D&D do seed (atributos_bonus vem zerado em chaves Lunaria)', () => {
    const elfo = {
      bonus: { abilityBonuses: { DEX: 2 }, traits: ['Darkvision'], speed: 30, size: 'Medium', languages: ['Common', 'Elvish'] },
      atributos_bonus: { forca: 0, destreza: 0, constituicao: 0, inteligencia: 0, agilidade: 0, carisma: 0 },
    };
    expect(bonusRacialDnd(elfo)).toEqual({ DEX: 2 });
    expect(bonusRacialDnd({ bonus: { abilityBonuses: { STR: 1, DEX: 1, CON: 1, INT: 1, WIS: 1, CHA: 1 } } }))
      .toEqual({ STR: 1, DEX: 1, CON: 1, INT: 1, WIS: 1, CHA: 1 });
  });

  it('sem bônus de atributo cadastrado: objeto vazio', () => {
    expect(bonusRacialDnd({ bonus: { traits: ['Lucky'], speed: 25 }, atributos_bonus: { forca: 0, destreza: 0 } })).toEqual({});
  });
});

describe('lerItemCombo', () => {
  it('lê só o que vier, com narrowing', () => {
    expect(lerItemCombo({ nome: 'Espada', raridade: 'raro', tipo: 'arma', dano: '1d8', preco: '15', peso: 3, motivo: 'Combina' }))
      .toEqual({ nome: 'Espada', motivo: 'Combina', raridade: 'raro', tipo: 'arma', dano: '1d8', preco: 15, peso: 3 });
    expect(lerItemCombo({ nome: 'Corda' })).toEqual({ nome: 'Corda', motivo: null, raridade: null, tipo: null, dano: null, preco: null, peso: null });
  });

  it('aceita os nomes do catálogo editável do backend (dano_base, preco_sugerido, peso decimal em texto)', () => {
    expect(lerItemCombo({ nome: 'Arco Curto', categoria: 'Arma', dano_base: '1d6', preco_sugerido: 25, peso: '1.50', raridade: 'Comum' }))
      .toEqual({ nome: 'Arco Curto', motivo: null, raridade: 'Comum', tipo: 'Arma', dano: '1d6', preco: 25, peso: 1.5 });
  });
});
