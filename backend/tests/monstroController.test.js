import { describe, it, expect, vi, beforeEach } from 'vitest';

// BUG-4: POST /monstros com nome duplicado no MESMO sistema deve devolver 400
// (pre-check findByNome), enquanto o mesmo nome em OUTRO sistema deve criar (201).
// O db fake registra o monstro "Goblin" apenas no sistema lunaria.

const store = { existentes: [], created: [] };

vi.mock('../game-systems/index.js', () => ({
  getAvailableSystems: () => ['lunaria', 'tresdet', 'dnd5e'],
}));

vi.mock('../Model/index.js', () => ({
  default: {
    Monstro: {
      findByNome: vi.fn(async (nome, sistema) =>
        store.existentes.find((m) => m.nome === nome && m.sistema === sistema) || null
      ),
      create: vi.fn(async (dados) => {
        const novo = { id: store.created.length + 1, ...dados };
        store.created.push(novo);
        return novo;
      }),
    },
    prisma: {
      atributos_monstro: { createMany: vi.fn(async () => ({ count: 0 })) },
    },
  },
}));

const { default: monstroController } = await import('../controllers/monstro/monstroController.js');

function fakeRes() {
  const res = { statusCode: null, body: null };
  res.status = vi.fn((code) => { res.statusCode = code; return res; });
  res.json = vi.fn((payload) => { res.body = payload; return res; });
  return res;
}

beforeEach(() => {
  store.existentes = [{ nome: 'Goblin', sistema: 'lunaria' }];
  store.created = [];
});

describe('monstroController.criar (BUG-4: nome duplicado por sistema)', () => {
  it('nome duplicado no mesmo sistema -> 400 amigavel (sem P2002/500)', async () => {
    const req = { body: { nome: 'Goblin', sistema: 'lunaria' } };
    const res = fakeRes();

    await monstroController.criar(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/ja existe um monstro/i);
    expect(store.created).toHaveLength(0);
  });

  it('mesmo nome em outro sistema -> 201 criado', async () => {
    const req = { body: { nome: 'Goblin', sistema: 'tresdet' } };
    const res = fakeRes();

    await monstroController.criar(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(store.created).toHaveLength(1);
    expect(store.created[0]).toMatchObject({ nome: 'Goblin', sistema: 'tresdet' });
  });

  it('nome novo no sistema default (lunaria) -> 201', async () => {
    const req = { body: { nome: 'Lobo Sombrio' } };
    const res = fakeRes();

    await monstroController.criar(req, res);

    expect(res.statusCode).toBe(201);
    expect(store.created[0]).toMatchObject({ nome: 'Lobo Sombrio', sistema: 'lunaria' });
  });

  it('sistema invalido -> 400', async () => {
    const req = { body: { nome: 'Quimera', sistema: 'inexistente' } };
    const res = fakeRes();

    await monstroController.criar(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/sistema invalido/i);
    expect(store.created).toHaveLength(0);
  });
});
