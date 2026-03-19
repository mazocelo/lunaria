import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executarRevisao, REVIEWER_CONFIG } from '../agents/Revisores/index.js';
import { buildReviewPrompt, parseReviewResponse } from '../agents/Revisores/unifiedReviewer.js';

describe('reviewPipeline (unified)', () => {
  describe('executarRevisao', () => {
    it('retorna reviewed:false quando REVIEWER_ENABLED é false', async () => {
      const original = REVIEWER_CONFIG.enabled;
      REVIEWER_CONFIG.enabled = false;
      try {
        const result = await executarRevisao({
          respostaIA: { narracao: 'test' },
          sessao: {},
          userId: 'u1',
        });
        expect(result.reviewed).toBe(false);
        expect(result.passed).toBe(true);
      } finally {
        REVIEWER_CONFIG.enabled = original;
      }
    });

    it('retorna reviewed:false quando narrativa é vazia', async () => {
      const result = await executarRevisao({
        respostaIA: { narracao: '' },
        sessao: {},
        userId: 'u1',
      });
      expect(result.reviewed).toBe(false);
    });

    it('retorna reviewed:false quando narracao é null', async () => {
      const result = await executarRevisao({
        respostaIA: {},
        sessao: {},
        userId: 'u1',
      });
      expect(result.reviewed).toBe(false);
    });
  });

  describe('unifiedToLegacy shape', () => {
    it('verdicts array tem 3 entries (mecanica, continuidade, gancho)', () => {
      const raw = JSON.stringify({
        aprovado: true,
        mecanica: { ok: true, problema: null },
        continuidade: { ok: true, problema: null },
        gancho: { ok: true, problema: null },
        correcao: null,
      });
      const parsed = parseReviewResponse(raw);
      // Simulate what executarRevisao does internally
      const verdicts = ['mecanica', 'continuidade', 'gancho'].map(key => ({
        reviewer: key,
        veredicto: parsed[key]?.ok ? 'ok' : 'problema',
        severidade: parsed[key]?.ok ? 'info' : 'error',
        notas: parsed[key]?.problema || '',
      }));
      expect(verdicts).toHaveLength(3);
      expect(verdicts[0].reviewer).toBe('mecanica');
      expect(verdicts[0].veredicto).toBe('ok');
    });
  });

  describe('buildReviewPrompt — claim flags', () => {
    it('formata claims validados e pendentes', () => {
      const prompt = buildReviewPrompt({
        narrativa: 'Moruxis ataca.',
        acaoJogador: 'ataco',
        claimFlags: [
          { claim: 'espada longa', tipo: 'item', status: 'ok', fonte: 'inventario', confidence: 1 },
          { claim: 'voa', tipo: 'habilidade', status: 'invalido', motivo: 'nao possui' },
        ],
      });
      expect(prompt).toContain('CLAIMS JÁ VALIDADOS');
      expect(prompt).toContain('espada longa');
      expect(prompt).toContain('ALEGAÇÕES PENDENTES');
      expect(prompt).toContain('voa');
    });
  });
});
