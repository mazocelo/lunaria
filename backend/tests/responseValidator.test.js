import { describe, it, expect, vi } from 'vitest';

// Mock the logger so pino is never loaded in tests
vi.mock('../helpers/logger.js', () => {
  const noop = () => {};
  const child = () => ({ warn: noop, info: noop, error: noop, debug: noop });
  return { default: { child, warn: noop, info: noop, error: noop, debug: noop } };
});

import { validateMestreResponse } from '../helpers/responseValidator.js';

// ── Helpers ───────────────────────────────────────────────────────────

/** Estado de jogo SEM combate ativo */
function estadoSemCombate(overrides = {}) {
  return { combate: { ativo: false }, ...overrides };
}

/** Estado de jogo COM combate ativo */
function estadoComCombate(overrides = {}) {
  return { combate: { ativo: true }, ...overrides };
}

// ═══════════════════════════════════════════════════════════════════════
// validateMestreResponse
// ═══════════════════════════════════════════════════════════════════════

describe('validateMestreResponse', () => {
  // ── Guard clause: retorna cedo para argumentos inválidos ────────────

  describe('guard clauses', () => {
    it('retorna undefined quando resposta e null', () => {
      expect(validateMestreResponse(null, estadoSemCombate())).toBeUndefined();
    });

    it('retorna undefined quando resposta e undefined', () => {
      expect(validateMestreResponse(undefined, estadoSemCombate())).toBeUndefined();
    });

    it('retorna undefined quando estadoJogo e null', () => {
      expect(validateMestreResponse({ fimDeTurno: true }, null)).toBeUndefined();
    });

    it('retorna undefined quando estadoJogo e undefined', () => {
      expect(validateMestreResponse({ fimDeTurno: true }, undefined)).toBeUndefined();
    });

    it('retorna undefined quando ambos sao null', () => {
      expect(validateMestreResponse(null, null)).toBeUndefined();
    });
  });

  // ── Sem combate: nenhuma mutação ────────────────────────────────────

  describe('sem combate ativo', () => {
    it('nao altera fimDeTurno:true quando combate nao esta ativo', () => {
      const resposta = { fimDeTurno: true };
      validateMestreResponse(resposta, estadoSemCombate());
      expect(resposta.fimDeTurno).toBe(true);
    });

    it('nao filtra acoes mudar_cenario fora de combate', () => {
      const resposta = {
        acoes: [
          { tipo: 'mudar_cenario', destino: 'floresta' },
          { tipo: 'atacar', alvo: 'goblin' },
        ],
      };
      validateMestreResponse(resposta, estadoSemCombate());
      expect(resposta.acoes).toHaveLength(2);
      expect(resposta.acoes[0].tipo).toBe('mudar_cenario');
    });

    it('nao remove metadados.local_atual fora de combate', () => {
      const resposta = { metadados: { local_atual: 'taverna' } };
      validateMestreResponse(resposta, estadoSemCombate());
      expect(resposta.metadados.local_atual).toBe('taverna');
    });

    it('nao altera resposta valida sem combate', () => {
      const resposta = {
        narrativa: 'O guerreiro avança.',
        fimDeTurno: false,
        acoes: [{ tipo: 'atacar', alvo: 'goblin' }],
        metadados: { local_atual: 'caverna' },
      };
      const copia = JSON.parse(JSON.stringify(resposta));
      validateMestreResponse(resposta, estadoSemCombate());
      expect(resposta).toEqual(copia);
    });
  });

  // ── Com combate ativo: mutações ─────────────────────────────────────

  describe('com combate ativo', () => {
    // fimDeTurno

    it('força fimDeTurno para false durante combate', () => {
      const resposta = { fimDeTurno: true };
      validateMestreResponse(resposta, estadoComCombate());
      expect(resposta.fimDeTurno).toBe(false);
    });

    it('nao altera fimDeTurno se ja for false durante combate', () => {
      const resposta = { fimDeTurno: false };
      validateMestreResponse(resposta, estadoComCombate());
      expect(resposta.fimDeTurno).toBe(false);
    });

    it('nao altera fimDeTurno quando nao e booleano true (ex: undefined)', () => {
      const resposta = {};
      validateMestreResponse(resposta, estadoComCombate());
      // O campo não existe e a condição `=== true` não bate
      expect(resposta.fimDeTurno).toBeUndefined();
    });

    // Filtragem de ações

    it('remove acoes do tipo mudar_cenario durante combate', () => {
      const resposta = {
        acoes: [
          { tipo: 'mudar_cenario', destino: 'deserto' },
          { tipo: 'atacar', alvo: 'dragao' },
          { tipo: 'mudar_cenario', destino: 'floresta' },
        ],
      };
      validateMestreResponse(resposta, estadoComCombate());
      expect(resposta.acoes).toHaveLength(1);
      expect(resposta.acoes[0].tipo).toBe('atacar');
    });

    it('mantem acoes de outros tipos durante combate', () => {
      const resposta = {
        acoes: [
          { tipo: 'atacar', alvo: 'goblin' },
          { tipo: 'defender' },
          { tipo: 'usar_habilidade', nome: 'Bola de Fogo' },
        ],
      };
      validateMestreResponse(resposta, estadoComCombate());
      expect(resposta.acoes).toHaveLength(3);
    });

    it('lida com lista de acoes vazia durante combate', () => {
      const resposta = { acoes: [] };
      validateMestreResponse(resposta, estadoComCombate());
      expect(resposta.acoes).toEqual([]);
    });

    it('nao toca acoes se campo nao for array', () => {
      const resposta = { acoes: 'nao_e_array' };
      validateMestreResponse(resposta, estadoComCombate());
      expect(resposta.acoes).toBe('nao_e_array');
    });

    it('nao toca acoes se campo nao existe', () => {
      const resposta = { narrativa: 'texto' };
      validateMestreResponse(resposta, estadoComCombate());
      expect(resposta.acoes).toBeUndefined();
    });

    // Remoção de metadados.local_atual

    it('remove metadados.local_atual durante combate', () => {
      const resposta = { metadados: { local_atual: 'arena', clima: 'chuvoso' } };
      validateMestreResponse(resposta, estadoComCombate());
      expect(resposta.metadados.local_atual).toBeUndefined();
      // Outros campos de metadados permanecem
      expect(resposta.metadados.clima).toBe('chuvoso');
    });

    it('nao falha se metadados nao existe durante combate', () => {
      const resposta = { fimDeTurno: true };
      // Nao deve lançar erro
      expect(() => validateMestreResponse(resposta, estadoComCombate())).not.toThrow();
      expect(resposta.fimDeTurno).toBe(false);
    });

    it('nao falha se metadados existe mas local_atual nao', () => {
      const resposta = { metadados: { clima: 'ensolarado' } };
      expect(() => validateMestreResponse(resposta, estadoComCombate())).not.toThrow();
      expect(resposta.metadados.clima).toBe('ensolarado');
    });
  });

  // ── Todas as mutações juntas ────────────────────────────────────────

  describe('mutacoes combinadas durante combate', () => {
    it('aplica todas as sanitizacoes simultaneamente', () => {
      const resposta = {
        fimDeTurno: true,
        acoes: [
          { tipo: 'mudar_cenario', destino: 'floresta' },
          { tipo: 'atacar', alvo: 'orc' },
        ],
        metadados: { local_atual: 'taverna', turno: 5 },
      };

      validateMestreResponse(resposta, estadoComCombate());

      // fimDeTurno forçado para false
      expect(resposta.fimDeTurno).toBe(false);
      // mudar_cenario removido
      expect(resposta.acoes).toHaveLength(1);
      expect(resposta.acoes[0].tipo).toBe('atacar');
      // local_atual removido, turno preservado
      expect(resposta.metadados.local_atual).toBeUndefined();
      expect(resposta.metadados.turno).toBe(5);
    });
  });

  // ── Estado de jogo: variações do campo combate ──────────────────────

  describe('variações do estadoJogo.combate', () => {
    it('trata combate.ativo === false como sem combate', () => {
      const resposta = { fimDeTurno: true };
      validateMestreResponse(resposta, { combate: { ativo: false } });
      expect(resposta.fimDeTurno).toBe(true);
    });

    it('trata combate ausente como sem combate', () => {
      const resposta = { fimDeTurno: true };
      validateMestreResponse(resposta, {});
      expect(resposta.fimDeTurno).toBe(true);
    });

    it('trata combate.ativo === "true" (string) como sem combate', () => {
      // Condição exige === true (booleano), string não bate
      const resposta = { fimDeTurno: true };
      validateMestreResponse(resposta, { combate: { ativo: 'true' } });
      expect(resposta.fimDeTurno).toBe(true);
    });

    it('trata combate.ativo === 1 (number) como sem combate', () => {
      const resposta = { fimDeTurno: true };
      validateMestreResponse(resposta, { combate: { ativo: 1 } });
      expect(resposta.fimDeTurno).toBe(true);
    });
  });

  // ── Resposta: objetos incomuns ───────────────────────────────────────

  describe('objetos de resposta incomuns', () => {
    it('lida com resposta sendo objeto vazio', () => {
      const resposta = {};
      expect(() => validateMestreResponse(resposta, estadoComCombate())).not.toThrow();
    });

    it('lida com resposta contendo campos extras desconhecidos', () => {
      const resposta = {
        campoDesconhecido: 42,
        outroExtra: [1, 2, 3],
        fimDeTurno: true,
      };
      validateMestreResponse(resposta, estadoComCombate());
      // Apenas fimDeTurno é alterado; campos extras permanecem
      expect(resposta.fimDeTurno).toBe(false);
      expect(resposta.campoDesconhecido).toBe(42);
      expect(resposta.outroExtra).toEqual([1, 2, 3]);
    });

    it('resposta mutada in-place (sem retornar nova copia)', () => {
      const resposta = { fimDeTurno: true };
      const mesmaRef = resposta;
      validateMestreResponse(resposta, estadoComCombate());
      // Deve ser o mesmo objeto
      expect(resposta).toBe(mesmaRef);
      expect(resposta.fimDeTurno).toBe(false);
    });
  });
});
