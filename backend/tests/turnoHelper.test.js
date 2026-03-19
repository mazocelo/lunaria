import { describe, it, expect } from 'vitest';
import {
  detectarFimDeTurno,
  deveContarNoTurno,
} from '../helpers/turnoHelper.js';

describe('detectarFimDeTurno', () => {
  // ── Positive matches ────────────────────────────────────────────────

  it('detecta "próximo jogador" (case-insensitive)', () => {
    expect(detectarFimDeTurno('O mestre diz: próximo jogador!')).toBe(true);
    expect(detectarFimDeTurno('PRÓXIMO JOGADOR, prepare-se.')).toBe(true);
    expect(detectarFimDeTurno('Próximo Jogador')).toBe(true);
  });

  it('detecta "fim de turno"', () => {
    expect(detectarFimDeTurno('Este é o fim de turno.')).toBe(true);
    expect(detectarFimDeTurno('Fim De Turno')).toBe(true);
  });

  it('detecta "fim do turno"', () => {
    expect(detectarFimDeTurno('Chegamos ao fim do turno.')).toBe(true);
    expect(detectarFimDeTurno('FIM DO TURNO!')).toBe(true);
  });

  it('detecta "turno completo"', () => {
    expect(detectarFimDeTurno('Seu turno completo.')).toBe(true);
  });

  it('detecta "turno finalizado"', () => {
    expect(detectarFimDeTurno('O turno finalizado com sucesso.')).toBe(true);
  });

  it('detecta "turno encerrado"', () => {
    expect(detectarFimDeTurno('Turno encerrado!')).toBe(true);
    expect(detectarFimDeTurno('TURNO ENCERRADO')).toBe(true);
  });

  it('detecta "passando a vez"', () => {
    expect(detectarFimDeTurno('O guerreiro está passando a vez.')).toBe(true);
  });

  it('detecta "passa a vez"', () => {
    expect(detectarFimDeTurno('Ele passa a vez ao mago.')).toBe(true);
  });

  it('detecta "agora é a vez de"', () => {
    expect(detectarFimDeTurno('Agora é a vez de Kael agir!')).toBe(true);
    expect(detectarFimDeTurno('agora é a vez de outro personagem')).toBe(true);
  });

  it('detecta "turno de [nome] termina"', () => {
    expect(detectarFimDeTurno('O turno de [Kael] termina.')).toBe(true);
    expect(detectarFimDeTurno('turno de [Elara] termina aqui')).toBe(true);
  });

  it('detecta "turno de [nome com espaços] termina"', () => {
    expect(detectarFimDeTurno('O turno de [Sir Galahad] termina.')).toBe(true);
  });

  // ── Keyword embedded in longer narrative ────────────────────────────

  it('detecta palavra-chave no meio de texto longo', () => {
    const narrativa =
      'O dragão cospe fogo, mas o escudo protege o grupo. ' +
      'Com isso, chegamos ao fim do turno. Descansem enquanto podem.';
    expect(detectarFimDeTurno(narrativa)).toBe(true);
  });

  // ── Negative matches ────────────────────────────────────────────────

  it('retorna false para narrativa sem sinal de fim', () => {
    expect(detectarFimDeTurno('O guerreiro ataca o dragão com sua espada.')).toBe(false);
  });

  it('retorna false para texto parcial que não bate com regex', () => {
    // "turno" sozinho nao basta
    expect(detectarFimDeTurno('Estamos no turno 3.')).toBe(false);
    // "fim" sozinho nao basta
    expect(detectarFimDeTurno('O fim está próximo.')).toBe(false);
    // "passa" sem "a vez"
    expect(detectarFimDeTurno('O tempo passa devagar.')).toBe(false);
  });

  it('retorna false quando "turno de" nao tem colchetes', () => {
    // O regex exige [nome] com colchetes
    expect(detectarFimDeTurno('turno de Kael termina')).toBe(false);
  });

  // ── Edge cases ──────────────────────────────────────────────────────

  it('retorna false para null', () => {
    expect(detectarFimDeTurno(null)).toBe(false);
  });

  it('retorna false para undefined', () => {
    expect(detectarFimDeTurno(undefined)).toBe(false);
  });

  it('retorna false para string vazia', () => {
    expect(detectarFimDeTurno('')).toBe(false);
  });

  it('retorna false para numero zero (falsy)', () => {
    expect(detectarFimDeTurno(0)).toBe(false);
  });

  it('retorna false para false (boolean)', () => {
    expect(detectarFimDeTurno(false)).toBe(false);
  });
});

describe('deveContarNoTurno', () => {
  // ── Tipos que NÃO devem contar ──────────────────────────────────────

  it('nao conta mensagens do tipo "dado"', () => {
    expect(deveContarNoTurno('dado')).toBe(false);
  });

  it('nao conta mensagens do tipo "dice_roll"', () => {
    expect(deveContarNoTurno('dice_roll')).toBe(false);
  });

  it('nao conta mensagens do tipo "loading"', () => {
    expect(deveContarNoTurno('loading')).toBe(false);
  });

  it('nao conta mensagens do tipo "sistema"', () => {
    expect(deveContarNoTurno('sistema')).toBe(false);
  });

  it('nao conta mensagens do tipo "roleplay"', () => {
    expect(deveContarNoTurno('roleplay')).toBe(false);
  });

  // ── Tipos que DEVEM contar ──────────────────────────────────────────

  it('conta mensagens do tipo "jogador"', () => {
    expect(deveContarNoTurno('jogador')).toBe(true);
  });

  it('conta mensagens do tipo "mestre"', () => {
    expect(deveContarNoTurno('mestre')).toBe(true);
  });

  it('conta mensagens do tipo "narrativa"', () => {
    expect(deveContarNoTurno('narrativa')).toBe(true);
  });

  it('conta mensagens do tipo "acao"', () => {
    expect(deveContarNoTurno('acao')).toBe(true);
  });

  it('conta mensagens de qualquer tipo desconhecido', () => {
    expect(deveContarNoTurno('combate')).toBe(true);
    expect(deveContarNoTurno('chat')).toBe(true);
    expect(deveContarNoTurno('foo_bar_baz')).toBe(true);
  });

  // ── Edge cases ──────────────────────────────────────────────────────

  it('conta quando tipo e undefined (nao esta na lista de ignorados)', () => {
    expect(deveContarNoTurno(undefined)).toBe(true);
  });

  it('conta quando tipo e null', () => {
    expect(deveContarNoTurno(null)).toBe(true);
  });

  it('conta quando tipo e string vazia', () => {
    expect(deveContarNoTurno('')).toBe(true);
  });

  it('diferencia maiusculas (lista usa minusculas)', () => {
    // "Dado" nao esta na lista que contem "dado"
    expect(deveContarNoTurno('Dado')).toBe(true);
    expect(deveContarNoTurno('LOADING')).toBe(true);
    expect(deveContarNoTurno('Sistema')).toBe(true);
  });
});
