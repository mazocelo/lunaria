#!/usr/bin/env node
/**
 * Canonical Runner — executes fixture scenarios against real AI models.
 *
 * Usage:
 *   node scripts/canonical-runner.js <cenarioId> [--model <groq|gemini|sonnet>] [--dry-run] [--all]
 *
 * The runner executes and records. It does NOT validate or decide pass/fail.
 * Logs are saved to tests/fixtures/frozen/{cenarioId}/{modelSlug}.json
 */
import dotenv from 'dotenv';
dotenv.config();

import { createHash, randomBytes } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from 'redis';

import { criarMestreRPG, parseIAJson } from '../agents/Mestre/MestreAgent.js';
import { resolverTeste } from '../helpers/testeHelper.js';
import { rolarDado } from '../helpers/combateHelper.js';

// ── Paths ──
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, '..');
const SCENARIOS_DIR = path.join(BACKEND_ROOT, 'tests', 'fixtures', 'scenarios');
const FROZEN_DIR = path.join(BACKEND_ROOT, 'tests', 'fixtures', 'frozen');

// ── Model mapping ──
const MODEL_MAP = {
  groq: 'llama-3.3-70b-versatile',
  gemini: 'gemini-2.5-flash',
  sonnet: 'claude-sonnet-4-6',
};
const ALL_SLUGS = Object.keys(MODEL_MAP);

// ── CLI parsing ──
function parseCLI(argv) {
  const args = argv.slice(2);
  const opts = { cenarioId: null, modelSlug: null, dryRun: false, all: false };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dry-run') { opts.dryRun = true; continue; }
    if (a === '--all') { opts.all = true; continue; }
    if (a === '--model') { opts.modelSlug = args[++i]; continue; }
    if (!a.startsWith('-')) { opts.cenarioId = a; }
  }

  if (!opts.cenarioId && !opts.all) {
    console.error('Usage: node scripts/canonical-runner.js <cenarioId> [--model groq|gemini|sonnet] [--dry-run] [--all]');
    process.exit(1);
  }
  if (opts.modelSlug && !MODEL_MAP[opts.modelSlug]) {
    console.error(`Unknown model slug "${opts.modelSlug}". Valid: ${ALL_SLUGS.join(', ')}`);
    process.exit(1);
  }
  return opts;
}

// ── Helpers ──
function generateRunId() {
  const now = new Date();
  const ts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '_',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
  const hex = randomBytes(2).toString('hex');
  return `run_${ts}_${hex}`;
}

function loadFixture(cenarioId) {
  const fp = path.join(SCENARIOS_DIR, `${cenarioId}.json`);
  const raw = readFileSync(fp, 'utf-8');
  const hash = createHash('sha256').update(raw).digest('hex').slice(0, 12);
  return { fixture: JSON.parse(raw), raw, hash };
}

function listAllScenarios() {
  return readdirSync(SCENARIOS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
    .sort();
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function log(msg) {
  console.log(`[runner] ${msg}`);
}

// ── State helpers ──

function buildJogadorState(fixture) {
  const ei = fixture.estadoInicial;
  return {
    hp: ei.hp,
    hpMax: ei.hpMax,
    mana: ei.mana,
    manaMax: ei.manaMax,
    status: [...(ei.status || [])],
    cooldowns: { ...(ei.cooldowns || {}) },
    xp: ei.xp || 0,
  };
}

function buildInimigosState(fixture) {
  return fixture.inimigos.map(ini => ({
    id: ini.id,
    nome: ini.nome,
    hp: ini.hp,
    hpMax: ini.hpMax,
    ataque: ini.ataque,
    dano: ini.dano,
    esquiva: ini.esquiva,
    armadura: ini.armadura,
    xp: ini.xp,
    status: [...(ini.status || [])],
  }));
}

function snapshotEstado(jogador, inimigos, combateAtivo) {
  return {
    jogador: deepClone(jogador),
    inimigos: deepClone(inimigos),
    combateAtivo,
  };
}

function tickCooldowns(cooldowns) {
  const updated = {};
  for (const [key, val] of Object.entries(cooldowns)) {
    if (val > 1) updated[key] = val - 1;
    // val <= 1: cooldown expired, drop from map
  }
  return updated;
}

function checkAllEnemiesDead(inimigos) {
  return inimigos.every(ini => ini.hp <= 0);
}

function checkParada(condicoes, ctx) {
  const checks = condicoes.qualquerUma || [];
  for (const c of checks) {
    if (c === 'acoes_esgotadas' && ctx.acoesEsgotadas) return c;
    if (c === 'combate_finalizado' && ctx.combateFinalizado) return c;
    if (c === 'jogador_derrotado' && ctx.jogadorDerrotado) return c;
    if (c === 'fim_de_arco' && ctx.fimDeArco) return c;
  }
  return null;
}

// ── Core runner for one scenario + one model ──

async function runScenario(cenarioId, modelSlug, opts = {}) {
  const { dryRun } = opts;
  const modelName = MODEL_MAP[modelSlug];
  const runId = generateRunId();
  const { fixture, hash: cenarioHash } = loadFixture(cenarioId);

  log(`cenarioId: ${cenarioId} | modelo: ${modelName} (${modelSlug})`);
  log(`runId: ${runId}`);

  if (dryRun) {
    log(`[dry-run] fixture loaded OK — ${fixture.acoes.length} acoes, ${fixture.inimigos.length} inimigos`);
    log(`[dry-run] cenarioHash: sha256:${cenarioHash}`);
    log(`[dry-run] modelo: ${modelName} (${modelSlug})`);
    log('[dry-run] Exiting without execution.');
    return;
  }

  const redisPrefix = `test_run_${runId}_${modelSlug}:`;
  const iniciadoEm = new Date().toISOString();
  const startTimeGlobal = Date.now();

  // ── Initialize log structure ──
  const runLog = {
    runId,
    cenarioId,
    cenarioVersao: fixture.versao,
    cenarioHash: `sha256:${cenarioHash}`,
    modelo: modelName,
    provider: modelSlug,
    redisPrefix,
    statusExecucao: 'concluida',
    erroExecucao: null,
    iniciadoEm,
    finalizadoEm: null,
    duracaoMs: 0,
    metricas: {
      turnosExecutados: 0,
      respostasParseadas: 0,
      errosParse: 0,
      rolagensAutomaticas: 0,
      latenciaMediaMs: 0,
      latenciaMaxMs: 0,
      tokensInput: null,
      tokensOutput: null,
      custoEstimado: null,
    },
    condicaoDeParada: null,
    turnos: [],
    estadoFinal: null,
  };

  // ── Redis ──
  let redis = null;

  try {
    redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    redis.on('error', () => {}); // suppress noisy logs during test
    await redis.connect();

    // ── Create mestre ──
    const mestreConfig = {
      modelo: modelName,
      ...(fixture.historia.mestreConfig || {}),
    };

    const personagemForMestre = {
      nome: fixture.personagem.nome,
      classe: fixture.personagem.classe,
      raca: fixture.personagem.raca,
      nivel: fixture.personagem.nivel,
      atributos: fixture.personagem.atributos,
      magias: fixture.personagem.magias || [],
      habilidades: fixture.personagem.habilidades || [],
      vantagens: fixture.personagem.vantagens || [],
      desvantagens: fixture.personagem.desvantagens || [],
      equipamentos: fixture.personagem.equipamentos || [],
    };

    const mestre = await criarMestreRPG(
      fixture.historia.temas || [],
      [personagemForMestre],
      mestreConfig,
      '',  // catalogo
      '',  // roteiroCondensado
      '',  // contextoPersistenteFormatado
      null // mestreContexto
    );

    // ── Game state ──
    let jogador = buildJogadorState(fixture);
    let inimigos = buildInimigosState(fixture);
    let combateAtivo = fixture.estadoInicial.emCombate || false;
    let currentTurno = 0;
    let chatHistory = [];
    let lastAIResponse = null;
    let condicaoDeParada = null;

    const totalAcoes = fixture.acoes.length;
    const latencies = [];

    // ── Execute actions ──
    for (let acaoIdx = 0; acaoIdx < totalAcoes; acaoIdx++) {
      const acao = fixture.acoes[acaoIdx];
      currentTurno++;

      // ── rolar_dado: conditional skip ──
      if (acao.tipo === 'rolar_dado' && acao.quando === 'se_solicitado') {
        const lastSolicita = lastAIResponse?.solicitaDados?.solicita === true;
        if (!lastSolicita) {
          log(`turno ${currentTurno}/${totalAcoes}: rolar_dado — SKIP (no solicita)`);
          currentTurno--; // don't count skipped action as a turno
          continue;
        }
      }

      const turnoStartTime = Date.now();
      const estadoAntes = snapshotEstado(jogador, inimigos, combateAtivo);

      let respostaBruta = null;
      let respostaIA = null;
      let respostaParseou = false;
      let erroParse = null;
      let resolucaoMecanica = null;
      let rolagemAutomatica = null;
      let iaCallStart = null;
      let tempoRespostaMs = 0;

      try {
        // ── Execute by action type ──
        if (acao.tipo === 'iniciar_turno') {
          log(`turno ${currentTurno}/${totalAcoes}: iniciar_turno...`);
          iaCallStart = Date.now();

          const result = await mestre.narrarTurnoJogador({
            jogador: { nome: fixture.personagem.nome, id: 'test_player' },
            personagem: personagemForMestre,
            mensagem: fixture.historia.prologo || 'O aventureiro chega ao local.',
            rodada: 1,
            turno: currentTurno,
            contadorMensagens: 0,
            chatHistory,
            resumo: null,
            runtimeOptions: { throwOnFailure: true },
          });

          tempoRespostaMs = Date.now() - iaCallStart;
          respostaBruta = result.resposta || JSON.stringify(result);
          respostaIA = {
            narracao: result.resposta || '',
            fimDeTurno: result.fimDeTurno || false,
            solicitaDados: result.solicitaDados || { solicita: false },
            acoes: result.acoes || [],
            metadados: result.metadados || {},
          };
          respostaParseou = true;
          lastAIResponse = respostaIA;

          // Track chat history
          chatHistory.push({ role: 'assistant', content: respostaBruta });

          // If AI initiated combat
          if (result.combate?.iniciado) combateAtivo = true;

        } else if (acao.tipo === 'mensagem') {
          const textoPreview = acao.texto.length > 40 ? acao.texto.slice(0, 40) + '...' : acao.texto;
          log(`turno ${currentTurno}/${totalAcoes}: mensagem "${textoPreview}"...`);

          iaCallStart = Date.now();

          // Map gameIntent to combatIntent for the internal API
          const acaoObj = {
            texto: acao.texto,
            combatIntent: acao.gameIntent || null,
          };

          const result = await mestre.narrarAcaoStream({
            jogador: { nome: fixture.personagem.nome, id: 'test_player' },
            personagem: personagemForMestre,
            acao: acaoObj,
            chatHistory,
            resumo: null,
            runtimeOptions: { throwOnFailure: true },
          }, {
            onStreamStart: () => {},
            onChunk: () => {},
            onStreamEnd: () => {},
            onError: () => {},
          });

          tempoRespostaMs = Date.now() - iaCallStart;
          respostaBruta = result.narracao || JSON.stringify(result);
          respostaIA = {
            narracao: result.narracao || '',
            fimDeTurno: result.fimDeTurno || false,
            solicitaDados: result.solicitaDados || { solicita: false },
            acoes: result.acoes || [],
            metadados: result.metadados || {},
          };
          respostaParseou = true;
          lastAIResponse = respostaIA;

          // Track chat history
          chatHistory.push({ role: 'user', content: acao.texto });
          chatHistory.push({ role: 'assistant', content: respostaBruta });

          // If combat action and parse succeeded, attempt mechanic resolution
          if (acao.gameIntent?.categoria === 'combate' && combateAtivo) {
            resolucaoMecanica = resolveSimplifiedCombat(acao.gameIntent, jogador, inimigos, fixture.personagem);
          }

          // If AI says combat started
          if (result.combate?.iniciado) combateAtivo = true;

        } else if (acao.tipo === 'rolar_dado') {
          // Already checked se_solicitado above — if we're here, solicita was true
          const d20 = Math.floor(Math.random() * 20) + 1;
          log(`turno ${currentTurno}/${totalAcoes}: rolar_dado (auto d20=${d20})...`);
          iaCallStart = Date.now();

          // Determine test type from last AI response
          const testInfo = lastAIResponse?.solicitaDados || {};
          const nomeTeste = testInfo.teste || testInfo.tipo || 'Ataque';
          const dificuldade = testInfo.dificuldade || testInfo.dc || 'Media';

          const resultado = resolverTeste(
            { ...fixture.personagem, ...fixture.personagem.atributos, nivel: fixture.personagem.nivel },
            nomeTeste,
            d20,
            dificuldade
          );

          tempoRespostaMs = Date.now() - iaCallStart;
          rolagemAutomatica = {
            dado: 'd20',
            resultado: d20,
            teste: nomeTeste,
            resolucao: resultado,
          };
          respostaBruta = JSON.stringify(resultado);
          respostaIA = null; // No AI call for dice rolls
          respostaParseou = true;

          // Apply combat results if applicable
          if (resultado.sucesso && combateAtivo) {
            const alvoId = findLastTargetId(fixture.acoes, acaoIdx);
            if (alvoId) {
              const dano = rolarDado(getDamageNotation(fixture.acoes, acaoIdx, fixture.personagem));
              const alvo = inimigos.find(ini => ini.id === alvoId);
              if (alvo && alvo.hp > 0) {
                const danoFinal = Math.max(0, dano - (alvo.armadura || 0));
                alvo.hp = Math.max(0, alvo.hp - danoFinal);
                resolucaoMecanica = {
                  tipo: 'ataque',
                  sucesso: true,
                  dano: danoFinal,
                  danoRolado: dano,
                  armadura: alvo.armadura || 0,
                  alvoId: alvo.id,
                  alvoHpRestante: alvo.hp,
                };
                if (alvo.hp === 0) {
                  alvo.status = ['derrotado'];
                }
              }
            }
          }

          runLog.metricas.rolagensAutomaticas++;
        }
      } catch (err) {
        // Try to parse the raw response if we got one
        if (respostaBruta) {
          const parsed = parseIAJson(respostaBruta);
          if (parsed) {
            respostaIA = parsed;
            respostaParseou = true;
          } else {
            respostaParseou = false;
            erroParse = {
              tipo: 'json_invalido',
              mensagem: err.message,
              trecho: String(respostaBruta).slice(0, 200),
            };
          }
        } else if (err.message === 'AI_TIMEOUT' || err.message === 'AI_STREAM_TIMEOUT') {
          erroParse = {
            tipo: 'timeout',
            mensagem: err.message,
            trecho: '',
          };
        } else {
          // Error during execution, but not fatal — record and continue
          erroParse = {
            tipo: 'json_invalido',
            mensagem: err.message,
            trecho: String(respostaBruta || '').slice(0, 200),
          };
        }
        tempoRespostaMs = iaCallStart ? Date.now() - iaCallStart : 0;
      }

      // ── Apply game state updates from AI actions ──
      if (respostaIA?.acoes && Array.isArray(respostaIA.acoes)) {
        for (const acaoIA of respostaIA.acoes) {
          applyAIAction(acaoIA, jogador, inimigos, fixture.personagem);
        }
      }

      // ── Apply mana/cooldown for gameIntent ──
      if (acao.gameIntent && acao.tipo === 'mensagem') {
        applyIntentCosts(acao.gameIntent, jogador, fixture.personagem);
      }

      // ── Mark defeated enemies ──
      for (const ini of inimigos) {
        if (ini.hp === 0 && !ini.status.includes('derrotado')) {
          ini.status = ['derrotado'];
        }
      }

      // ── Mark player defeated ──
      if (jogador.hp === 0 && !jogador.status.includes('derrotado')) {
        jogador.status = ['derrotado'];
      }

      // ── Tick cooldowns ──
      jogador.cooldowns = tickCooldowns(jogador.cooldowns);

      // ── Capture estadoApos ──
      const estadoApos = snapshotEstado(jogador, inimigos, combateAtivo);

      // ── Timing ──
      const tempoTurnoTotalMs = Date.now() - turnoStartTime;
      latencies.push(tempoRespostaMs);

      // ── Build turno log ──
      const turnoLog = {
        turno: currentTurno,
        acaoJogador: {
          tipo: acao.tipo,
          ...(acao.texto ? { texto: acao.texto } : {}),
          ...(acao.gameIntent ? { gameIntent: acao.gameIntent } : {}),
          ...(acao.quando ? { quando: acao.quando } : {}),
        },
        estadoAntes,
        respostaBruta: respostaBruta || null,
        respostaIA: respostaIA || null,
        respostaParseou,
        erroParse,
        resolucaoMecanica,
        rolagemAutomatica,
        estadoApos,
        tempoRespostaMs,
        tempoTurnoTotalMs,
      };
      runLog.turnos.push(turnoLog);

      // ── Metrics ──
      if (respostaParseou) runLog.metricas.respostasParseadas++;
      if (erroParse) runLog.metricas.errosParse++;

      // ── Log progress ──
      const okSuffix = respostaIA?.solicitaDados?.solicita
        ? ` — solicitaDados: true`
        : '';
      log(`turno ${currentTurno}/${totalAcoes}: OK (${tempoRespostaMs}ms)${okSuffix}`);

      // ── Check stop conditions ──
      const allDead = checkAllEnemiesDead(inimigos);
      if (allDead) combateAtivo = false;

      condicaoDeParada = checkParada(fixture.condicoesDeParada, {
        acoesEsgotadas: acaoIdx >= totalAcoes - 1,
        combateFinalizado: allDead,
        jogadorDerrotado: jogador.hp === 0,
        fimDeArco: respostaIA?.fimDeTurno && acaoIdx >= totalAcoes - 1,
      });

      if (condicaoDeParada) {
        log(`Condicao de parada: ${condicaoDeParada}`);
        break;
      }
    }

    // ── If no explicit stop condition, acoes_esgotadas is implicit ──
    if (!condicaoDeParada) {
      condicaoDeParada = 'acoes_esgotadas';
      log(`Condicao de parada: acoes_esgotadas (implicit)`);
    }

    // ── Determine result ──
    const allDead = checkAllEnemiesDead(inimigos);
    let resultado = 'indefinido';
    let resultadoDetalhe = null;
    if (allDead) {
      resultado = 'vitoria';
      resultadoDetalhe = 'ultimo_inimigo_derrotado';
      // Award XP
      const xpTotal = inimigos.reduce((sum, ini) => sum + (ini.xp || 0), 0);
      jogador.xp += xpTotal;
    } else if (jogador.hp === 0) {
      resultado = 'derrota';
      resultadoDetalhe = 'jogador_derrotado';
    }

    // ── Build estadoFinal ──
    runLog.estadoFinal = {
      jogador: {
        hp: jogador.hp,
        hpMax: jogador.hpMax,
        mana: jogador.mana,
        manaMax: jogador.manaMax,
        xpGanho: jogador.xp - (fixture.estadoInicial.xp || 0),
        status: jogador.status,
      },
      inimigos: inimigos.map(ini => ({
        id: ini.id,
        hp: ini.hp,
        hpMax: ini.hpMax,
        status: ini.status,
      })),
      combateAtivo,
      resultado,
      resultadoDetalhe,
    };

    // ── Finalize metrics ──
    runLog.condicaoDeParada = condicaoDeParada;
    runLog.metricas.turnosExecutados = runLog.turnos.length;
    runLog.metricas.latenciaMediaMs = latencies.length
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0;
    runLog.metricas.latenciaMaxMs = latencies.length ? Math.max(...latencies) : 0;

    // ── Check for parse failures ──
    if (runLog.metricas.errosParse > 0 && runLog.statusExecucao === 'concluida') {
      runLog.statusExecucao = 'falha_parsing';
    }

  } catch (err) {
    runLog.statusExecucao = 'erro_execucao';
    runLog.erroExecucao = {
      tipo: err.constructor.name,
      mensagem: err.message,
      stack: err.stack,
    };
    log(`ERRO: ${err.message}`);
  } finally {
    // ── Finalize timing ──
    runLog.finalizadoEm = new Date().toISOString();
    runLog.duracaoMs = Date.now() - startTimeGlobal;

    // ── Save log ──
    const outDir = path.join(FROZEN_DIR, cenarioId);
    mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, `${modelSlug}.json`);
    writeFileSync(outFile, JSON.stringify(runLog, null, 2), 'utf-8');
    log(`Log salvo: ${path.relative(BACKEND_ROOT, outFile)}`);

    // ── Cleanup Redis ──
    if (redis) {
      try {
        // Scan and delete all keys with our prefix
        let cursor = '0';
        do {
          const reply = await redis.scan(parseInt(cursor), { MATCH: `${redisPrefix}*`, COUNT: 100 });
          cursor = String(reply.cursor);
          if (reply.keys.length > 0) {
            await redis.del(reply.keys);
          }
        } while (cursor !== '0');
      } catch (redisErr) {
        // Ignore cleanup errors
      }
      try {
        await redis.quit();
      } catch (_) {}
    }
  }
}

// ── Simplified combat resolution (runner-side, not full engine) ──

function resolveSimplifiedCombat(gameIntent, jogador, inimigos, personagem) {
  if (!gameIntent || gameIntent.categoria !== 'combate') return null;

  const alvoId = gameIntent.alvo;
  const alvo = alvoId ? inimigos.find(ini => ini.id === alvoId) : null;

  // For the runner, we record intent but the actual damage is resolved
  // when dice are rolled (rolar_dado action). Return a placeholder.
  return {
    tipo: gameIntent.tipo,
    alvoId: alvoId || null,
    alvoNome: alvo?.nome || null,
    arma: gameIntent.arma || null,
    magiaId: gameIntent.magiaId || null,
    habilidadeId: gameIntent.habilidadeId || null,
    pendingRoll: true,
  };
}

// ── Apply costs from gameIntent ──

function applyIntentCosts(gameIntent, jogador, personagem) {
  if (!gameIntent) return;

  // Mana cost for spells
  if (gameIntent.magiaId) {
    const magia = personagem.magias?.find(m => m.id === gameIntent.magiaId);
    if (magia?.custo_mana) {
      jogador.mana = Math.max(0, jogador.mana - magia.custo_mana);
    }
  }

  // Cooldown for abilities
  if (gameIntent.habilidadeId) {
    const hab = personagem.habilidades?.find(h => h.id === gameIntent.habilidadeId);
    if (hab?.cooldown_turnos) {
      const cdKey = `hab_${hab.id}`;
      jogador.cooldowns[cdKey] = hab.cooldown_turnos;
    }
  }
}

// ── Apply AI-emitted actions ──

function applyAIAction(acaoIA, jogador, inimigos, personagem) {
  if (!acaoIA || !acaoIA.tipo) return;

  switch (acaoIA.tipo) {
    case 'aplicar_dano': {
      const alvo = inimigos.find(ini => ini.id === acaoIA.alvoId);
      if (alvo) {
        const dano = parseInt(acaoIA.valor) || 0;
        alvo.hp = Math.max(0, alvo.hp - dano);
        if (alvo.hp === 0) alvo.status = ['derrotado'];
      }
      break;
    }
    case 'curar': {
      const valor = parseInt(acaoIA.valor) || 0;
      jogador.hp = Math.min(jogador.hpMax, jogador.hp + valor);
      break;
    }
    case 'dar_xp': {
      const xp = parseInt(acaoIA.valor) || 0;
      jogador.xp += xp;
      break;
    }
    default:
      break;
  }
}

// ── Lookup helpers ──

function findLastTargetId(acoes, currentIdx) {
  // Walk backwards to find the last mensagem with a gameIntent that has an alvo
  for (let i = currentIdx - 1; i >= 0; i--) {
    if (acoes[i].gameIntent?.alvo) return acoes[i].gameIntent.alvo;
  }
  return null;
}

function getDamageNotation(acoes, currentIdx, personagem) {
  // Walk backwards to find the last mensagem with a gameIntent
  for (let i = currentIdx - 1; i >= 0; i--) {
    const intent = acoes[i].gameIntent;
    if (!intent) continue;

    if (intent.arma) {
      const equip = personagem.equipamentos?.find(e => e.id === intent.arma);
      if (equip?.dano) return equip.dano;
    }
    if (intent.magiaId) {
      const magia = personagem.magias?.find(m => m.id === intent.magiaId);
      if (magia?.dano_base) return magia.dano_base;
    }
    if (intent.habilidadeId) {
      const hab = personagem.habilidades?.find(h => h.id === intent.habilidadeId);
      if (hab?.dano_base) return hab.dano_base;
    }
  }
  return '1d6'; // fallback
}

// ── Main ──

async function main() {
  const opts = parseCLI(process.argv);
  const scenarios = opts.all ? listAllScenarios() : [opts.cenarioId];
  const slugs = opts.modelSlug ? [opts.modelSlug] : ALL_SLUGS;

  for (const cenarioId of scenarios) {
    for (const slug of slugs) {
      try {
        await runScenario(cenarioId, slug, { dryRun: opts.dryRun });
      } catch (err) {
        log(`FATAL for ${cenarioId}/${slug}: ${err.message}`);
      }
      if (!opts.dryRun) {
        log('---');
      }
    }
  }

  log('Done.');
}

main().catch(err => {
  console.error('[runner] Fatal error:', err);
  process.exit(1);
});
