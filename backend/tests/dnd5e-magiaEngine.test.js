import { describe, it, expect } from 'vitest';
import {
  getMagiasConhecidas,
  getMagiasDisponiveis,
  getSlotsInfo,
} from '../game-systems/dnd5e/magiaEngine.js';

function makeDb({ hmPersonagem = [], hmClasse = [], hmRaca = [] } = {}) {
  return {
    HmPersonagem: {
      async findByPersonagem() { return hmPersonagem; },
    },
    HmClasse: {
      async findByClasse() { return hmClasse; },
    },
    HmRaca: {
      async findByRaca() { return hmRaca; },
    },
  };
}

const fireBolt = {
  id: 1, nome: 'Fire Bolt', sistema: 'dnd5e',
  escola_magia: 'evocation', custo_mana: 0, nivel_requerido: 1,
};
const shield = {
  id: 2, nome: 'Shield', sistema: 'dnd5e',
  escola_magia: 'abjuration', custo_mana: 0, nivel_requerido: 1,
};
const wish = {
  id: 3, nome: 'Wish', sistema: 'dnd5e',
  escola_magia: 'conjuration', custo_mana: 0, nivel_requerido: 17,
};
const tecnica = {
  id: 4, nome: 'Second Wind', sistema: 'dnd5e',
  escola_magia: null, custo_mana: 0, nivel_requerido: 1,
};

// ─── getMagiasConhecidas ─────────────────────────────────────────────────────

describe('dnd5e getMagiasConhecidas', () => {
  it('personagem sem id retorna []', async () => {
    expect(await getMagiasConhecidas({}, makeDb())).toEqual([]);
  });

  it('personagem sem vínculos retorna []', async () => {
    expect(await getMagiasConhecidas({ id: 1, nivel: 5 }, makeDb())).toEqual([]);
  });

  it('mapeia vínculos dnd5e; upgradeAtivo sempre null no MVP', async () => {
    const db = makeDb({
      hmPersonagem: [{ habilidade_id: 1, origem: 'criacao', habilidades_magias: fireBolt }],
    });
    const result = await getMagiasConhecidas({ id: 1, nivel: 5 }, db);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 1, fonte: 'habilidades_magias', tipo: 'magia' });
    expect(result[0].upgradeAtivo).toBeNull();
  });

  it('classifica técnica (escola null) como tecnica', async () => {
    const db = makeDb({
      hmPersonagem: [{ habilidade_id: 4, origem: 'criacao', habilidades_magias: tecnica }],
    });
    const result = await getMagiasConhecidas({ id: 1, nivel: 1 }, db);
    expect(result[0].tipo).toBe('tecnica');
  });

  it('ignora vínculos de outro sistema', async () => {
    const db = makeDb({
      hmPersonagem: [{ habilidade_id: 9, origem: 'criacao', habilidades_magias: { ...fireBolt, id: 9, sistema: 'lunaria' } }],
    });
    expect(await getMagiasConhecidas({ id: 1, nivel: 1 }, db)).toEqual([]);
  });
});

// ─── getMagiasDisponiveis ────────────────────────────────────────────────────

describe('dnd5e getMagiasDisponiveis', () => {
  it('personagem sem id retorna []', async () => {
    expect(await getMagiasDisponiveis({}, makeDb())).toEqual([]);
  });

  it('une classe e raça, filtrando por nível', async () => {
    const db = makeDb({
      hmClasse: [{ habilidades_magias: fireBolt }, { habilidades_magias: wish }],
      hmRaca: [{ habilidades_magias: shield }],
    });
    const result = await getMagiasDisponiveis({ id: 1, nivel: 5, classe_id: 1, raca_id: 1 }, db);
    expect(result.map(m => m.id).sort()).toEqual([1, 2]); // Wish (nv17) excluída
  });

  it('exclui o já conhecido', async () => {
    const db = makeDb({
      hmClasse: [{ habilidades_magias: fireBolt }],
      hmPersonagem: [{ habilidade_id: 1 }],
    });
    expect(await getMagiasDisponiveis({ id: 1, nivel: 5, classe_id: 1 }, db)).toEqual([]);
  });
});

// ─── getSlotsInfo ────────────────────────────────────────────────────────────

describe('dnd5e getSlotsInfo', () => {
  it('MVP: usaSlots false, recurso mana, tudo zerado', async () => {
    const info = await getSlotsInfo({ id: 1, nivel: 17, classe_id: 1 }, makeDb());
    expect(info).toEqual({ usaSlots: false, total: 0, usados: 0, livres: 0, recurso: 'mana' });
  });
});
