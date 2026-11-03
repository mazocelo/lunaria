import { describe, expect, it } from 'vitest';
import {
  getActivatableAdvantages,
  getOwnedCombatActions,
  getOwnedCombatActionList,
  isSpellAction,
} from '../helpers/ownedActionsHelper.js';

/**
 * Contrato novo (Fase 3.4): getOwnedCombatActions resolve magias/habilidades pelo
 * VÍNCULO REAL — hm_personagem (Lunaria/D&D) ou personagem_magia_tresdet (3D&T) —
 * delegando ao contrato de engine getMagiasConhecidas. As fixtures abaixo simulam
 * esse vínculo via um `db` fake; o helper nunca lê campos JSON soltos do snapshot.
 */

/** db fake para Lunaria/D&D: hm_personagem JOIN habilidades_magias. */
function fakeDbHm(vinculos = []) {
  return {
    HmPersonagem: {
      findByPersonagem: async () => vinculos,
    },
  };
}

/** db fake para 3D&T: personagem_magia_tresdet JOIN magias_tresdet. */
function fakeDbTresdet(vinculos = []) {
  return {
    Personagem: {
      listarMagiasTresDet: async () => vinculos,
    },
  };
}

function vinculoHm({ id, nome, escola_magia = null, custo_mana = 0, origem = 'criacao', sistema = 'lunaria' }) {
  return {
    habilidade_id: id,
    origem,
    habilidades_magias: { id, nome, escola_magia, custo_mana, sistema, nivel_requerido: 1 },
  };
}

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
      const personagem = { vantagens: [{ nome: 'Vantagem A', usos: 3 }] };
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
      expect(getActivatableAdvantages(personagem)).toHaveLength(1);
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
      const personagem = { vantagens: [{ nome: 'StringUsos', usar: '2' }] };
      expect(getActivatableAdvantages(personagem)).toHaveLength(1);
    });

    it('filtra vantagens com valor de usos não numérico', () => {
      const personagem = { vantagens: [{ nome: 'Invalida', usar: 'abc' }] };
      expect(getActivatableAdvantages(personagem)).toHaveLength(0);
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

  describe('isSpellAction', () => {
    it('classifica MagiaConhecida da engine por tipo', () => {
      expect(isSpellAction({ tipo: 'magia' })).toBe(true);
      expect(isSpellAction({ tipo: 'tecnica' })).toBe(false);
    });

    it('classifica vantagem ativável por escola_magia', () => {
      expect(isSpellAction({ escola_magia: 'evocacao' })).toBe(true);
      expect(isSpellAction({ escola_magia: 'nenhuma' })).toBe(false);
      expect(isSpellAction({})).toBe(false);
    });
  });

  describe('getOwnedCombatActions — vínculo real (Lunaria/D&D)', () => {
    it('resolve magias e técnicas do vínculo hm_personagem via engine', async () => {
      const db = fakeDbHm([
        vinculoHm({ id: 1, nome: 'Investida' }),
        vinculoHm({ id: 2, nome: 'Bola de Fogo', escola_magia: 'evocacao', custo_mana: 4 }),
      ]);
      const result = await getOwnedCombatActions({ id: 10, sistema: 'lunaria', nivel: 3 }, db);
      expect(result.habilidades).toHaveLength(1);
      expect(result.habilidades[0].nome).toBe('Investida');
      expect(result.magias).toHaveLength(1);
      expect(result.magias[0].nome).toBe('Bola de Fogo');
    });

    it('um personagem vê só o que aprendeu, nunca o catálogo inteiro', async () => {
      // O personagem aprendeu 2 magias — o catálogo da classe poderia ter centenas.
      const db = fakeDbHm([
        vinculoHm({ id: 2, nome: 'Bola de Fogo', escola_magia: 'evocacao' }),
        vinculoHm({ id: 3, nome: 'Cura', escola_magia: 'restauracao' }),
      ]);
      const result = await getOwnedCombatActions({ id: 10, sistema: 'lunaria' }, db);
      expect(result.magias).toHaveLength(2);
    });

    it('não duplica ações: vínculo é UMA fonte de verdade', async () => {
      // hm_personagem tem @@unique([personagem_id, habilidade_id]) — sem duplicata na origem.
      const db = fakeDbHm([
        vinculoHm({ id: 2, nome: 'Bola de Fogo', escola_magia: 'evocacao' }),
      ]);
      const result = await getOwnedCombatActions({ id: 10, sistema: 'lunaria' }, db);
      expect(result.magias).toHaveLength(1);
    });

    it('ignora magias de outro sistema no vínculo', async () => {
      const db = fakeDbHm([
        vinculoHm({ id: 1, nome: 'Lunaria spell', escola_magia: 'evocacao', sistema: 'lunaria' }),
        vinculoHm({ id: 2, nome: 'D&D spell', escola_magia: 'evocacao', sistema: 'dnd5e' }),
      ]);
      const result = await getOwnedCombatActions({ id: 10, sistema: 'lunaria' }, db);
      expect(result.magias).toHaveLength(1);
      expect(result.magias[0].nome).toBe('Lunaria spell');
    });

    it('resolve o vínculo dnd5e', async () => {
      const db = fakeDbHm([
        vinculoHm({ id: 5, nome: 'Eldritch Blast', escola_magia: 'evocacao', sistema: 'dnd5e' }),
      ]);
      const result = await getOwnedCombatActions({ id: 10, sistema: 'dnd5e' }, db);
      expect(result.magias).toHaveLength(1);
      expect(result.magias[0].nome).toBe('Eldritch Blast');
    });
  });

  describe('getOwnedCombatActions — vínculo real (3D&T)', () => {
    it('resolve magias de personagem_magia_tresdet via engine', async () => {
      const db = fakeDbTresdet([
        { magia_tresdet_id: 1, origem: 'criacao', magias_tresdet: { id: 1, nome: 'Bola de Fogo', escola: 'Fogo', custo_pm: '3' } },
      ]);
      const result = await getOwnedCombatActions({ id: 20, sistema: 'tresdet' }, db);
      expect(result.magias).toHaveLength(1);
      expect(result.magias[0].nome).toBe('Bola de Fogo');
    });
  });

  describe('getOwnedCombatActions — vantagens ativáveis', () => {
    it('inclui vantagensAtivaveis no resultado', async () => {
      const db = fakeDbHm([]);
      const personagem = { id: 10, sistema: 'lunaria', vantagens: [{ nome: 'Fúria', usar: 2 }] };
      const result = await getOwnedCombatActions(personagem, db);
      expect(result.vantagensAtivaveis).toHaveLength(1);
      expect(result.vantagensAtivaveis[0].nome).toBe('Fúria');
    });

    it('classifica vantagem ativável como magia quando tem escola_magia', async () => {
      const db = fakeDbHm([]);
      const personagem = {
        id: 10, sistema: 'lunaria',
        vantagens: [{ nome: 'Sopro de Dragão', usar: 1, escola_magia: 'evocacao' }],
      };
      const result = await getOwnedCombatActions(personagem, db);
      expect(result.magias).toHaveLength(1);
      expect(result.magias[0].nome).toBe('Sopro de Dragão');
      expect(result.habilidades).toHaveLength(0);
    });

    it('classifica vantagem ativável como habilidade quando sem escola_magia', async () => {
      const db = fakeDbHm([]);
      const personagem = { id: 10, sistema: 'lunaria', vantagens: [{ nome: 'Fúria', usar: 1 }] };
      const result = await getOwnedCombatActions(personagem, db);
      expect(result.habilidades).toHaveLength(1);
      expect(result.habilidades[0].nome).toBe('Fúria');
      expect(result.magias).toHaveLength(0);
    });

    it('combina vínculo real e vantagens ativáveis', async () => {
      const db = fakeDbHm([
        vinculoHm({ id: 1, nome: 'Investida' }),
        vinculoHm({ id: 2, nome: 'Bola de Fogo', escola_magia: 'evocacao' }),
      ]);
      const personagem = {
        id: 10, sistema: 'lunaria',
        vantagens: [
          { nome: 'Fúria Berserker', usar: 3 },
          { nome: 'Toque Gélido', usar: 1, escola_magia: 'necromancia' },
        ],
      };
      const result = await getOwnedCombatActions(personagem, db);
      expect(result.habilidades).toHaveLength(2); // Investida + Fúria Berserker
      expect(result.magias).toHaveLength(2); // Bola de Fogo + Toque Gélido
      expect(result.vantagensAtivaveis).toHaveLength(2);
    });
  });

  describe('getOwnedCombatActions — bordas', () => {
    it('sem db retorna apenas vantagens ativáveis (não consulta vínculo)', async () => {
      const personagem = { id: 10, sistema: 'lunaria', vantagens: [{ nome: 'Fúria', usar: 1 }] };
      const result = await getOwnedCombatActions(personagem);
      expect(result.habilidades).toHaveLength(1);
      expect(result.magias).toHaveLength(0);
    });

    it('personagem sem id não consulta vínculo', async () => {
      const db = fakeDbHm([vinculoHm({ id: 1, nome: 'Investida' })]);
      const result = await getOwnedCombatActions({ sistema: 'lunaria' }, db);
      expect(result.habilidades).toEqual([]);
      expect(result.magias).toEqual([]);
    });

    it('retorna listas vazias para personagem sem ações', async () => {
      const result = await getOwnedCombatActions({}, fakeDbHm([]));
      expect(result.habilidades).toEqual([]);
      expect(result.magias).toEqual([]);
      expect(result.vantagensAtivaveis).toEqual([]);
    });

    it('retorna listas vazias quando chamado sem argumentos', async () => {
      const result = await getOwnedCombatActions();
      expect(result.habilidades).toEqual([]);
      expect(result.magias).toEqual([]);
      expect(result.vantagensAtivaveis).toEqual([]);
    });
  });

  describe('getOwnedCombatActionList', () => {
    it('retorna lista combinada de habilidades e magias do vínculo', async () => {
      const db = fakeDbHm([
        vinculoHm({ id: 1, nome: 'Investida' }),
        vinculoHm({ id: 2, nome: 'Bola de Fogo', escola_magia: 'evocacao' }),
      ]);
      const result = await getOwnedCombatActionList({ id: 10, sistema: 'lunaria' }, db);
      const nomes = result.map(r => r.nome);
      expect(nomes).toContain('Investida');
      expect(nomes).toContain('Bola de Fogo');
      expect(result).toHaveLength(2);
    });

    it('inclui vantagens ativáveis na lista combinada', async () => {
      const db = fakeDbHm([]);
      const personagem = {
        id: 10, sistema: 'lunaria',
        vantagens: [
          { nome: 'Fúria', usar: 2 },
          { nome: 'Sopro', usar: 1, escola_magia: 'evocacao' },
        ],
      };
      const result = await getOwnedCombatActionList(personagem, db);
      const nomes = result.map(r => r.nome);
      expect(nomes).toContain('Fúria');
      expect(nomes).toContain('Sopro');
      expect(result).toHaveLength(2);
    });

    it('não inclui vantagens passivas', async () => {
      const db = fakeDbHm([vinculoHm({ id: 1, nome: 'Investida' })]);
      const personagem = { id: 10, sistema: 'lunaria', vantagens: [{ nome: 'Passiva', usar: 0 }] };
      const result = await getOwnedCombatActionList(personagem, db);
      expect(result).toHaveLength(1);
      expect(result[0].nome).toBe('Investida');
    });

    it('retorna array vazio para personagem sem ações', async () => {
      expect(await getOwnedCombatActionList({}, fakeDbHm([]))).toEqual([]);
    });

    it('retorna array vazio quando chamado sem argumentos', async () => {
      expect(await getOwnedCombatActionList()).toEqual([]);
    });
  });
});
