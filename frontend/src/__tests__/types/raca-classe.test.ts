import { describe, it, expect } from 'vitest';
import { racaSchema } from '../../types/api/raca';
import { classeSchema } from '../../types/api/classe';

describe('racaSchema', () => {
  // O schema modela `bonus` como mapa atributo->numero (forca/destreza/...).
  // Em prod o backend pode incluir `vantagens`/`desvantagens` arrays em
  // `bonus` (decorarBonusEntidade); refinar isso e item da Fase 2 quando o
  // catalogo for ligado ao service.
  const raca = {
    id: 1,
    nome: 'Humano',
    custo: 0,
    descricao: 'Versatil.',
    sistema: 'lunaria',
    bonus: { forca: 1, destreza: 1 },
    atributos_bonus: { forca: 1, destreza: 1 },
  };

  it('aceita raca completa', () => {
    const parsed = racaSchema.parse(raca);
    expect(parsed.nome).toBe('Humano');
    expect(parsed.atributos_bonus?.forca).toBe(1);
  });

  it('aceita bonus null', () => {
    const parsed = racaSchema.parse({ ...raca, bonus: null });
    expect(parsed.bonus).toBeNull();
  });

  it('aceita raca D&D 5e (sistema = dnd5e)', () => {
    const parsed = racaSchema.parse({ ...raca, sistema: 'dnd5e', nome: 'Dwarf' });
    expect(parsed.sistema).toBe('dnd5e');
  });

  it('rejeita sistema invalido', () => {
    const r = racaSchema.safeParse({ ...raca, sistema: 'foo' });
    expect(r.success).toBe(false);
  });
});

describe('classeSchema', () => {
  it('aceita classe D&D 5e em ingles (banco usa slug)', () => {
    const parsed = classeSchema.parse({
      id: 41,
      nome: 'fighter',
      custo: 0,
      sistema: 'dnd5e',
    });
    expect(parsed.nome).toBe('fighter');
  });

  it('rejeita classe sem nome', () => {
    const r = classeSchema.safeParse({ id: 1, custo: 0, sistema: 'lunaria' });
    expect(r.success).toBe(false);
  });
});
