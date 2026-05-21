import { describe, it, expect } from 'vitest';
import {
  getMagiasConhecidas,
  getMagiasDisponiveis,
  getSlotsInfo,
} from '../game-systems/tresdet/magiaEngine.js';

function makeDb({ magiasPersonagem = [], catalogo = [] } = {}) {
  return {
    Personagem: {
      async listarMagiasTresDet() { return magiasPersonagem; },
    },
    MagiasTresDet: {
      async buscarTodos() { return catalogo; },
    },
  };
}

const bolaDeFogo = {
  id: 1, nome: 'Bola de Fogo', escola: 'Elemental',
  custo_pm: '3', nivel_minimo: 1, focus_requisito: [{ fogo: 2 }],
};
const luz = {
  id: 2, nome: 'Luz', escola: 'Branca',
  custo_pm: '1', nivel_minimo: 1, focus_requisito: null,
};
const meteoro = {
  id: 3, nome: 'Chuva de Meteoros', escola: 'Elemental',
  custo_pm: '20 PMs', nivel_minimo: 5, focus_requisito: [{ fogo: 5 }],
};

// ─── getMagiasConhecidas ─────────────────────────────────────────────────────

describe('tresdet getMagiasConhecidas', () => {
  it('personagem sem id retorna []', async () => {
    expect(await getMagiasConhecidas({}, makeDb())).toEqual([]);
  });

  it('personagem sem vínculos retorna [], nunca o catálogo', async () => {
    expect(await getMagiasConhecidas({ id: 1, nivel: 5 }, makeDb())).toEqual([]);
  });

  it('mapeia personagem_magia_tresdet para MagiaConhecida', async () => {
    const db = makeDb({
      magiasPersonagem: [{ magia_tresdet_id: 1, origem: 'criacao', magias_tresdet: bolaDeFogo }],
    });
    const result = await getMagiasConhecidas({ id: 1, nivel: 1 }, db);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 1, fonte: 'magias_tresdet', nome: 'Bola de Fogo',
      tipo: 'magia', escola: 'Elemental', custo: '3', upgradeAtivo: null,
    });
  });

  it('tipo é sempre magia; custo é string (PM)', async () => {
    const db = makeDb({
      magiasPersonagem: [{ magia_tresdet_id: 3, origem: 'evento', magias_tresdet: meteoro }],
    });
    const result = await getMagiasConhecidas({ id: 1, nivel: 5 }, db);
    expect(result[0].tipo).toBe('magia');
    expect(result[0].custo).toBe('20 PMs');
    expect(result[0].origem).toBe('evento');
  });
});

// ─── getMagiasDisponiveis ────────────────────────────────────────────────────

describe('tresdet getMagiasDisponiveis', () => {
  it('personagem sem id retorna []', async () => {
    expect(await getMagiasDisponiveis({}, makeDb())).toEqual([]);
  });

  it('filtra por focus_requisito satisfeito pelos Focus do personagem', async () => {
    const db = makeDb({ catalogo: [bolaDeFogo, luz, meteoro] });
    const personagem = { id: 1, nivel: 5, stats_sistema: { focus: { fogo: 2 } } };
    const result = await getMagiasDisponiveis(personagem, db);
    // bolaDeFogo (fogo>=2 ok), luz (sem requisito ok); meteoro exige fogo>=5
    expect(result.map(m => m.id).sort()).toEqual([1, 2]);
  });

  it('filtra por nivel_minimo', async () => {
    const db = makeDb({ catalogo: [bolaDeFogo, meteoro] });
    const personagem = { id: 1, nivel: 1, stats_sistema: { focus: { fogo: 9 } } };
    const result = await getMagiasDisponiveis(personagem, db);
    expect(result.map(m => m.id)).toEqual([1]); // meteoro exige nivel 5
  });

  it('exclui magias já conhecidas', async () => {
    const db = makeDb({
      catalogo: [bolaDeFogo, luz],
      magiasPersonagem: [{ magia_tresdet_id: 1 }],
    });
    const personagem = { id: 1, nivel: 5, stats_sistema: { focus: { fogo: 5 } } };
    const result = await getMagiasDisponiveis(personagem, db);
    expect(result.map(m => m.id)).toEqual([2]);
  });

  it('personagem sem focus só vê magias sem focus_requisito', async () => {
    const db = makeDb({ catalogo: [bolaDeFogo, luz] });
    const result = await getMagiasDisponiveis({ id: 1, nivel: 5 }, db);
    expect(result.map(m => m.id)).toEqual([2]);
  });
});

// ─── getSlotsInfo ────────────────────────────────────────────────────────────

describe('tresdet getSlotsInfo', () => {
  it('3D&T NÃO usa slots: usaSlots false, recurso pm, tudo zerado', async () => {
    const info = await getSlotsInfo({ id: 1, nivel: 5 }, makeDb());
    expect(info).toEqual({ usaSlots: false, total: 0, usados: 0, livres: 0, recurso: 'pm' });
  });
});
