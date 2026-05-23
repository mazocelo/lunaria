import { describe, it, expect } from 'vitest';
import { monstroSchema } from '../../types/api/monstro';

const monstroMin = {
  id: 1,
  nome: 'Goblin',
  dano_base: '1d6',
  sistema: 'lunaria',
};

describe('monstroSchema', () => {
  it('aceita monstro minimo (campos com default)', () => {
    const parsed = monstroSchema.parse(monstroMin);
    expect(parsed.nome).toBe('Goblin');
    expect(parsed.hp_base).toBe(15);
    expect(parsed.tipo).toEqual([]);
  });

  it('aceita atributos como mapa flat (resultado do controller)', () => {
    const parsed = monstroSchema.parse({
      ...monstroMin,
      atributos: { forca: 12, destreza: 14 },
    });
    expect(parsed.atributos?.forca).toBe(12);
  });

  it('aceita raridade_rel e categoria_rel incluidos', () => {
    const parsed = monstroSchema.parse({
      ...monstroMin,
      raridade_rel: { id: 1, nome: 'Comum', cor: '#aaa' },
      categoria_rel: { id: 2, nome: 'Humanoide' },
    });
    expect(parsed.raridade_rel?.nome).toBe('Comum');
  });

  it('rejeita sistema desconhecido', () => {
    const r = monstroSchema.safeParse({ ...monstroMin, sistema: 'pathfinder' });
    expect(r.success).toBe(false);
  });
});
