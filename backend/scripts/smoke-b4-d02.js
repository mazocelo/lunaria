/**
 * Smoke test — B4-D02: Validação backend de compatibilidade, fallbacks e regressões
 *
 * Executa assertions síncronas sobre os módulos centrais do backlog-4.
 * Não requer Redis, DB ou LLM — tudo em memória.
 *
 * Uso: node Backend/scripts/smoke-b4-d02.js
 */

import assert from 'node:assert/strict';
import { condensarRoteiro } from '../agents/Mestre/prompts/roteiroCondenser.js';
import {
  extractSummarySignals,
  buildContextoResumo,
  buildBlueprintContext,
  applyResumoToSessao
} from '../agents/Mestre/contexto/mestreContextBuilder.js';
import { buildTurnState, formatTurnStateText } from '../helpers/turnStateBuilder.js';
import {
  normalizarTerrenoInput,
  getTerrenoLabel,
  migrarEstadoTaticoLegado,
  getBossResumo,
  getBatalhaGrandeResumo,
  getMissaoTaticaResumo,
  ensurePersonagemBucket
} from '../helpers/estadoTatico.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

// ── condensarRoteiro ─────────────────────────────────────────────────

console.log('\n── condensarRoteiro ──');

test('null roteiro retorna string vazia', () => {
  assert.equal(condensarRoteiro(null), '');
  assert.equal(condensarRoteiro(undefined), '');
  assert.equal(condensarRoteiro(42), '');
});

test('roteiro mínimo gera output', () => {
  const r = { sinopse: 'Uma aventura épica' };
  const out = condensarRoteiro(r);
  assert.ok(out.includes('SINOPSE'));
  assert.ok(out.includes('Uma aventura'));
});

test('estadoAtual null é seguro', () => {
  const r = { sinopse: 'Teste', npcs: [{ nome: 'Aldaric', papel: 'Mago' }] };
  const out = condensarRoteiro(r, null);
  assert.ok(out.length > 0);
});

test('NPCs priorizados por presença na cena', () => {
  const r = {
    sinopse: 'Teste',
    npcs: [
      { nome: 'NPC_A', papel: 'Guarda' },
      { nome: 'NPC_B', papel: 'Mago' },
      { nome: 'NPC_C', papel: 'Rei' }
    ]
  };
  const ctx = { npcs: ['NPC_C'], npcsEncontrados: ['NPC_B'] };
  const out = condensarRoteiro(r, ctx);
  const npcIdx_C = out.indexOf('NPC_C');
  const npcIdx_A = out.indexOf('NPC_A');
  assert.ok(npcIdx_C < npcIdx_A, 'NPC_C (presente) deve vir antes de NPC_A (sem score)');
});

test('twists ativados são excluídos', () => {
  const r = {
    sinopse: 'Teste',
    plotTwists: [
      { momento: 'arco 1', descricao: 'Twist 0' },
      { momento: 'arco 1', descricao: 'Twist 1' },
      { momento: 'arco 2', descricao: 'Twist 2' }
    ]
  };
  const ctx = { progressao: { twists_ativados: [0] } };
  const out = condensarRoteiro(r, ctx);
  assert.ok(!out.includes('Twist 0'), 'Twist 0 ativado não deve aparecer');
  assert.ok(out.includes('Twist 1') || out.includes('Twist 2'));
});

test('cena atual aparece no condensado', () => {
  const r = { sinopse: 'Teste' };
  const ctx = { cenaAtual: 'Taverna do Lobo', ambiente: 'Interior escuro' };
  const out = condensarRoteiro(r, ctx);
  assert.ok(out.includes('CENA ATUAL'));
  assert.ok(out.includes('Taverna do Lobo'));
});

test('contexto recente com objetivos e pistas', () => {
  const r = { sinopse: 'Teste' };
  const ctx = {
    objetivosAbertos: ['Encontrar a chave'],
    pistasDescobertas: ['Porta secreta no porão'],
    progressao: { notas: 'Grupo avançou ao segundo andar' }
  };
  const out = condensarRoteiro(r, ctx);
  assert.ok(out.includes('CONTEXTO RECENTE'));
  assert.ok(out.includes('Encontrar a chave'));
  assert.ok(out.includes('Porta secreta'));
});

// ── extractSummarySignals ────────────────────────────────────────────

console.log('\n── extractSummarySignals ──');

test('resumo antigo (sem seções v2)', () => {
  const resumo = `FATOS:\n- O grupo chegou à cidade\n\nITENS:\n- Jogador1: ganhou espada\n\nNPCS:\n- Aldaric: aliado`;
  const s = extractSummarySignals(resumo);
  assert.ok(s.fatosImportantes.length > 0);
  assert.ok(s.itensRelevantes.length > 0);
  assert.equal(s.cenarioAtual, null);
  assert.equal(s.moralGrupo, null);
});

test('resumo v2 com todas as seções', () => {
  const resumo = `FATOS:\n- Combate iniciado\n\nCENARIO_ATUAL:\n- Floresta Negra\n\nTERRENO_ATUAL:\n- Floresta densa com neblina\n\nRECURSOS_CONSUMIDOS:\n- HP: 50% gasto\n- Mana: 2 slots usados\n\nMORAL_GRUPO:\n- Determinado`;
  const s = extractSummarySignals(resumo);
  assert.equal(s.cenarioAtual, 'Floresta Negra');
  assert.equal(s.terrenoAtual, 'Floresta densa com neblina');
  assert.ok(s.recursosConsumidos.length >= 2);
  assert.equal(s.moralGrupo, 'Determinado');
});

test('string vazia retorna sinais vazios', () => {
  const s = extractSummarySignals('');
  assert.equal(s.fatosImportantes.length, 0);
  assert.equal(s.cenarioAtual, null);
});

// ── normalizarTerrenoInput / migração ────────────────────────────────

console.log('\n── estadoTatico ──');

test('normalizarTerrenoInput: string → objeto canônico', () => {
  const r = normalizarTerrenoInput('floresta densa');
  assert.deepEqual(r, { tipo: 'floresta densa', label: 'floresta densa', tags: [] });
});

test('normalizarTerrenoInput: objeto parcial', () => {
  const r = normalizarTerrenoInput({ tipo: 'caverna', label: 'Caverna Escura', tags: ['escuro'] });
  assert.equal(r.tipo, 'caverna');
  assert.equal(r.label, 'Caverna Escura');
  assert.deepEqual(r.tags, ['escuro']);
});

test('normalizarTerrenoInput: null/undefined → null', () => {
  assert.equal(normalizarTerrenoInput(null), null);
  assert.equal(normalizarTerrenoInput(undefined), null);
  assert.equal(normalizarTerrenoInput(''), null);
});

test('getTerrenoLabel: extrai label de objeto', () => {
  assert.equal(getTerrenoLabel({ label: 'X', tipo: 'Y' }), 'X');
  assert.equal(getTerrenoLabel({ tipo: 'Y' }), 'Y');
  assert.equal(getTerrenoLabel(null), null);
});

test('migrarEstadoTaticoLegado: string terreno → objeto', () => {
  const sessao = { estadoJogo: { terreno: 'pântano' } };
  migrarEstadoTaticoLegado(sessao);
  assert.equal(typeof sessao.estadoJogo.terreno, 'object');
  assert.equal(sessao.estadoJogo.terreno.tipo, 'pântano');
});

test('migrarEstadoTaticoLegado: terrenoEfeito → efeitos_terreno[]', () => {
  const sessao = {
    estadoJogo: {
      terrenoEfeito: { descricao: 'Lava', elemento: 'fogo', dano_por_turno: 5 }
    }
  };
  migrarEstadoTaticoLegado(sessao);
  assert.ok(Array.isArray(sessao.estadoJogo.efeitos_terreno));
  assert.equal(sessao.estadoJogo.efeitos_terreno[0].descricao, 'Lava');
  assert.equal(sessao.estadoJogo.terrenoEfeito, undefined);
});

test('migrarEstadoTaticoLegado: idempotente', () => {
  const sessao = { estadoJogo: { terreno: { tipo: 'ok', label: 'ok', tags: [] } } };
  migrarEstadoTaticoLegado(sessao);
  assert.equal(sessao.estadoJogo.terreno.tipo, 'ok');
});

test('migrarEstadoTaticoLegado: sessão vazia → sem erro', () => {
  migrarEstadoTaticoLegado(null);
  migrarEstadoTaticoLegado({});
  migrarEstadoTaticoLegado({ estadoJogo: null });
});

test('selectors null-safe', () => {
  assert.equal(getBossResumo(null), null);
  assert.equal(getBossResumo({}), null);
  assert.equal(getBatalhaGrandeResumo({ estadoJogo: {} }), null);
  assert.equal(getMissaoTaticaResumo({ estadoJogo: { missao_tatica: { status: 'concluida' } } }), null);
});

test('ensurePersonagemBucket cria bucket vazio', () => {
  const sessao = {};
  const bucket = ensurePersonagemBucket(sessao, 42);
  assert.ok(typeof bucket === 'object');
  assert.ok(sessao.estadoJogo.personagemSessao['42']);
});

// ── buildTurnState / formatTurnStateText ─────────────────────────────

console.log('\n── turnStateBuilder ──');

test('buildTurnState: sessão mínima sem crash', () => {
  const sessao = { estadoJogo: {}, mestreContexto: {} };
  const pc = { nome: 'Herói', atributos: { constituicao: 12, inteligencia: 10 }, nivel: 3 };
  const state = buildTurnState(sessao, '1', pc);
  assert.equal(state.nome, 'Herói');
  assert.ok(state.hp.max > 0);
});

test('formatTurnStateText: nunca gera [object Object]', () => {
  const sessao = {
    estadoJogo: {
      terreno: { tipo: 'caverna', label: 'Caverna Escura', tags: ['escuro', 'úmido'] },
      combate: { ativo: true, boss: { nome: 'Dragão', fase_atual: 2 } },
      batalha_grande: { ativa: true, nome: 'Batalha Final', objetivo: 'Derrotar o exército', frentes: [{ nome: 'Norte', status: 'ativa', progresso: 40 }] },
      missao_tatica: { descricao: 'Resgatar prisioneiros', objetivo: 'Resgatar todos', status: 'em_andamento', progresso: 60 }
    },
    mestreContexto: {}
  };
  const pc = { nome: 'Mago', atributos: { constituicao: 10, inteligencia: 14 }, nivel: 5 };
  const state = buildTurnState(sessao, '1', pc);
  const text = formatTurnStateText(state);
  assert.ok(!text.includes('[object Object]'), 'Não deve conter [object Object]');
  assert.ok(text.includes('Caverna Escura'));
  assert.ok(text.includes('escuro'));
  assert.ok(text.includes('Dragão'));
  assert.ok(text.includes('Batalha Final'));
  assert.ok(text.includes('Resgatar'));
});

test('formatTurnStateText: personagem sem desvantagens', () => {
  const sessao = { estadoJogo: {}, mestreContexto: {} };
  const pc = { nome: 'Guerreiro', atributos: { constituicao: 14 }, nivel: 2 };
  const state = buildTurnState(sessao, '1', pc);
  const text = formatTurnStateText(state);
  assert.ok(!text.includes('Desvantagens'), 'Sem desvantagens = sem linha de desvantagens');
});

// ── buildContextoResumo / buildBlueprintContext ──────────────────────

console.log('\n── builders de contexto ──');

test('buildContextoResumo: sessão vazia → null', () => {
  assert.equal(buildContextoResumo(null), null);
  assert.equal(buildContextoResumo({}), null);
  assert.equal(buildContextoResumo({ estadoJogo: {} }), null);
});

test('buildContextoResumo: com dados', () => {
  const sessao = {
    estadoJogo: {
      cenaAtual: 'Castelo',
      terreno: { tipo: 'pedra', label: 'Corredor de Pedra', tags: ['frio'] },
      tensao: 'alta'
    }
  };
  const ctx = buildContextoResumo(sessao);
  assert.ok(ctx);
  assert.equal(ctx.cenaAtual, 'Castelo');
  assert.ok(ctx.terreno.includes('Corredor de Pedra'));
  assert.equal(ctx.tensao, 'alta');
});

test('buildBlueprintContext: sessão vazia → objeto com nulls', () => {
  const ctx = buildBlueprintContext({});
  assert.equal(ctx.arcoAtual, null);
  assert.equal(ctx.cenaAtual, null);
  assert.deepEqual(ctx.npcs, []);
});

test('buildBlueprintContext: agrega estadoJogo + mestreContexto', () => {
  const sessao = {
    estadoJogo: { cenaAtual: 'Floresta', npcs: ['Ormund'] },
    mestreContexto: {
      sessao: { objetivosAbertos: ['Encontrar anel'], pistasDescobertas: ['Mapa antigo'] }
    }
  };
  const ctx = buildBlueprintContext(sessao);
  assert.equal(ctx.cenaAtual, 'Floresta');
  assert.deepEqual(ctx.npcs, ['Ormund']);
  assert.ok(ctx.objetivosAbertos.includes('Encontrar anel'));
  assert.ok(ctx.pistasDescobertas.includes('Mapa antigo'));
});

// ── applyResumoToSessao ──────────────────────────────────────────────

console.log('\n── applyResumoToSessao ──');

test('applyResumoToSessao: null-safe', () => {
  const sessao = applyResumoToSessao({}, null, null, null);
  assert.ok(sessao.mestreContexto);
});

test('applyResumoToSessao: persiste sinais v2', () => {
  const resumo = {
    resumo: `FATOS:\n- Evento\n\nCENARIO_ATUAL:\n- Montanha\n\nMORAL_GRUPO:\n- Unido`
  };
  const sessao = applyResumoToSessao({ estadoJogo: {} }, resumo);
  const ctx = sessao.mestreContexto?.sessao || {};
  assert.equal(ctx.cenarioAtual, 'Montanha');
  assert.equal(ctx.moralGrupo, 'Unido');
});

// ── Resultado ────────────────────────────────────────────────────────

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`  Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

process.exit(failed > 0 ? 1 : 0);
