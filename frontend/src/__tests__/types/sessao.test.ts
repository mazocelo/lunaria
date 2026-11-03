import { describe, it, expect } from 'vitest';
import {
  sessaoSchema,
  sessaoIniciadaSchema,
  sessaoMensagemSchema,
} from '../../types/api/sessao';

const sessaoFixture = {
  salaId: 'sala_5_1717000000',
  historiaId: 5,
  historiaNome: 'A Torre Esquecida',
  mestre: 'Mestre do Sistema',
  jogadores: ['ana', 'beto'],
  maxJogadores: 4,
  estadoJogo: {
    cena: 'Inicio da Aventura',
    npcs: [],
    inventario: [],
    clima: 'Ensolarado',
    tempo: 'Dia',
  },
  mensagens: [],
};

describe('sessaoSchema', () => {
  it('aceita sessao recem-criada (objeto Redis)', () => {
    const parsed = sessaoSchema.parse(sessaoFixture);
    expect(parsed.salaId).toBe('sala_5_1717000000');
    expect(parsed.jogadores).toHaveLength(2);
  });

  it('aceita mensagens no shape real do websocket (createSessionMessage)', () => {
    const parsed = sessaoSchema.parse({
      ...sessaoFixture,
      mensagens: [
        {
          id: 'msg_jogador_1',
          tipo: 'jogador',
          canal: 'formal',
          origem: 'usuario',
          userId: 7,
          username: 'ana',
          message: 'Olho ao redor.',
          mensagem: 'Olho ao redor.',
          payload: null,
          timestamp: 1717000000,
        },
        {
          id: 'msg_combate_1',
          tipo: 'combate',
          canal: 'formal',
          origem: 'sistema',
          username: 'Sistema',
          message: 'Voce sofre 3 de dano.',
          mensagem: 'Voce sofre 3 de dano.',
          payload: { dano: 3, alvo: 'ana' },
          timestamp: 1717000010,
        },
        {
          id: 'msg_transicao_1',
          tipo: 'transicao_turno',
          timestamp: '2026-05-23T10:00:00Z',
        },
      ],
    });
    expect(parsed.mensagens).toHaveLength(3);
  });

  it('aceita campos extras nas mensagens (passthrough p/ evolucao do shape)', () => {
    const r = sessaoMensagemSchema.safeParse({
      tipo: 'acao_mestre',
      futuroCampo: { qualquerCoisa: true },
    });
    expect(r.success).toBe(true);
  });

  it('rejeita mensagem sem tipo (campo unico realmente obrigatorio)', () => {
    const r = sessaoMensagemSchema.safeParse({
      username: 'ana',
      message: 'sem tipo',
    });
    expect(r.success).toBe(false);
  });
});

describe('sessaoIniciadaSchema', () => {
  it('aceita envelope { salaId, sessao } retornado por iniciarSessao', () => {
    const parsed = sessaoIniciadaSchema.parse({
      salaId: 'sala_1',
      sessao: sessaoFixture,
    });
    expect(parsed.salaId).toBe('sala_1');
    expect(parsed.sessao.historiaNome).toBe('A Torre Esquecida');
  });
});
