// tests/unifiedReviewer.test.js
import { describe, it, expect } from 'vitest';
import { buildReviewPrompt, parseReviewResponse, revisarNarrativa } from '../agents/Revisores/unifiedReviewer.js';

describe('unifiedReviewer', () => {
  describe('buildReviewPrompt', () => {
    it('inclui narrativa e ação do jogador', () => {
      const prompt = buildReviewPrompt({
        narrativa: 'O paladino avança com sua espada.',
        acaoJogador: 'ataco o dretch',
      });
      expect(prompt).toContain('O paladino avança com sua espada.');
      expect(prompt).toContain('ataco o dretch');
      expect(prompt).toContain('MECÂNICA');
      expect(prompt).toContain('CONTINUIDADE');
      expect(prompt).toContain('GANCHO');
    });

    it('inclui resultado mecânico quando presente', () => {
      const prompt = buildReviewPrompt({
        narrativa: 'Moruxis ataca o Dretch.',
        acaoJogador: 'ataco',
        resultadoMecanico: {
          ataqueJogador: { atacante: 'Moruxis', alvo: 'Dretch', rolagem: 17, acertou: true, dano: 8, critico: false, esquivou: false, derrotado: false },
        },
        personagemSnapshot: { nome: 'Moruxis', hp_atual: 20, hp_max: 20, mana_atual: 15, mana_max: 15 },
      });
      expect(prompt).toContain('RESULTADO MECÂNICO');
      expect(prompt).toContain('rolagem=17');
      expect(prompt).toContain('PERSONAGEM');
      expect(prompt).toContain('Moruxis');
    });

    it('omite resultado mecânico quando null', () => {
      const prompt = buildReviewPrompt({
        narrativa: 'O vento sopra.',
        acaoJogador: 'examino a sala',
      });
      expect(prompt).not.toContain('RESULTADO MECÂNICO');
    });

    it('inclui claims quando presentes', () => {
      const prompt = buildReviewPrompt({
        narrativa: 'Moruxis usa sua espada.',
        acaoJogador: 'ataco',
        claimFlags: [
          { claim: 'tem espada', tipo: 'item', status: 'ok', fonte: 'inventario', confidence: 1 },
          { claim: 'tem asas', tipo: 'item', status: 'invalido', motivo: 'nao encontrado' },
        ],
      });
      expect(prompt).toContain('CLAIMS JÁ VALIDADOS');
      expect(prompt).toContain('tem espada');
      expect(prompt).toContain('ALEGAÇÕES PENDENTES');
      expect(prompt).toContain('tem asas');
    });

    it('inclui roteiro quando presente', () => {
      const prompt = buildReviewPrompt({
        narrativa: 'O druida fala.',
        acaoJogador: 'falo com druida',
        roteiroCondensado: 'O druida é secretamente o vilão',
      });
      expect(prompt).toContain('ROTEIRO');
      expect(prompt).toContain('O druida é secretamente o vilão');
    });

    it('inclui histórico recente', () => {
      const prompt = buildReviewPrompt({
        narrativa: 'Continua.',
        acaoJogador: 'avanço',
        historicoRecente: [
          { tipo: 'mestre', message: 'Vocês entram na caverna.' },
          { tipo: 'mestre', message: 'Uma luz brilha ao fundo.' },
        ],
      });
      expect(prompt).toContain('HISTÓRICO RECENTE');
      expect(prompt).toContain('Vocês entram na caverna');
    });
  });

  describe('parseReviewResponse', () => {
    it('parseia JSON válido aprovado', () => {
      const raw = JSON.stringify({
        aprovado: true,
        mecanica: { ok: true, problema: null },
        continuidade: { ok: true, problema: null },
        gancho: { ok: true, problema: null },
        correcao: null,
      });
      const result = parseReviewResponse(raw);
      expect(result.aprovado).toBe(true);
      expect(result.mecanica.ok).toBe(true);
      expect(result.correcao).toBeNull();
    });

    it('parseia JSON com falha e correção', () => {
      const raw = JSON.stringify({
        aprovado: false,
        mecanica: { ok: false, problema: 'dano narrado maior que real' },
        continuidade: { ok: true, problema: null },
        gancho: { ok: true, problema: null },
        correcao: 'Narrativa corrigida aqui.',
      });
      const result = parseReviewResponse(raw);
      expect(result.aprovado).toBe(false);
      expect(result.mecanica.ok).toBe(false);
      expect(result.correcao).toBe('Narrativa corrigida aqui.');
    });

    it('retorna fail-open para JSON inválido', () => {
      const result = parseReviewResponse('not json at all');
      expect(result.aprovado).toBe(true);
    });

    it('retorna fail-open para null', () => {
      const result = parseReviewResponse(null);
      expect(result.aprovado).toBe(true);
    });

    it('retorna fail-open quando aprovado field missing', () => {
      const result = parseReviewResponse('{"mecanica":{"ok":true}}');
      expect(result.aprovado).toBe(true);
    });
  });

  describe('revisarNarrativa', () => {
    it('retorna aprovado com mock válido', async () => {
      const result = await revisarNarrativa({
        narrativa: 'O paladino avança.',
        acaoJogador: 'ataco',
        _mockResponse: JSON.stringify({
          aprovado: true,
          mecanica: { ok: true, problema: null },
          continuidade: { ok: true, problema: null },
          gancho: { ok: true, problema: null },
          correcao: null,
        }),
      });
      expect(result.aprovado).toBe(true);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('retorna fail-open em timeout', async () => {
      const result = await revisarNarrativa({
        narrativa: 'O paladino avança.',
        acaoJogador: 'ataco',
        _simulateTimeout: true,
      });
      expect(result.aprovado).toBe(true);
    });

    it('retorna fail-open em erro', async () => {
      const result = await revisarNarrativa({
        narrativa: 'O paladino avança.',
        acaoJogador: 'ataco',
        _mockResponse: null,
        _simulateError: true,
      });
      expect(result.aprovado).toBe(true);
    });
  });
});
