import { describe, it, expect, vi, beforeEach } from 'vitest';

// Criacao D&D 5e: a distribuicao chega SEM bonus racial (o wizard so mostra o
// bonus na tela). O service valida a distribuicao base e soma o bonus da raca
// (`racas.bonus.abilityBonuses`, JSON em coluna String) antes de gravar.

const store = { racas: [], atributos: [] };

vi.mock('../Model/index.js', () => {
  const tx = {
    historias: { findMany: vi.fn(async () => []) },
    personagens: { create: vi.fn(async ({ data }) => ({ id: 1, ...data })) },
    atributos_personagem: {
      createMany: vi.fn(async ({ data }) => { store.atributos.push(...data); return { count: data.length }; }),
    },
    historias_personagens: { createMany: vi.fn(async () => ({ count: 0 })) },
  };
  return {
    default: {
      prisma: {
        racas: {
          findFirst: vi.fn(async ({ where }) =>
            store.racas.find((r) => r.id === where.id && r.sistema === where.sistema) || null
          ),
        },
        classes: { findFirst: vi.fn(async () => null) },
        $transaction: vi.fn(async (fn) => fn(tx)),
      },
    },
  };
});

const { criarPersonagemDnd5e } = await import('../services/personagemDnd5eService.js');

// Conjunto padrao 15/14/13/12/10/8, sem bonus.
const BASE = { STR: 8, DEX: 15, CON: 13, INT: 10, WIS: 14, CHA: 12 };

function gravados() {
  return Object.fromEntries(store.atributos.map((a) => [a.nome, a.valor]));
}

beforeEach(() => {
  store.atributos = [];
  store.racas = [
    {
      id: 1,
      sistema: 'dnd5e',
      nome: 'Wood Elf',
      bonus: JSON.stringify({ abilityBonuses: { DEX: 2, WIS: 1 }, traits: ['Darkvision'], speed: 35 }),
    },
    { id: 2, sistema: 'dnd5e', nome: 'Sem Bonus', bonus: null },
    {
      id: 3,
      sistema: 'dnd5e',
      nome: 'Half-Elf',
      bonus: JSON.stringify({ abilityBonuses: { CHA: 2, choice: { count: 2, amount: 1, from: ['STR', 'DEX'] } } }),
    },
    { id: 4, sistema: 'dnd5e', nome: 'Forte', bonus: JSON.stringify({ abilityBonuses: { STR: 2 } }) },
  ];
});

describe('criarPersonagemDnd5e — bonus racial', () => {
  it('raca com +2 DES +1 SAB grava os atributos com o bonus somado', async () => {
    await criarPersonagemDnd5e(
      { nome: 'Arwen', metodo: 'standard_array', raca_id: 1, atributos: BASE },
      42,
    );

    expect(gravados()).toEqual({ ...BASE, DEX: 17, WIS: 15 });
  });

  it('raca sem bonus mantem os valores da distribuicao', async () => {
    await criarPersonagemDnd5e(
      { nome: 'Fulano', metodo: 'standard_array', raca_id: 2, atributos: BASE },
      42,
    );

    expect(gravados()).toEqual(BASE);
  });

  it('sem raca mantem os valores da distribuicao', async () => {
    await criarPersonagemDnd5e({ nome: 'Fulano', metodo: 'standard_array', atributos: BASE }, 42);

    expect(gravados()).toEqual(BASE);
  });

  it('bonus de escolha (Half-Elf) aplica so o fixo; a escolha nao vem no payload', async () => {
    await criarPersonagemDnd5e(
      { nome: 'Tanis', metodo: 'standard_array', raca_id: 3, atributos: BASE },
      42,
    );

    expect(gravados()).toEqual({ ...BASE, CHA: 14 });
  });

  it('respeita o teto 20 do D&D', async () => {
    await criarPersonagemDnd5e(
      { nome: 'Brutus', raca_id: 4, atributos: { ...BASE, STR: 19 } },
      42,
    );

    expect(gravados().STR).toBe(20);
  });

  it('payload invalido continua recusado com 400 (validacao sobre a base, sem bonus)', async () => {
    // 15+2 = 17 so seria "valido" se a validacao olhasse o valor ja com bonus.
    await expect(
      criarPersonagemDnd5e(
        { nome: 'Trapaca', metodo: 'standard_array', raca_id: 1, atributos: { ...BASE, DEX: 17 } },
        42,
      ),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(store.atributos).toEqual([]);
  });
});
