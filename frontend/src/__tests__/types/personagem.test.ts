/**
 * Testes do schema Zod de Personagem.
 *
 * Os fixtures foram montados a partir do que `personagemController.js`
 * realmente devolve em `obterPersonagem`/`processarDadosPersonagem` para
 * cada sistema. O objetivo aqui e travar contratos por sistema e a
 * discriminated union — ZodError loud na chegada da resposta e o que vai
 * matar drift cedo na Fase 2.
 */

import { describe, it, expect } from 'vitest';
import {
  personagemSchema,
  personagemLunariaSchema,
  personagemDnd5eSchema,
  personagemTresdetSchema,
  personagemUpdatePayloadSchema,
} from '../../types/api/personagem';

const personagemLunariaFixture = {
  id: 1,
  nome: 'Aria',
  sistema: 'lunaria',
  nivel: 3,
  pontos_totais: 0,
  pontos_iniciais: 0,
  background: 'Uma aventureira do norte.',
  raca_id: 2,
  classe_id: 5,
  imagem: null,
  id_usuario: 10,
  criado_em: '2026-05-20T12:00:00.000Z',
  atualizado_em: '2026-05-22T12:00:00.000Z',
  hp_atual: 30,
  mp_atual: 12,
  moedas: 100,
  xp_atual: 150,
  xp_proximo_nivel: 300,
  pontos_atributo_pendentes: 0,
  stats_sistema: null,
  voice_id: null,
  voice_provider: null,
  raca: 'Humano',
  classe: 'Guerreiro',
  historias: [],
  vantagens: [],
  desvantagens: [],
  equipamentos: [],
  magias: [],
  habilidadesClasse: [],
  atributos: {
    forca: 14,
    inteligencia: 10,
    carisma: 8,
    destreza: 12,
    constituicao: 13,
    agilidade: 11,
  },
};

const personagemDnd5eFixture = {
  id: 2,
  nome: 'Thorin',
  sistema: 'dnd5e',
  nivel: 1,
  pontos_totais: 0,
  pontos_iniciais: 0,
  background: 'Anao das montanhas.',
  raca_id: 30,
  classe_id: 41,
  imagem: 'https://cdn/img.png',
  id_usuario: 10,
  criado_em: '2026-05-23T10:00:00.000Z',
  hp_atual: null,
  mp_atual: null,
  moedas: 0,
  xp_atual: 0,
  xp_proximo_nivel: 100,
  pontos_atributo_pendentes: 0,
  stats_sistema: {
    classeKey: 'fighter',
    metodo: 'standard_array',
    skillProficiencies: ['athletics', 'intimidation'],
  },
  raca: 'Dwarf',
  classe: 'fighter',
  vantagens: [],
  desvantagens: [],
  equipamentos: [],
  historias: [],
  magias: [],
  habilidadesClasse: [],
  atributos: { STR: 15, DEX: 13, CON: 14, INT: 12, WIS: 10, CHA: 8 },
};

const personagemTresdetFixture = {
  id: 3,
  nome: 'Akira',
  sistema: 'tresdet',
  nivel: 1,
  pontos_totais: 0,
  pontos_iniciais: 5,
  background: 'Lutador iniciante.',
  raca_id: null,
  classe_id: null,
  imagem: null,
  id_usuario: 10,
  criado_em: '2026-05-23T11:00:00.000Z',
  hp_atual: 5,
  mp_atual: null,
  moedas: 0,
  xp_atual: 0,
  xp_proximo_nivel: 100,
  pontos_atributo_pendentes: 0,
  stats_sistema: {
    temMagia: false,
    nivelPoder: 'iniciante',
    focus: { fogo: 1 },
  },
  vantagens: [],
  desvantagens: [],
  equipamentos: [],
  historias: [],
  magias: [],
  magiasPersonagem: [],
  habilidadesClasse: [],
  atributos: { F: 1, H: 1, R: 1, A: 1, PdF: 1 },
};

describe('personagemSchema (discriminated union por sistema)', () => {
  it('aceita personagem Lunaria com stats_sistema null', () => {
    const parsed = personagemSchema.parse(personagemLunariaFixture);
    expect(parsed.sistema).toBe('lunaria');
    expect(parsed.stats_sistema).toBeNull();
  });

  it('aceita personagem D&D 5e com stats_sistema populado', () => {
    const parsed = personagemSchema.parse(personagemDnd5eFixture);
    expect(parsed.sistema).toBe('dnd5e');
    if (parsed.sistema !== 'dnd5e') throw new Error('discriminacao falhou');
    expect(parsed.stats_sistema?.classeKey).toBe('fighter');
    expect(parsed.stats_sistema?.skillProficiencies).toEqual([
      'athletics',
      'intimidation',
    ]);
  });

  it('aceita personagem 3D&T com stats_sistema temMagia/focus', () => {
    const parsed = personagemSchema.parse(personagemTresdetFixture);
    expect(parsed.sistema).toBe('tresdet');
    if (parsed.sistema !== 'tresdet') throw new Error('discriminacao falhou');
    expect(parsed.stats_sistema?.temMagia).toBe(false);
    expect(parsed.stats_sistema?.focus?.fogo).toBe(1);
  });

  it('aceita D&D 5e com stats_sistema null (ficha incompleta — banner ainda renderiza)', () => {
    const incompleto = { ...personagemDnd5eFixture, stats_sistema: null };
    const parsed = personagemSchema.parse(incompleto);
    expect(parsed.sistema).toBe('dnd5e');
    expect(parsed.stats_sistema).toBeNull();
  });

  it('rejeita sistema desconhecido', () => {
    const r = personagemSchema.safeParse({
      ...personagemLunariaFixture,
      sistema: 'pathfinder',
    });
    expect(r.success).toBe(false);
  });

  it('rejeita stats_sistema do D&D 5e com skillProficiencies invalido', () => {
    const invalido = {
      ...personagemDnd5eFixture,
      stats_sistema: {
        classeKey: 'fighter',
        metodo: 'standard_array',
        skillProficiencies: 'athletics',
      },
    };
    const r = personagemSchema.safeParse(invalido);
    expect(r.success).toBe(false);
  });

  it('discrimina: payload dnd5e NAO passa em personagemLunariaSchema', () => {
    const r = personagemLunariaSchema.safeParse(personagemDnd5eFixture);
    expect(r.success).toBe(false);
  });

  it('discrimina: payload lunaria NAO passa em personagemDnd5eSchema', () => {
    const r = personagemDnd5eSchema.safeParse(personagemLunariaFixture);
    expect(r.success).toBe(false);
  });

  it('discrimina: payload tresdet NAO passa em personagemDnd5eSchema', () => {
    const r = personagemDnd5eSchema.safeParse(personagemTresdetFixture);
    expect(r.success).toBe(false);
  });

  it('aceita personagemTresdetSchema com stats_sistema null (criado por fluxo legado)', () => {
    const semStats = { ...personagemTresdetFixture, stats_sistema: null };
    const r = personagemTresdetSchema.safeParse(semStats);
    expect(r.success).toBe(true);
  });
});

describe('personagemUpdatePayloadSchema', () => {
  it('aceita payload tipico de toUpdatePayload', () => {
    const payload = {
      nome: 'Aria Reborn',
      imagem: null,
      background: 'novo bg',
      sugestao_background: 'guiado',
      historias: [1, 2],
      vantagens: [10, 20],
      desvantagens: [],
      equipamentos: [],
    };
    const parsed = personagemUpdatePayloadSchema.parse(payload);
    expect(parsed.nome).toBe('Aria Reborn');
    expect(parsed.historias).toEqual([1, 2]);
  });

  it('aceita payload vazio (PATCH parcial)', () => {
    const r = personagemUpdatePayloadSchema.safeParse({});
    expect(r.success).toBe(true);
  });
});
