/**
 * BUG-02 / Defeito 2.1 — continue_stage e autoritativo.
 *
 * Verifica que `interagir` IGNORA a `etapa_proxima` devolvida pela IA quando
 * o jogador clica "continuar" (actionMode='continue_stage') e segue o
 * `defaultNext` da STAGE_POLICY do sistema. Cobre Lunaria, 3D&T e D&D 5e.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// IA devolve um destino DELIBERADAMENTE ERRADO; a policy deve sobrescrever.
const respostaIA = {
  mensagem: 'Equipamentos prontos.',
  sugestoes: [],
  etapa_proxima: 'background', // destino invalido de proposito
  atributos_sugeridos: null,
};

vi.mock('@langchain/core/runnables', () => ({
  RunnableSequence: {
    from: () => ({
      invoke: async () => ({ content: JSON.stringify(respostaIA) }),
    }),
  },
}));

// Catalogo nao deve tocar o banco neste teste de fluxo de controle.
// buildCatalogoCriacao alimenta o prompt (string); fetchData alimenta buildIdsPermitidos.
vi.mock('../agents/MestreCriador/catalogo/catalogoCriacao.js', () => ({
  buildCatalogoCriacao: async () => '',
  fetchData: async () => ({ racas: [], classes: [], vantagens: [], desvantagens: [] }),
  invalidarCacheCriacao: () => {},
}));

const { interagir } = await import('../agents/MestreCriador/MestreCriadorAgent.js');

describe('BUG-02 Defeito 2.1 — continue_stage autoritativo', () => {
  beforeEach(() => {
    respostaIA.etapa_proxima = 'background';
  });

  it('Lunaria: equipamentos + continue_stage avanca para grimorio', async () => {
    const r = await interagir({
      etapa: 'equipamentos',
      estado: { sistema: 'lunaria', nivel: 1 },
      mensagemJogador: 'continuar',
      actionMode: 'continue_stage',
      sistema: 'lunaria',
    });
    expect(r.etapa_proxima).toBe('grimorio');
  });

  it('3D&T: equipamentos + continue_stage avanca para magias', async () => {
    const r = await interagir({
      etapa: 'equipamentos',
      estado: { sistema: 'tresdet', nivel: 1 },
      mensagemJogador: 'continuar',
      actionMode: 'continue_stage',
      sistema: 'tresdet',
    });
    expect(r.etapa_proxima).toBe('magias');
  });

  it('D&D 5e: equipamentos + continue_stage avanca para spells', async () => {
    const r = await interagir({
      etapa: 'equipamentos',
      estado: { sistema: 'dnd5e', nivel: 1 },
      mensagemJogador: 'continuar',
      actionMode: 'continue_stage',
      sistema: 'dnd5e',
    });
    expect(r.etapa_proxima).toBe('spells');
  });

  it('reply (sem continuar): a etapa_proxima da IA NAO e forcada pela policy', async () => {
    // Numa etapa nao-manual, sem continue_stage, a IA decide (apos sanitizacao).
    // background nao e allowedNext de equipamentos -> sanitizeEtapaProxima cai no defaultNext.
    respostaIA.etapa_proxima = 'grimorio';
    const r = await interagir({
      etapa: 'equipamentos',
      estado: { sistema: 'lunaria', nivel: 1 },
      mensagemJogador: 'pergunta qualquer',
      actionMode: 'reply',
      sistema: 'lunaria',
    });
    // resolveContinueStage retorna null em reply, entao prevalece a etapa_proxima da IA.
    expect(r.etapa_proxima).toBe('grimorio');
  });
});
