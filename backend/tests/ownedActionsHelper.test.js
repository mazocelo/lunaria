import { describe, expect, it } from 'vitest';
import {
  getActivatableAdvantages,
  getOwnedCombatActions,
  getOwnedCombatActionList,
} from '../helpers/ownedActionsHelper.js';

describe('ownedActionsHelper', () => {
  describe('getActivatableAdvantages', () => {
    it('retorna vantagens com usos >= 1', () => {
      const personagem = {
        vantagens: [
          { nome: 'Resistência ao Fogo', usar: 2 },
          { nome: 'Visão Noturna', usar: 1 },
        ],
      };
      const result = getActivatableAdvantages(personagem);
      expect(result).toHaveLength(2);
      expect(result[0].nome).toBe('Resistência ao Fogo');
      expect(result[1].nome).toBe('Visão Noturna');
    });

    it('filtra vantagens com zero usos (passivas)', () => {
      const personagem = {
        vantagens: [
          { nome: 'Ativa', usar: 1 },
          { nome: 'Passiva', usar: 0 },
          { nome: 'Também Passiva' },
        ],
      };
      const result = getActivatableAdvantages(personagem);
      expect(result).toHaveLength(1);
      expect(result[0].nome).toBe('Ativa');
    });

    it('reconhece campo usos como alternativa para usar', () => {
      const personagem = {
        vantagens: [
          { nome: 'Vantagem A', usos: 3 },
        ],
      };
      const result = getActivatableAdvantages(personagem);
      expect(result).toHaveLength(1);
      expect(result[0].nome).toBe('Vantagem A');
    });

    it('deduplica vantagens com mesmo nome', () => {
      const personagem = {
        vantagens: [
          { nome: 'Duplicada', usar: 1 },
          { nome: 'Duplicada', usar: 2 },
        ],
      };
      const result = getActivatableAdvantages(personagem);
      expect(result).toHaveLength(1);
    });

    it('deduplica vantagens por id quando disponível', () => {
      const personagem = {
        vantagens: [
          { id: 1, nome: 'Vantagem A', usar: 1 },
          { id: 1, nome: 'Vantagem A Renomeada', usar: 2 },
        ],
      };
      const result = getActivatableAdvantages(personagem);
      expect(result).toHaveLength(1);
      expect(result[0].nome).toBe('Vantagem A');
    });

    it('retorna array vazio quando sem vantagens', () => {
      expect(getActivatableAdvantages({})).toEqual([]);
      expect(getActivatableAdvantages({ vantagens: [] })).toEqual([]);
    });

    it('retorna array vazio para personagem null/undefined', () => {
      expect(() => getActivatableAdvantages(null)).toThrow(TypeError);
      expect(getActivatableAdvantages(undefined)).toEqual([]);
    });

    it('retorna array vazio quando chamado sem argumentos', () => {
      expect(getActivatableAdvantages()).toEqual([]);
    });

    it('trata valor de usos como string numérica', () => {
      const personagem = {
        vantagens: [
          { nome: 'StringUsos', usar: '2' },
        ],
      };
      const result = getActivatableAdvantages(personagem);
      expect(result).toHaveLength(1);
    });

    it('filtra vantagens com valor de usos não numérico', () => {
      const personagem = {
        vantagens: [
          { nome: 'Invalida', usar: 'abc' },
        ],
      };
      const result = getActivatableAdvantages(personagem);
      expect(result).toHaveLength(0);
    });

    it('filtra itens sem nome', () => {
      const personagem = {
        vantagens: [
          { usar: 5 },
          { nome: '', usar: 1 },
          { nome: 'Válida', usar: 1 },
        ],
      };
      const result = getActivatableAdvantages(personagem);
      expect(result).toHaveLength(1);
      expect(result[0].nome).toBe('Válida');
    });
  });

  describe('getOwnedCombatActions', () => {
    it('separa habilidades de magias', () => {
      const personagem = {
        habilidadesClasse: [
          { nome: 'Investida', id: 1 },
        ],
        magias: [
          { nome: 'Bola de Fogo', escola_magia: 'evocação', id: 2 },
        ],
      };
      const result = getOwnedCombatActions(personagem);
      expect(result.habilidades).toHaveLength(1);
      expect(result.habilidades[0].nome).toBe('Investida');
      expect(result.magias).toHaveLength(1);
      expect(result.magias[0].nome).toBe('Bola de Fogo');
    });

    it('inclui vantagensAtivaveis no resultado', () => {
      const personagem = {
        vantagens: [
          { nome: 'Fúria', usar: 2 },
        ],
      };
      const result = getOwnedCombatActions(personagem);
      expect(result.vantagensAtivaveis).toHaveLength(1);
      expect(result.vantagensAtivaveis[0].nome).toBe('Fúria');
    });

    it('classifica vantagem ativável como magia quando tem escola_magia', () => {
      const personagem = {
        vantagens: [
          { nome: 'Sopro de Dragão', usar: 1, escola_magia: 'evocação' },
        ],
      };
      const result = getOwnedCombatActions(personagem);
      expect(result.magias).toHaveLength(1);
      expect(result.magias[0].nome).toBe('Sopro de Dragão');
      expect(result.habilidades).toHaveLength(0);
    });

    it('classifica vantagem ativável como habilidade quando sem escola_magia', () => {
      const personagem = {
        vantagens: [
          { nome: 'Fúria', usar: 1 },
        ],
      };
      const result = getOwnedCombatActions(personagem);
      expect(result.habilidades).toHaveLength(1);
      expect(result.habilidades[0].nome).toBe('Fúria');
      expect(result.magias).toHaveLength(0);
    });

    it('não considera escola_magia "nenhuma" como magia', () => {
      const personagem = {
        habilidadesClasse: [
          { nome: 'Golpe Preciso', escola_magia: 'nenhuma' },
        ],
      };
      const result = getOwnedCombatActions(personagem);
      expect(result.habilidades).toHaveLength(1);
      expect(result.magias).toHaveLength(0);
    });

    it('coleta habilidades de múltiplas fontes', () => {
      const personagem = {
        habilidadesClasse: [{ nome: 'Investida', id: 1 }],
        habilidadesProprias: [{ nome: 'Esquiva', id: 2 }],
        habilidadesConhecidas: [{ nome: 'Contra-ataque', id: 3 }],
        habilidadesAtivas: [{ nome: 'Bloqueio', id: 4 }],
        habilidadesSelecionadas: [{ nome: 'Golpe Giratório', id: 5 }],
      };
      const result = getOwnedCombatActions(personagem);
      expect(result.habilidades).toHaveLength(5);
    });

    it('coleta magias de múltiplas fontes', () => {
      const personagem = {
        magias: [{ nome: 'Bola de Fogo', escola_magia: 'evocação', id: 1 }],
        magiasProprias: [{ nome: 'Cura', escola_magia: 'restauração', id: 2 }],
        magiasConhecidas: [{ nome: 'Escudo Arcano', escola_magia: 'abjuração', id: 3 }],
        magiasPreparadas: [{ nome: 'Raio', escola_magia: 'evocação', id: 4 }],
        magiasAtivas: [{ nome: 'Invisibilidade', escola_magia: 'ilusão', id: 5 }],
        magiasSelecionadas: [{ nome: 'Teleporte', escola_magia: 'conjuração', id: 6 }],
      };
      const result = getOwnedCombatActions(personagem);
      expect(result.magias).toHaveLength(6);
    });

    it('deduplica habilidades com mesmo id', () => {
      const personagem = {
        habilidadesClasse: [{ nome: 'Investida', id: 1 }],
        habilidadesProprias: [{ nome: 'Investida', id: 1 }],
      };
      const result = getOwnedCombatActions(personagem);
      expect(result.habilidades).toHaveLength(1);
    });

    it('deduplica magias com mesmo id', () => {
      const personagem = {
        magias: [{ nome: 'Bola de Fogo', escola_magia: 'evocação', id: 1 }],
        magiasPreparadas: [{ nome: 'Bola de Fogo', escola_magia: 'evocação', id: 1 }],
      };
      const result = getOwnedCombatActions(personagem);
      expect(result.magias).toHaveLength(1);
    });

    it('retorna listas vazias para personagem sem ações', () => {
      const result = getOwnedCombatActions({});
      expect(result.habilidades).toEqual([]);
      expect(result.magias).toEqual([]);
      expect(result.vantagensAtivaveis).toEqual([]);
    });

    it('retorna listas vazias para personagem null/undefined', () => {
      expect(() => getOwnedCombatActions(null)).toThrow(TypeError);

      const resultUndef = getOwnedCombatActions(undefined);
      expect(resultUndef.habilidades).toEqual([]);
    });

    it('retorna listas vazias quando chamado sem argumentos', () => {
      const result = getOwnedCombatActions();
      expect(result.habilidades).toEqual([]);
      expect(result.magias).toEqual([]);
      expect(result.vantagensAtivaveis).toEqual([]);
    });

    it('lida com personagem completo com habilidades, magias e vantagens', () => {
      const personagem = {
        habilidadesClasse: [
          { nome: 'Investida', id: 1 },
          { nome: 'Golpe Duplo', id: 2 },
        ],
        magias: [
          { nome: 'Bola de Fogo', escola_magia: 'evocação', id: 10 },
        ],
        magiasConhecidas: [
          { nome: 'Cura Menor', escola_magia: 'restauração', id: 11 },
        ],
        vantagens: [
          { nome: 'Fúria Berserker', usar: 3 },
          { nome: 'Visão Noturna', usar: 0 },
          { nome: 'Toque Gélido', usar: 1, escola_magia: 'necromancia' },
        ],
      };
      const result = getOwnedCombatActions(personagem);
      // habilidades: Investida, Golpe Duplo, Fúria Berserker
      expect(result.habilidades).toHaveLength(3);
      // magias: Bola de Fogo, Cura Menor, Toque Gélido
      expect(result.magias).toHaveLength(3);
      // vantagensAtivaveis: Fúria Berserker, Toque Gélido
      expect(result.vantagensAtivaveis).toHaveLength(2);
    });
  });

  describe('getOwnedCombatActionList', () => {
    it('retorna lista combinada de habilidades e magias', () => {
      const personagem = {
        habilidadesClasse: [{ nome: 'Investida', id: 1 }],
        magias: [{ nome: 'Bola de Fogo', escola_magia: 'evocação', id: 2 }],
      };
      const result = getOwnedCombatActionList(personagem);
      expect(result).toHaveLength(2);
      const nomes = result.map(r => r.nome);
      expect(nomes).toContain('Investida');
      expect(nomes).toContain('Bola de Fogo');
    });

    it('deduplica ações na lista combinada', () => {
      const personagem = {
        habilidadesClasse: [{ nome: 'Investida', id: 1 }],
        habilidadesProprias: [{ nome: 'Investida', id: 1 }],
      };
      const result = getOwnedCombatActionList(personagem);
      expect(result).toHaveLength(1);
    });

    it('retorna array vazio para personagem sem ações', () => {
      expect(getOwnedCombatActionList({})).toEqual([]);
    });

    it('retorna array vazio para null/undefined', () => {
      expect(() => getOwnedCombatActionList(null)).toThrow(TypeError);
      expect(getOwnedCombatActionList(undefined)).toEqual([]);
    });

    it('retorna array vazio quando chamado sem argumentos', () => {
      expect(getOwnedCombatActionList()).toEqual([]);
    });

    it('inclui vantagens ativáveis na lista combinada', () => {
      const personagem = {
        vantagens: [
          { nome: 'Fúria', usar: 2 },
          { nome: 'Sopro', usar: 1, escola_magia: 'evocação' },
        ],
      };
      const result = getOwnedCombatActionList(personagem);
      expect(result).toHaveLength(2);
      const nomes = result.map(r => r.nome);
      expect(nomes).toContain('Fúria');
      expect(nomes).toContain('Sopro');
    });

    it('não inclui vantagens passivas', () => {
      const personagem = {
        vantagens: [
          { nome: 'Passiva', usar: 0 },
        ],
        habilidadesClasse: [{ nome: 'Investida', id: 1 }],
      };
      const result = getOwnedCombatActionList(personagem);
      expect(result).toHaveLength(1);
      expect(result[0].nome).toBe('Investida');
    });

    it('retorna lista deduplica de personagem complexo', () => {
      const personagem = {
        habilidadesClasse: [
          { nome: 'Investida', id: 1 },
          { nome: 'Bloqueio', id: 2 },
        ],
        habilidadesProprias: [
          { nome: 'Investida', id: 1 },
        ],
        magias: [
          { nome: 'Bola de Fogo', escola_magia: 'evocação', id: 10 },
        ],
        magiasPreparadas: [
          { nome: 'Bola de Fogo', escola_magia: 'evocação', id: 10 },
          { nome: 'Cura', escola_magia: 'restauração', id: 11 },
        ],
        vantagens: [
          { nome: 'Fúria', usar: 1 },
          { nome: 'Visão', usar: 0 },
        ],
      };
      const result = getOwnedCombatActionList(personagem);
      const nomes = result.map(r => r.nome);
      // Investida (deduped), Bloqueio, Fúria (ativável, não-magia) -> habilidades
      // Bola de Fogo (deduped), Cura -> magias
      expect(nomes).toContain('Investida');
      expect(nomes).toContain('Bloqueio');
      expect(nomes).toContain('Fúria');
      expect(nomes).toContain('Bola de Fogo');
      expect(nomes).toContain('Cura');
      expect(nomes).not.toContain('Visão');
      expect(result).toHaveLength(5);
    });
  });
});
