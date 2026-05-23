/**
 * Schemas Habilidade/Magia — testa o reuso entre Lunaria/D&D e a tabela
 * propria 3D&T. A "escola_magia" e propositalmente string aberta (escola
 * composta tipo "Evocacao (Fogo)" ja foi vista em prod) — esse teste trava
 * essa decisao para nao regredir.
 */

import { describe, it, expect } from 'vitest';
import { habilidadeSchema } from '../../types/api/habilidade';
import {
  magiaLunariaSchema,
  magiaTresdetSchema,
} from '../../types/api/magia';

const habilidadeMin = {
  id: 1,
  nome: 'Bola de Fogo',
  descricao: 'Lanca uma bola de fogo.',
  custo_mana: 5,
  tipo: 'magia',
  nivel_requerido: 3,
  cooldown_turnos: 0,
  alvo: 'inimigo',
  alcance: '30m',
  tempo_conjuracao: '1 acao',
  usa_concentracao: false,
  categoria: 'ofensiva',
  sistema: 'lunaria',
};

describe('habilidadeSchema', () => {
  it('aceita habilidade Lunaria minima', () => {
    const parsed = habilidadeSchema.parse(habilidadeMin);
    expect(parsed.nome).toBe('Bola de Fogo');
    expect(parsed.cooldown_turnos).toBe(0);
  });

  it('aceita escola_magia composta (ex.: "Evocacao (Fogo)")', () => {
    const parsed = habilidadeSchema.parse({
      ...habilidadeMin,
      escola_magia: 'Evocacao (Fogo)',
    });
    expect(parsed.escola_magia).toBe('Evocacao (Fogo)');
  });

  it('aceita escola_magia null', () => {
    const parsed = habilidadeSchema.parse({ ...habilidadeMin, escola_magia: null });
    expect(parsed.escola_magia).toBeNull();
  });

  it('rejeita habilidade sem nome', () => {
    const { nome: _nome, ...semNome } = habilidadeMin;
    const r = habilidadeSchema.safeParse(semNome);
    expect(r.success).toBe(false);
  });

  it('rejeita sistema desconhecido', () => {
    const r = habilidadeSchema.safeParse({ ...habilidadeMin, sistema: 'pathfinder' });
    expect(r.success).toBe(false);
  });
});

describe('magiaLunariaSchema', () => {
  it('reusa habilidadeSchema (mesma tabela habilidades_magias)', () => {
    const parsed = magiaLunariaSchema.parse(habilidadeMin);
    expect(parsed.id).toBe(1);
  });
});

describe('magiaTresdetSchema (tabela propria magias_tresdet)', () => {
  const magia = {
    id: 10,
    nome: 'Bola de Energia',
    descricao: 'Disparo magico generico.',
    escola: 'Elemental',
    custo_pm: '2 PM',
    alcance: '20m',
    duracao: 'instantaneo',
    tipo: 'dano',
    nivel_minimo: 1,
  };

  it('aceita magia 3D&T com custo_pm string', () => {
    const parsed = magiaTresdetSchema.parse(magia);
    expect(parsed.custo_pm).toBe('2 PM');
    expect(parsed.tipo).toBe('dano');
  });

  it('rejeita custo_pm como numero (3D&T usa string)', () => {
    const r = magiaTresdetSchema.safeParse({ ...magia, custo_pm: 2 });
    expect(r.success).toBe(false);
  });

  it('aceita exigencias null/ausente', () => {
    const r = magiaTresdetSchema.safeParse(magia);
    expect(r.success).toBe(true);
  });
});
