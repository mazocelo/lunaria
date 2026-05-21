import { describe, it, expect } from 'vitest';
import {
  getMagiasConhecidas,
  getMagiasDisponiveis,
  getSlotsInfo,
} from '../game-systems/lunaria/magiaEngine.js';

// ─── fakes de db ─────────────────────────────────────────────────────────────

function makeDb({
  hmPersonagem = [],
  hmClasse = [],
  hmRaca = [],
  contarMagias = 0,
  slots = 0,
  raca = null,
} = {}) {
  return {
    HmPersonagem: {
      async findByPersonagem() { return hmPersonagem; },
      async contarMagias() { return contarMagias; },
    },
    HmClasse: {
      async findByClasse() { return hmClasse; },
    },
    HmRaca: {
      async findByRaca() { return hmRaca; },
    },
    HmSlotsClasse: {
      async getSlots() { return slots; },
    },
    Raca: {
      async findById() { return raca; },
    },
  };
}

const magiaFogo = {
  id: 1, nome: 'Bola de Fogo', sistema: 'lunaria',
  escola_magia: 'evocacao', custo_mana: 10, nivel_requerido: 1,
  escalamento: { por_nivel: '+1d6', a_cada: 4 },
};
const tecnicaGolpe = {
  id: 2, nome: 'Golpe Pesado', sistema: 'lunaria',
  escola_magia: 'nenhuma', custo_mana: 0, nivel_requerido: 1, escalamento: null,
};
const magiaAvancada = {
  id: 3, nome: 'Meteoro', sistema: 'lunaria',
  escola_magia: 'evocacao', custo_mana: 50, nivel_requerido: 10, escalamento: null,
};

// ─── getMagiasConhecidas ─────────────────────────────────────────────────────

describe('lunaria getMagiasConhecidas', () => {
  it('personagem sem id retorna []', async () => {
    expect(await getMagiasConhecidas({}, makeDb())).toEqual([]);
  });

  it('personagem sem vínculos retorna [], nunca o catálogo', async () => {
    const db = makeDb({ hmPersonagem: [] });
    expect(await getMagiasConhecidas({ id: 1, nivel: 5 }, db)).toEqual([]);
  });

  it('mapeia vínculos para o formato MagiaConhecida', async () => {
    const db = makeDb({
      hmPersonagem: [{ habilidade_id: 1, origem: 'criacao', habilidades_magias: magiaFogo }],
    });
    const result = await getMagiasConhecidas({ id: 1, nivel: 1 }, db);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 1, fonte: 'habilidades_magias', nome: 'Bola de Fogo',
      tipo: 'magia', escola: 'evocacao', custo: 10, origem: 'criacao',
    });
  });

  it('classifica técnica vs magia pela escola_magia', async () => {
    const db = makeDb({
      hmPersonagem: [
        { habilidade_id: 1, origem: 'criacao', habilidades_magias: magiaFogo },
        { habilidade_id: 2, origem: 'criacao', habilidades_magias: tecnicaGolpe },
      ],
    });
    const result = await getMagiasConhecidas({ id: 1, nivel: 1 }, db);
    expect(result.find(m => m.id === 1).tipo).toBe('magia');
    expect(result.find(m => m.id === 2).tipo).toBe('tecnica');
  });

  it('ignora vínculos de outro sistema', async () => {
    const db = makeDb({
      hmPersonagem: [
        { habilidade_id: 9, origem: 'criacao', habilidades_magias: { ...magiaFogo, id: 9, sistema: 'dnd5e' } },
      ],
    });
    expect(await getMagiasConhecidas({ id: 1, nivel: 1 }, db)).toEqual([]);
  });

  it('resolve upgradeAtivo de escalamento pelo nível do personagem', async () => {
    const db = makeDb({
      hmPersonagem: [{ habilidade_id: 1, origem: 'criacao', habilidades_magias: magiaFogo }],
    });
    const nv1 = await getMagiasConhecidas({ id: 1, nivel: 1 }, db);
    expect(nv1[0].upgradeAtivo).toBeNull();

    const nv9 = await getMagiasConhecidas({ id: 1, nivel: 9 }, db);
    expect(nv9[0].upgradeAtivo).toEqual({ por_nivel: '+1d6', a_cada: 4, passos: 2 });
  });
});

// ─── getMagiasDisponiveis ────────────────────────────────────────────────────

describe('lunaria getMagiasDisponiveis', () => {
  it('personagem sem id retorna []', async () => {
    expect(await getMagiasDisponiveis({}, makeDb())).toEqual([]);
  });

  it('une magias de classe e raça, filtrando por nível', async () => {
    const db = makeDb({
      hmClasse: [{ habilidades_magias: magiaFogo }, { habilidades_magias: magiaAvancada }],
      hmRaca: [{ habilidades_magias: tecnicaGolpe }],
      raca: { pode_magia: true },
    });
    const result = await getMagiasDisponiveis({ id: 1, nivel: 5, classe_id: 1, raca_id: 1 }, db);
    expect(result.map(m => m.id).sort()).toEqual([1, 2]); // Meteoro (nv10) excluída
  });

  it('exclui magias já conhecidas', async () => {
    const db = makeDb({
      hmClasse: [{ habilidades_magias: magiaFogo }],
      hmPersonagem: [{ habilidade_id: 1 }],
      raca: { pode_magia: true },
    });
    const result = await getMagiasDisponiveis({ id: 1, nivel: 5, classe_id: 1 }, db);
    expect(result).toEqual([]);
  });

  it('raça sem pode_magia não recebe magias, mas recebe técnicas', async () => {
    const db = makeDb({
      hmClasse: [{ habilidades_magias: magiaFogo }, { habilidades_magias: tecnicaGolpe }],
      raca: { pode_magia: false },
    });
    const result = await getMagiasDisponiveis({ id: 1, nivel: 5, classe_id: 1, raca_id: 1 }, db);
    expect(result.map(m => m.id)).toEqual([2]);
  });

  it('marca origem racial para magias vindas de hm_raca', async () => {
    const db = makeDb({
      hmRaca: [{ habilidades_magias: tecnicaGolpe }],
      raca: { pode_magia: true },
    });
    const result = await getMagiasDisponiveis({ id: 1, nivel: 5, raca_id: 1 }, db);
    expect(result[0].origem).toBe('racial');
  });

  it('não duplica magia presente em classe e raça', async () => {
    const db = makeDb({
      hmClasse: [{ habilidades_magias: magiaFogo }],
      hmRaca: [{ habilidades_magias: magiaFogo }],
      raca: { pode_magia: true },
    });
    const result = await getMagiasDisponiveis({ id: 1, nivel: 5, classe_id: 1, raca_id: 1 }, db);
    expect(result).toHaveLength(1);
  });
});

// ─── getSlotsInfo ────────────────────────────────────────────────────────────

describe('lunaria getSlotsInfo', () => {
  it('usaSlots true, recurso slots', async () => {
    const info = await getSlotsInfo({ id: 1, nivel: 1, classe_id: 1 }, makeDb({ slots: 3 }));
    expect(info.usaSlots).toBe(true);
    expect(info.recurso).toBe('slots');
  });

  it('total = slots da classe + bônus de vantagens; livres = total - usados', async () => {
    const personagem = {
      id: 1, nivel: 5, classe_id: 1,
      personagem_vantagem: [{ vantagens: { bonus: { slots_magia_bonus: 2 } } }],
    };
    const info = await getSlotsInfo(personagem, makeDb({ slots: 4, contarMagias: 3 }));
    expect(info.total).toBe(6);
    expect(info.usados).toBe(3);
    expect(info.livres).toBe(3);
  });

  it('personagem sem classe tem 0 slots base', async () => {
    const info = await getSlotsInfo({ id: 1, nivel: 1 }, makeDb({ slots: 99 }));
    expect(info.total).toBe(0);
  });
});
