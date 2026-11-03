import { describe, expect, it } from 'vitest';
import {
  normalizarBonusCombate,
  normalizarElementoPrimario,
  normalizarListaElementos,
  normalizarRequisitos,
  serializarClasseOuRaca,
  serializarHabilidade,
  serializarVantagemOuDesvantagem,
} from '../helpers/catalogJsonHelper.js';

describe('catalogJsonHelper', () => {
  it('normaliza bonus de equipamento legado para armadura canonica', () => {
    expect(normalizarBonusCombate({ ca: 4, ataque: 1 })).toEqual({ ataque: 1, armadura: 4 });
    expect(normalizarBonusCombate({ ca_base: 10 })).toEqual({ armadura: 3 });
  });

  it('normaliza elemento primario e lista de elementos', () => {
    expect(normalizarElementoPrimario('fogo')).toBe('fogo');
    expect(normalizarElementoPrimario(['elétrico', 'fogo'])).toBe('eletrico');
    expect(normalizarListaElementos(['elétrico', 'fogo', 'fogo'])).toEqual(['eletrico', 'fogo']);
  });

  it('serializa bonus de classe/raca com atributos_bonus alias', () => {
    const result = serializarClasseOuRaca({ bonus: '{"forca":"+2","constituicao":1}' });
    expect(result.bonus).toEqual({ forca: 2, constituicao: 1 });
    expect(result.atributos_bonus.forca).toBe(2);
    expect(result.atributos_bonus.constituicao).toBe(1);
  });

  it('serializa habilidade com elementos e pre_requisitos canonicos', () => {
    const result = serializarHabilidade({
      elemento: 'gelo',
      pre_requisito: { nivel_minimo: '5', classe: 'Mago' }
    });
    expect(result.elemento).toBe('gelo');
    expect(result.elementos).toEqual(['gelo']);
    expect(result.pre_requisitos).toEqual({ nivel_minimo: 5, classe: ['Mago'] });
  });

  it('serializa vantagem/desvantagem com usos alias e efeito normalizado', () => {
    const result = serializarVantagemOuDesvantagem({
      usar: 2,
      efeito: { status: 'queimando', duracao: '3', valor: '2' },
      requisitos: { raca: 'Elfo' }
    });
    expect(result.usos).toBe(2);
    expect(result.efeito).toMatchObject({ nome: 'queimando', status: 'queimando', duracao: 3, valor: 2 });
    expect(normalizarRequisitos(result.requisitos)).toEqual({ raca: ['Elfo'] });
  });
});
