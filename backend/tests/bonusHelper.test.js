import { describe, it, expect } from 'vitest';
import {
  parsearBonusEntidade,
  agregarBonusEquipamentos,
  calcularAtributosEfetivos,
  encontrarMelhorArma,
  validarRequisitosEquipamento,
  calcularBonusTeste,
} from '../helpers/bonusHelper.js';

// ---------------------------------------------------------------------------
// parsearBonusEntidade
// ---------------------------------------------------------------------------
describe('parsearBonusEntidade', () => {
  it('parseia string JSON com valores numericos', () => {
    const result = parsearBonusEntidade('{"forca":2,"inteligencia":3}');
    expect(result.forca).toBe(2);
    expect(result.inteligencia).toBe(3);
    expect(result.carisma).toBe(0);
    expect(result.destreza).toBe(0);
    expect(result.constituicao).toBe(0);
    expect(result.agilidade).toBe(0);
  });

  it('parseia string JSON com valores prefixados por +', () => {
    const result = parsearBonusEntidade('{"forca":"+2","destreza":"+1"}');
    expect(result.forca).toBe(2);
    expect(result.destreza).toBe(1);
  });

  it('parseia objeto direto ao inves de string', () => {
    const result = parsearBonusEntidade({ constituicao: 4, agilidade: 1 });
    expect(result.constituicao).toBe(4);
    expect(result.agilidade).toBe(1);
    expect(result.forca).toBe(0);
  });

  it('retorna zeros para null', () => {
    const result = parsearBonusEntidade(null);
    for (const attr of ['forca', 'inteligencia', 'carisma', 'destreza', 'constituicao', 'agilidade']) {
      expect(result[attr]).toBe(0);
    }
  });

  it('retorna zeros para undefined', () => {
    const result = parsearBonusEntidade(undefined);
    for (const attr of ['forca', 'inteligencia', 'carisma', 'destreza', 'constituicao', 'agilidade']) {
      expect(result[attr]).toBe(0);
    }
  });

  it('retorna zeros para string vazia', () => {
    const result = parsearBonusEntidade('');
    expect(result.forca).toBe(0);
    expect(result.inteligencia).toBe(0);
  });

  it('retorna zeros para string JSON invalida', () => {
    const result = parsearBonusEntidade('{nao e json}');
    expect(result.forca).toBe(0);
    expect(result.inteligencia).toBe(0);
  });

  it('retorna todos os seis atributos', () => {
    const result = parsearBonusEntidade(null);
    const keys = Object.keys(result).sort();
    expect(keys).toEqual(['agilidade', 'carisma', 'constituicao', 'destreza', 'forca', 'inteligencia']);
  });
});

// ---------------------------------------------------------------------------
// agregarBonusEquipamentos
// ---------------------------------------------------------------------------
describe('agregarBonusEquipamentos', () => {
  it('agrega bonus de multiplos equipamentos', () => {
    const equipamentos = [
      { bonus: { ataque: 2, dano: 3 } },
      { bonus: { ataque: 1, armadura: 5 } },
    ];
    const result = agregarBonusEquipamentos(equipamentos);
    expect(result.ataque).toBe(3);
    expect(result.dano).toBe(3);
    expect(result.armadura).toBe(5);
  });

  it('retorna zeros para array vazio', () => {
    const result = agregarBonusEquipamentos([]);
    expect(result).toEqual({ ataque: 0, dano: 0, armadura: 0, esquiva_bonus: 0, esquiva_penalidade: 0 });
  });

  it('retorna zeros para null', () => {
    const result = agregarBonusEquipamentos(null);
    expect(result).toEqual({ ataque: 0, dano: 0, armadura: 0, esquiva_bonus: 0, esquiva_penalidade: 0 });
  });

  it('retorna zeros para undefined', () => {
    const result = agregarBonusEquipamentos(undefined);
    expect(result).toEqual({ ataque: 0, dano: 0, armadura: 0, esquiva_bonus: 0, esquiva_penalidade: 0 });
  });

  it('retorna zeros para valor nao-array', () => {
    const result = agregarBonusEquipamentos('nao e array');
    expect(result).toEqual({ ataque: 0, dano: 0, armadura: 0, esquiva_bonus: 0, esquiva_penalidade: 0 });
  });

  it('ignora equipamentos sem bonus', () => {
    const equipamentos = [
      { nome: 'Escudo Velho' },
      { bonus: { armadura: 3 } },
    ];
    const result = agregarBonusEquipamentos(equipamentos);
    expect(result.armadura).toBe(3);
    expect(result.ataque).toBe(0);
  });

  it('acumula esquiva_bonus e esquiva_penalidade', () => {
    const equipamentos = [
      { bonus: { esquiva_bonus: 2 } },
      { bonus: { esquiva_penalidade: 3 } },
      { bonus: { esquiva_bonus: 1, esquiva_penalidade: 1 } },
    ];
    const result = agregarBonusEquipamentos(equipamentos);
    expect(result.esquiva_bonus).toBe(3);
    expect(result.esquiva_penalidade).toBe(4);
  });

  it('le bonus de equipamentos.bonus como fallback', () => {
    const equipamentos = [
      { equipamentos: { bonus: { ataque: 5 } } },
    ];
    const result = agregarBonusEquipamentos(equipamentos);
    expect(result.ataque).toBe(5);
  });

  it('converte campos legados ca para armadura', () => {
    const equipamentos = [
      { bonus: { ca: 4 } },
    ];
    const result = agregarBonusEquipamentos(equipamentos);
    expect(result.armadura).toBe(4);
  });

  it('converte campos legados ca_base para armadura', () => {
    const equipamentos = [
      { bonus: { ca_base: 10 } },
    ];
    const result = agregarBonusEquipamentos(equipamentos);
    // ca_base * 0.3 floored = 3
    expect(result.armadura).toBe(3);
  });

  it('empilha bonus de muitos equipamentos corretamente', () => {
    const equipamentos = [
      { bonus: { ataque: 1, dano: 1, armadura: 1, esquiva_bonus: 1, esquiva_penalidade: 1 } },
      { bonus: { ataque: 2, dano: 2, armadura: 2, esquiva_bonus: 2, esquiva_penalidade: 2 } },
      { bonus: { ataque: 3, dano: 3, armadura: 3, esquiva_bonus: 3, esquiva_penalidade: 3 } },
    ];
    const result = agregarBonusEquipamentos(equipamentos);
    expect(result.ataque).toBe(6);
    expect(result.dano).toBe(6);
    expect(result.armadura).toBe(6);
    expect(result.esquiva_bonus).toBe(6);
    expect(result.esquiva_penalidade).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// calcularAtributosEfetivos
// ---------------------------------------------------------------------------
describe('calcularAtributosEfetivos', () => {
  it('soma base + bonus raca + bonus classe', () => {
    const personagem = { forca: 14, inteligencia: 12, carisma: 10, destreza: 8, constituicao: 16, agilidade: 11 };
    const bonusRaca = { forca: 2, constituicao: 1 };
    const bonusClasse = { inteligencia: 3 };
    const result = calcularAtributosEfetivos(personagem, bonusRaca, bonusClasse);

    expect(result.forca).toBe(16);         // 14 + 2 + 0
    expect(result.inteligencia).toBe(15);  // 12 + 0 + 3
    expect(result.carisma).toBe(10);       // 10 + 0 + 0
    expect(result.destreza).toBe(8);       // 8 + 0 + 0
    expect(result.constituicao).toBe(17);  // 16 + 1 + 0
    expect(result.agilidade).toBe(11);     // 11 + 0 + 0
  });

  it('usa 10 como valor base padrao quando atributo esta ausente', () => {
    const personagem = {};
    const result = calcularAtributosEfetivos(personagem, null, null);

    for (const attr of ['forca', 'inteligencia', 'carisma', 'destreza', 'constituicao', 'agilidade']) {
      expect(result[attr]).toBe(10);
    }
  });

  it('funciona com bonus raca e classe null', () => {
    const personagem = { forca: 15 };
    const result = calcularAtributosEfetivos(personagem, null, null);
    expect(result.forca).toBe(15);
  });

  it('aceita bonus como string JSON', () => {
    const personagem = { forca: 10 };
    const result = calcularAtributosEfetivos(personagem, '{"forca":3}', '{"forca":2}');
    expect(result.forca).toBe(15); // 10 + 3 + 2
  });

  it('retorna todos os seis atributos mesmo sem bonus', () => {
    const personagem = { forca: 12 };
    const result = calcularAtributosEfetivos(personagem, null, null);
    expect(Object.keys(result).sort()).toEqual(
      ['agilidade', 'carisma', 'constituicao', 'destreza', 'forca', 'inteligencia']
    );
  });

  it('trata bonus negativos corretamente', () => {
    const personagem = { forca: 10 };
    const result = calcularAtributosEfetivos(personagem, { forca: -2 }, { forca: -1 });
    expect(result.forca).toBe(7); // 10 + (-2) + (-1)
  });

  it('combina bonus de raca e classe no mesmo atributo', () => {
    const personagem = { destreza: 14 };
    const result = calcularAtributosEfetivos(personagem, { destreza: 2 }, { destreza: 3 });
    expect(result.destreza).toBe(19); // 14 + 2 + 3
  });
});

// ---------------------------------------------------------------------------
// encontrarMelhorArma
// ---------------------------------------------------------------------------
describe('encontrarMelhorArma', () => {
  it('encontra a arma com maior dano esperado', () => {
    const equipamentos = [
      { dano_base: '1d6' },    // esperado = 3.5
      { dano_base: '2d8' },    // esperado = 9
      { dano_base: '1d10' },   // esperado = 5.5
    ];
    expect(encontrarMelhorArma(equipamentos)).toBe('2d8');
  });

  it('retorna null para array vazio', () => {
    expect(encontrarMelhorArma([])).toBeNull();
  });

  it('retorna null para null', () => {
    expect(encontrarMelhorArma(null)).toBeNull();
  });

  it('retorna null para undefined', () => {
    expect(encontrarMelhorArma(undefined)).toBeNull();
  });

  it('retorna null para valor nao-array', () => {
    expect(encontrarMelhorArma('espada')).toBeNull();
  });

  it('retorna null quando nenhum equipamento tem dano_base', () => {
    const equipamentos = [
      { nome: 'Escudo' },
      { nome: 'Armadura' },
    ];
    expect(encontrarMelhorArma(equipamentos)).toBeNull();
  });

  it('considera modificador positivo na notacao de dano', () => {
    const equipamentos = [
      { dano_base: '1d6+3' },  // esperado = 3.5 + 3 = 6.5
      { dano_base: '1d8' },    // esperado = 4.5
    ];
    expect(encontrarMelhorArma(equipamentos)).toBe('1d6+3');
  });

  it('considera modificador negativo na notacao de dano', () => {
    const equipamentos = [
      { dano_base: '2d6-2' },  // esperado = 7 - 2 = 5
      { dano_base: '1d8' },    // esperado = 4.5
    ];
    expect(encontrarMelhorArma(equipamentos)).toBe('2d6-2');
  });

  it('le dano_base do sub-objeto equipamentos como fallback', () => {
    const equipamentos = [
      { equipamentos: { dano_base: '2d10' } },  // esperado = 11
      { dano_base: '1d6' },                      // esperado = 3.5
    ];
    expect(encontrarMelhorArma(equipamentos)).toBe('2d10');
  });

  it('retorna a unica arma quando so ha uma', () => {
    const equipamentos = [
      { nome: 'Escudo' },
      { dano_base: '1d4' },
    ];
    expect(encontrarMelhorArma(equipamentos)).toBe('1d4');
  });

  it('compara armas com dados diferentes corretamente', () => {
    const equipamentos = [
      { dano_base: '3d4' },    // esperado = 3 * 2.5 = 7.5
      { dano_base: '1d12' },   // esperado = 6.5
    ];
    expect(encontrarMelhorArma(equipamentos)).toBe('3d4');
  });

  it('ignora notacao de dano invalida', () => {
    const equipamentos = [
      { dano_base: 'invalido' },
      { dano_base: '1d8' },
    ];
    expect(encontrarMelhorArma(equipamentos)).toBe('1d8');
  });
});

// ---------------------------------------------------------------------------
// validarRequisitosEquipamento
// ---------------------------------------------------------------------------
describe('validarRequisitosEquipamento', () => {
  it('retorna valido quando nao ha requisitos', () => {
    const result = validarRequisitosEquipamento(null, 'Guerreiro', 'Humano');
    expect(result).toEqual({ valido: true, motivo: null });
  });

  it('retorna valido para requisitos undefined', () => {
    const result = validarRequisitosEquipamento(undefined, 'Guerreiro', 'Humano');
    expect(result).toEqual({ valido: true, motivo: null });
  });

  it('retorna valido para requisitos nao-objeto', () => {
    const result = validarRequisitosEquipamento('string', 'Guerreiro', 'Humano');
    expect(result).toEqual({ valido: true, motivo: null });
  });

  it('retorna valido para objeto vazio', () => {
    const result = validarRequisitosEquipamento({}, 'Guerreiro', 'Humano');
    expect(result).toEqual({ valido: true, motivo: null });
  });

  it('valida classe corretamente quando corresponde', () => {
    const requisitos = { classe: ['Guerreiro', 'Paladino'] };
    const result = validarRequisitosEquipamento(requisitos, 'Guerreiro', 'Humano');
    expect(result.valido).toBe(true);
    expect(result.motivo).toBeNull();
  });

  it('rejeita classe quando nao corresponde', () => {
    const requisitos = { classe: ['Guerreiro', 'Paladino'] };
    const result = validarRequisitosEquipamento(requisitos, 'Mago', 'Humano');
    expect(result.valido).toBe(false);
    expect(result.motivo).toContain('Requer classe');
    expect(result.motivo).toContain('Guerreiro');
  });

  it('valida raca corretamente quando corresponde', () => {
    const requisitos = { raca: ['Elfo', 'Meio-Elfo'] };
    const result = validarRequisitosEquipamento(requisitos, 'Mago', 'Elfo');
    expect(result.valido).toBe(true);
    expect(result.motivo).toBeNull();
  });

  it('rejeita raca quando nao corresponde', () => {
    const requisitos = { raca: ['Elfo'] };
    const result = validarRequisitosEquipamento(requisitos, 'Mago', 'Humano');
    expect(result.valido).toBe(false);
    expect(result.motivo).toContain('raça');
    expect(result.motivo).toContain('Elfo');
  });

  it('validacao e case-insensitive', () => {
    const requisitos = { classe: ['guerreiro'] };
    const result = validarRequisitosEquipamento(requisitos, 'Guerreiro', 'Humano');
    expect(result.valido).toBe(true);
  });

  it('usa correspondencia parcial (includes)', () => {
    const requisitos = { classe: ['Guerr'] };
    const result = validarRequisitosEquipamento(requisitos, 'Guerreiro', 'Humano');
    expect(result.valido).toBe(true);
  });

  it('valida classe e raca juntos - ambos corretos', () => {
    const requisitos = { classe: ['Mago'], raca: ['Elfo'] };
    const result = validarRequisitosEquipamento(requisitos, 'Mago', 'Elfo');
    expect(result.valido).toBe(true);
  });

  it('falha na classe mesmo se raca corresponde', () => {
    const requisitos = { classe: ['Paladino'], raca: ['Elfo'] };
    const result = validarRequisitosEquipamento(requisitos, 'Mago', 'Elfo');
    expect(result.valido).toBe(false);
    expect(result.motivo).toContain('classe');
  });

  it('falha na raca mesmo se classe corresponde', () => {
    const requisitos = { classe: ['Mago'], raca: ['Anao'] };
    const result = validarRequisitosEquipamento(requisitos, 'Mago', 'Elfo');
    expect(result.valido).toBe(false);
    expect(result.motivo).toContain('raça');
  });

  it('ignora requisito de classe quando nao e array', () => {
    const requisitos = { classe: 'Guerreiro' };
    const result = validarRequisitosEquipamento(requisitos, 'Mago', 'Humano');
    // classe nao e array, entao o bloco de validacao nao e executado
    expect(result.valido).toBe(true);
  });

  it('ignora requisito de raca quando nao e array', () => {
    const requisitos = { raca: 'Elfo' };
    const result = validarRequisitosEquipamento(requisitos, 'Mago', 'Humano');
    expect(result.valido).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// calcularBonusTeste
// ---------------------------------------------------------------------------
describe('calcularBonusTeste', () => {
  it('calcula bonus de vantagem para um teste especifico', () => {
    const personagem = {
      vantagens: [
        { nome: 'Olhos de Aguia', bonus: { percepcao: 2 } },
      ],
      desvantagens: [],
    };
    const result = calcularBonusTeste(personagem, 'percepcao', null);
    expect(result.bonusTotal).toBe(2);
    expect(result.detalhes).toEqual([{ fonte: 'Olhos de Aguia', valor: 2 }]);
  });

  it('calcula penalidade de desvantagem', () => {
    const personagem = {
      vantagens: [],
      desvantagens: [
        { nome: 'Cegueira Parcial', bonus: { percepcao: -3 } },
      ],
    };
    const result = calcularBonusTeste(personagem, 'percepcao', null);
    expect(result.bonusTotal).toBe(-3);
    expect(result.detalhes).toHaveLength(1);
    expect(result.detalhes[0].fonte).toBe('Cegueira Parcial');
  });

  it('combina vantagens e desvantagens', () => {
    const personagem = {
      vantagens: [
        { nome: 'Olhos de Aguia', bonus: { percepcao: 2 } },
      ],
      desvantagens: [
        { nome: 'Cegueira Parcial', bonus: { percepcao: -3 } },
      ],
    };
    const result = calcularBonusTeste(personagem, 'percepcao', null);
    expect(result.bonusTotal).toBe(-1); // 2 + (-3)
    expect(result.detalhes).toHaveLength(2);
  });

  it('retorna zero quando nao ha vantagens nem desvantagens', () => {
    const personagem = {};
    const result = calcularBonusTeste(personagem, 'percepcao', null);
    expect(result.bonusTotal).toBe(0);
    expect(result.detalhes).toEqual([]);
  });

  it('retorna zero quando nao ha bonus relevante', () => {
    const personagem = {
      vantagens: [
        { nome: 'Forte', bonus: { forca: 2 } },
      ],
      desvantagens: [],
    };
    const result = calcularBonusTeste(personagem, 'percepcao', null);
    expect(result.bonusTotal).toBe(0);
    expect(result.detalhes).toEqual([]);
  });

  it('ignora itens sem campo bonus', () => {
    const personagem = {
      vantagens: [
        { nome: 'Sortudo' },
      ],
      desvantagens: [
        { nome: 'Azarado' },
      ],
    };
    const result = calcularBonusTeste(personagem, 'sorte', null);
    expect(result.bonusTotal).toBe(0);
    expect(result.detalhes).toEqual([]);
  });

  it('ignora itens com bonus nao-objeto', () => {
    const personagem = {
      vantagens: [
        { nome: 'Invalido', bonus: 'nao e objeto' },
      ],
      desvantagens: [],
    };
    const result = calcularBonusTeste(personagem, 'percepcao', null);
    expect(result.bonusTotal).toBe(0);
  });

  it('corresponde pelo atributo do teste quando fornecido', () => {
    const personagem = {
      vantagens: [
        { nome: 'Musculoso', bonus: { forca: 3 } },
      ],
      desvantagens: [],
    };
    const result = calcularBonusTeste(personagem, 'levantar peso', 'forca');
    expect(result.bonusTotal).toBe(3);
    expect(result.detalhes[0].fonte).toBe('Musculoso');
  });

  it('normaliza acentos na comparacao', () => {
    const personagem = {
      vantagens: [
        { nome: 'Visao Noturna', bonus: { percepção: 2 } },
      ],
      desvantagens: [],
    };
    const result = calcularBonusTeste(personagem, 'percepcao', null);
    expect(result.bonusTotal).toBe(2);
  });

  it('comparacao e case-insensitive', () => {
    const personagem = {
      vantagens: [
        { nome: 'Agil', bonus: { Destreza: 2 } },
      ],
      desvantagens: [],
    };
    const result = calcularBonusTeste(personagem, 'destreza', null);
    expect(result.bonusTotal).toBe(2);
  });

  it('remove prefixo penalidade_ da chave do bonus', () => {
    const personagem = {
      vantagens: [],
      desvantagens: [
        { nome: 'Desajeitado', bonus: { penalidade_destreza: -2 } },
      ],
    };
    const result = calcularBonusTeste(personagem, 'destreza', null);
    expect(result.bonusTotal).toBe(-2);
    expect(result.detalhes[0].fonte).toBe('Desajeitado');
  });

  it('ignora valores zero no bonus', () => {
    const personagem = {
      vantagens: [
        { nome: 'Neutro', bonus: { percepcao: 0 } },
      ],
      desvantagens: [],
    };
    const result = calcularBonusTeste(personagem, 'percepcao', null);
    expect(result.bonusTotal).toBe(0);
    expect(result.detalhes).toEqual([]);
  });

  it('acumula multiplos bonus do mesmo tipo', () => {
    const personagem = {
      vantagens: [
        { nome: 'Olhos de Aguia', bonus: { percepcao: 2 } },
        { nome: 'Sentidos Aguados', bonus: { percepcao: 1 } },
      ],
      desvantagens: [],
    };
    const result = calcularBonusTeste(personagem, 'percepcao', null);
    expect(result.bonusTotal).toBe(3);
    expect(result.detalhes).toHaveLength(2);
  });

  it('corresponde tanto por nomeTeste quanto por atributoDoTeste', () => {
    const personagem = {
      vantagens: [
        { nome: 'A', bonus: { atletismo: 1 } },
        { nome: 'B', bonus: { forca: 2 } },
      ],
      desvantagens: [],
    };
    const result = calcularBonusTeste(personagem, 'atletismo', 'forca');
    expect(result.bonusTotal).toBe(3); // 1 (atletismo) + 2 (forca)
    expect(result.detalhes).toHaveLength(2);
  });

  it('trata personagem com arrays vantagens e desvantagens ausentes', () => {
    const personagem = { nome: 'Heroi' };
    const result = calcularBonusTeste(personagem, 'forca', null);
    expect(result.bonusTotal).toBe(0);
    expect(result.detalhes).toEqual([]);
  });
});
