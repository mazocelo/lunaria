import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── montarInputArbitro — prompt builder ──

describe('montarInputArbitro', () => {
  let montarInputArbitro;

  beforeEach(async () => {
    const mod = await import('../agents/Revisores/prompts/arbitroPrompt.js');
    montarInputArbitro = mod.montarInputArbitro;
  });

  it('inclui secao ALEGACOES DETECTADAS quando claimFlags presente', () => {
    const output = montarInputArbitro({
      narrativa: 'O guerreiro ataca com sua espada.',
      acaoJogador: 'eu ataco com a espada',
      claimFlags: [
        { claim: 'espada', tipo: 'item', status: 'ok', motivo: null },
        { claim: 'bola de fogo', tipo: 'habilidade', status: 'inexistente', motivo: 'nao encontrada na ficha' },
      ],
    });
    expect(output).toContain('ALEGACOES DETECTADAS');
    expect(output).toContain('espada');
    expect(output).toContain('bola de fogo');
    expect(output).toContain('inexistente');
  });

  it('nao inclui secao ALEGACOES quando claimFlags vazio', () => {
    const output = montarInputArbitro({
      narrativa: 'O guerreiro descansa.',
      acaoJogador: 'eu descanso',
      claimFlags: [],
    });
    expect(output).not.toContain('ALEGACOES DETECTADAS');
  });

  it('nao inclui secao ALEGACOES quando claimFlags undefined', () => {
    const output = montarInputArbitro({
      narrativa: 'O guerreiro descansa.',
      acaoJogador: 'eu descanso',
    });
    expect(output).not.toContain('ALEGACOES DETECTADAS');
  });

  it('inclui NARRATIVA e ACAO DO JOGADOR', () => {
    const output = montarInputArbitro({
      narrativa: 'Uma narrativa teste.',
      acaoJogador: 'uma acao teste',
    });
    expect(output).toContain('NARRATIVA DO MESTRE');
    expect(output).toContain('Uma narrativa teste');
    expect(output).toContain('ACAO DO JOGADOR');
    expect(output).toContain('uma acao teste');
  });

  it('inclui resultado mecanico quando presente', () => {
    const output = montarInputArbitro({
      narrativa: 'Ataque narrado.',
      acaoJogador: 'atacar',
      resultadoMecanico: {
        ataqueJogador: { rolagem: 15, acertou: true, esquivou: false, critico: false, dano: 8 },
      },
    });
    expect(output).toContain('RESULTADO MECANICO');
    expect(output).toContain('Ataque');
  });

  it('mostra "nenhum" quando sem resultado mecanico', () => {
    const output = montarInputArbitro({
      narrativa: 'Cena livre.',
      acaoJogador: 'conversar',
    });
    expect(output).toContain('nenhum');
  });

  it('inclui personagem quando presente', () => {
    const output = montarInputArbitro({
      narrativa: 'Teste.',
      acaoJogador: 'testar',
      personagem: {
        nome: 'Arthas',
        hp_atual: 25,
        hp_max: 40,
        mana_atual: 10,
        mana_max: 20,
        inventario: [{ nome: 'Espada' }],
        habilidadesClasse: [{ nome: 'Golpe' }],
      },
    });
    expect(output).toContain('Arthas');
    expect(output).toContain('HP=25/40');
    expect(output).toContain('Espada');
    expect(output).toContain('Golpe');
  });
});

// ── criarPromptArbitro — system prompt ──

describe('criarPromptArbitro', () => {
  it('retorna string com regras de validacao', async () => {
    const { criarPromptArbitro } = await import('../agents/Revisores/prompts/arbitroPrompt.js');
    const prompt = criarPromptArbitro();
    expect(typeof prompt).toBe('string');
    expect(prompt).toContain('arbitro');
    expect(prompt).toContain('JSON');
    expect(prompt).toContain('veredicto');
  });
});

// ── shouldTriggerReview — trigger logic ──
// Precisa mockar o config para controlar REVIEWER_ENABLED

describe('shouldTriggerReview', () => {
  it('retorna needsReview true por default (REVIEWER_ENABLED !== "false")', async () => {
    // O config ja foi importado e cached — default agora e enabled
    const { shouldTriggerReview } = await import('../agents/Revisores/triggerLogic.js');

    const result = shouldTriggerReview({
      combateAtivo: true,
      respostaIA: { narracao: 'Uma narrativa longa o suficiente para passar o filtro de 100 chars. Mais texto aqui para garantir que o teste funcione corretamente com margem.' },
      sessao: {},
      claimFlags: [],
    });

    // Quando enabled (default), combateAtivo aciona arbitro
    if (process.env.REVIEWER_ENABLED !== 'false') {
      expect(result.needsReview).toBe(true);
      expect(result.reviewers).toContain('arbitro');
    }
  });
});
