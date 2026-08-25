/**
 * Condensa um roteiro completo em um blueprint compacto (~3000 chars)
 * para injetar no system prompt do Mestre sem estourar o contexto.
 *
 * Inclui instruções do Mestre por arco, segredos de NPCs,
 * diálogos exemplo, e plot twists detalhados.
 */

import logger from '../../../helpers/logger.js';

const log = logger.child({ module: 'roteiroCondenser' });
const MAX_CONDENSED_CHARS_V2 = 3000;

/**
 * @param {Object} roteiro - JSON completo do roteiro (12 seções)
 * @param {Object} [estadoAtual] - Estado atual da sessão (arco, local, etc)
 * @returns {string} Texto condensado para injection no prompt
 */
export function condensarRoteiro(roteiro, estadoAtual = null) {
  if (!roteiro || typeof roteiro !== 'object') return '';
  const arcoAtual = estadoAtual?.arcoAtual || roteiro.progressao?.arco_atual || 1;
  const progressaoAtual = estadoAtual?.progressao || roteiro.progressao || null;

  const sections = [];

  // --- Priority 1: Recent context / current state ---

  sections.push(buildCenaAtualSection(estadoAtual));
  sections.push(buildContextoRecenteSection(estadoAtual, progressaoAtual));
  sections.push(buildSessionStateSection(estadoAtual, progressaoAtual));

  // --- Priority 2: Core story context ---

  sections.push(buildSinopseSection(roteiro));
  sections.push(buildAntagonistSection(roteiro));
  sections.push(buildArcoAtualSection(roteiro, arcoAtual));
  sections.push(buildNpcsSection(roteiro, estadoAtual, arcoAtual));
  sections.push(buildLocaisSection(roteiro, arcoAtual));
  sections.push(buildEncontrosSection(roteiro, arcoAtual));
  sections.push(buildInstrucoesMestreSection(roteiro));
  sections.push(buildProgressaoSection(roteiro));

  // --- Priority 3: Plot twists (current arc with full detail) ---

  sections.push(buildCurrentArcTwistsSection(roteiro, arcoAtual, progressaoAtual));

  // --- Priority 4: Future arc twists (masked, spoiler-free) ---

  sections.push(buildFutureArcTwistsSection(roteiro, arcoAtual, progressaoAtual));

  return truncateBySections(sections);
}

// --- Section builders ---

function buildCenaAtualSection(estadoAtual) {
  const cenaParts = [];
  if (estadoAtual?.cenaAtual) cenaParts.push(`Local: ${estadoAtual.cenaAtual}`);
  if (estadoAtual?.ambiente && estadoAtual.ambiente !== estadoAtual?.cenaAtual) cenaParts.push(`Ambiente: ${estadoAtual.ambiente}`);
  if (cenaParts.length === 0) return null;
  return `**CENA ATUAL:** ${cenaParts.join(' | ')}`;
}

function buildContextoRecenteSection(estadoAtual, progressaoAtual) {
  const ctxRecente = [];
  if (estadoAtual?.objetivosAbertos?.length > 0) {
    ctxRecente.push(`Objetivos abertos: ${estadoAtual.objetivosAbertos.slice(0, 4).join('; ')}`);
  }
  if (estadoAtual?.pistasDescobertas?.length > 0) {
    ctxRecente.push(`Pistas: ${estadoAtual.pistasDescobertas.slice(0, 4).join('; ')}`);
  }
  if (progressaoAtual?.notas) {
    ctxRecente.push(`Nota de progressão: ${progressaoAtual.notas.substring(0, 120)}`);
  }
  if (ctxRecente.length === 0) return null;
  return `**CONTEXTO RECENTE:**\n  ${ctxRecente.join('\n  ')}`;
}

function buildSessionStateSection(estadoAtual, progressaoAtual) {
  const lines = [];
  if (progressaoAtual?.npcs_encontrados?.length) {
    lines.push(`NPCs encontrados em sessão: ${progressaoAtual.npcs_encontrados.slice(0, 10).join('; ')}`);
  }
  if (Array.isArray(estadoAtual?.npcs) && estadoAtual.npcs.length > 0) {
    lines.push(`NPCs presentes agora: ${estadoAtual.npcs.slice(0, 10).join('; ')}`);
  }
  if (progressaoAtual?.twists_ativados?.length) {
    lines.push(`Twists já ativados: ${progressaoAtual.twists_ativados.slice(0, 6).join(', ')}`);
  }
  if (Array.isArray(estadoAtual?.locaisVisitados) && estadoAtual.locaisVisitados.length > 0) {
    lines.push(`Locais já visitados: ${estadoAtual.locaisVisitados.slice(0, 8).join('; ')}`);
  }
  if (lines.length === 0) return null;
  return `**ESTADO DA SESSÃO:**\n  ${lines.join('\n  ')}`;
}

function buildSinopseSection(roteiro) {
  if (!roteiro.sinopse) return null;
  const sinopse = roteiro.sinopse.length > 500
    ? roteiro.sinopse.substring(0, 500) + '...'
    : roteiro.sinopse;
  return `**SINOPSE:** ${sinopse}`;
}

function buildAntagonistSection(roteiro) {
  if (!roteiro.antagonista) return null;
  const ant = roteiro.antagonista;
  let antText = `**ANTAGONISTA:** ${ant.nome}${ant.titulo ? ` (${ant.titulo})` : ''}`;
  if (ant.motivacao) antText += `\n  Motivação: ${ant.motivacao.substring(0, 200)}`;
  if (ant.segredo) antText += `\n  Segredo: ${ant.segredo.substring(0, 150)}`;
  if (ant.fraqueza) antText += `\n  Fraqueza: ${ant.fraqueza.substring(0, 100)}`;
  return antText;
}

function buildArcoAtualSection(roteiro, arcoAtual) {
  if (!roteiro.arcos?.length) return null;
  const arco = roteiro.arcos.find(a => a.numero === arcoAtual) || roteiro.arcos[0];
  let arcoText = `**ARCO ATUAL (${arco.numero}/${roteiro.arcos.length}): "${arco.titulo}"**\n  ${arco.descricao?.substring(0, 300) || ''}`;
  if (arco.objetivos?.length) {
    arcoText += `\n  Objetivos: ${arco.objetivos.join('; ')}`;
  }
  if (arco.instrucoes_mestre) {
    arcoText += `\n  Instruções para o Mestre: ${arco.instrucoes_mestre.substring(0, 200)}`;
  }
  if (arco.tom) {
    arcoText += `\n  Tom: ${arco.tom}`;
  }
  const proximo = roteiro.arcos.find(a => a.numero === arcoAtual + 1);
  if (proximo) {
    arcoText += `\n  Próximo arco: "${proximo.titulo}" — ${(proximo.descricao || '').substring(0, 100)}`;
  }
  return arcoText;
}

function buildNpcsSection(roteiro, estadoAtual, arcoAtual) {
  if (!roteiro.npcs?.length) return null;
  const npcsPresentes = new Set((estadoAtual?.npcs || []).map(n => typeof n === 'string' ? n.toLowerCase() : ''));
  const npcsEncontrados = new Set((estadoAtual?.npcsEncontrados || []).map(n => typeof n === 'string' ? n.toLowerCase() : ''));
  const scored = roteiro.npcs.map(n => {
    const nome = (n.nome || '').toLowerCase();
    let score = 0;
    if (npcsPresentes.has(nome)) score += 10;
    if (npcsEncontrados.has(nome)) score += 5;
    if (n.arco_relacionado === arcoAtual) score += 3;
    return { npc: n, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const npcsRelevantes = scored.slice(0, 8).map(s => s.npc);
  const npcLines = npcsRelevantes.map(n => {
    let line = `${n.nome} (${n.papel}) — ${(n.descricao || '').substring(0, 80)}`;
    if (n.segredo) line += `\n    [Segredo: ${n.segredo.substring(0, 100)}]`;
    if (n.dialogo_exemplo) line += `\n    [Diálogo: "${n.dialogo_exemplo.substring(0, 80)}"]`;
    return line;
  }).join('\n  ');
  return `**NPCs:**\n  ${npcLines}`;
}

// Placeholders que `blueprintService.normalizeLocais` grava quando o LLM nao
// preenche o campo. Sem filtrar, o Mestre lia "[Segredo: Nenhum segredo
// definido]" em todo local. Espelha PLACEHOLDERS do motor de mapas do frontend.
const PLACEHOLDERS_LOCAL = [/^nenhum/i, /^sem\s/i, /^n\/a$/i, /^-$/, /^nao definido/i];

function primeiroSegredoUtil(local) {
  // O schema grava `segredos` (array); o codigo antigo lia `segredo` (singular),
  // que nunca existiu — por isso NENHUM segredo de local chegava ao prompt.
  // O fallback para o singular fica por seguranca com roteiros antigos.
  const lista = Array.isArray(local?.segredos)
    ? local.segredos
    : (typeof local?.segredo === 'string' ? [local.segredo] : []);

  return lista
    .filter(s => typeof s === 'string')
    .map(s => s.trim())
    .find(s => s.length > 0 && !PLACEHOLDERS_LOCAL.some(p => p.test(s))) || null;
}

function buildLocaisSection(roteiro, arcoAtual) {
  if (!roteiro.locais?.length) return null;
  const locaisArco = roteiro.locais.filter(l => l.arco_relacionado === arcoAtual);
  const locaisUsar = locaisArco.length > 0 ? locaisArco.slice(0, 5) : roteiro.locais.slice(0, 5);
  const locaisList = locaisUsar.map(l => {
    let line = `${l.nome} (${l.tipo}) — ${(l.descricao || '').substring(0, 80)}`;
    const segredo = primeiroSegredoUtil(l);
    if (segredo) line += ` [Segredo: ${segredo.substring(0, 60)}]`;
    return line;
  }).join('; ');
  return `**LOCAIS:** ${locaisList}`;
}

function buildEncontrosSection(roteiro, arcoAtual) {
  if (!roteiro.encontrosChave?.length) return null;
  const encontros = roteiro.encontrosChave.filter(e => e.arco_relacionado === arcoAtual);
  if (encontros.length === 0) return null;
  const lista = encontros.map(e => {
    let line = `${e.nome} (${e.tipo}, ${e.dificuldade})`;
    if (e.recompensa) line += ` → ${e.recompensa}`;
    return line;
  }).join(', ');
  return `**ENCONTROS DO ARCO:** ${lista}`;
}

function buildInstrucoesMestreSection(roteiro) {
  if (!roteiro.instrucoesGeraisParaOMestre) return null;
  const inst = roteiro.instrucoesGeraisParaOMestre;
  let instText = '**INSTRUÇÕES DO MESTRE:**';
  if (inst.tom_narrativo) instText += `\n  Tom: ${inst.tom_narrativo.substring(0, 200)}`;
  if (inst.ritmo) instText += `\n  Ritmo: ${inst.ritmo.substring(0, 100)}`;
  if (inst.temas_evitar) instText += `\n  Evitar: ${inst.temas_evitar.substring(0, 100)}`;
  if (inst.dicas) instText += `\n  Dicas: ${inst.dicas.substring(0, 150)}`;
  return instText;
}

function buildProgressaoSection(roteiro) {
  if (!roteiro.progressao) return null;
  const marcos = roteiro.progressao.marcos || [];
  const concluidos = marcos.filter(m => m.concluido).length;
  const pendentes = marcos.filter(m => !m.concluido).slice(0, 3);
  let progText = `**PROGRESSÃO:** ${concluidos}/${marcos.length} marcos (${roteiro.progressao.porcentagem_estimada || 0}%)`;
  if (pendentes.length > 0) {
    progText += `\n  Próximos marcos: ${pendentes.map(m => m.descricao || m.nome).join('; ')}`;
  }
  return progText;
}

/**
 * Current arc twists: full detail with foreshadowing so Mestre can seed clues.
 */
function buildCurrentArcTwistsSection(roteiro, arcoAtual, progressaoAtual) {
  if (!roteiro.plotTwists?.length) return null;

  const twistsAtivados = buildTwistsAtivadosSet(progressaoAtual);
  const twistsArcoAtual = roteiro.plotTwists.filter((t, idx) => {
    if (twistsAtivados.has(idx) || twistsAtivados.has(idx + 1)) return false;
    const arcoDoTwist = extractArcNumber(t.momento);
    return arcoDoTwist === arcoAtual;
  }).slice(0, 4);

  if (twistsArcoAtual.length === 0) return null;

  const twistLines = twistsArcoAtual.map(t => {
    let line = `"${t.momento}" — ${(t.descricao || t.titulo || '').substring(0, 100)}`;
    if (t.gatilho) line += `\n    Gatilho: ${t.gatilho.substring(0, 80)}`;
    if (t.foreshadowing) line += `\n    Pista a semear (NÃO copie literal): ${t.foreshadowing.substring(0, 80)}`;
    return line;
  }).join('\n  ');
  return `**REVIRAVOLTAS (ARCO ATUAL):**\n  ${twistLines}`;
}

/**
 * Future arc twists: masked titles only — no trigger details, no foreshadowing.
 */
function buildFutureArcTwistsSection(roteiro, arcoAtual, progressaoAtual) {
  if (!roteiro.plotTwists?.length) return null;

  const twistsAtivados = buildTwistsAtivadosSet(progressaoAtual);
  const twistsFuturos = roteiro.plotTwists.filter((t, idx) => {
    if (twistsAtivados.has(idx) || twistsAtivados.has(idx + 1)) return false;
    const arcoDoTwist = extractArcNumber(t.momento);
    return arcoDoTwist !== null && arcoDoTwist > arcoAtual;
  });

  if (twistsFuturos.length === 0) return null;

  const maskedLines = twistsFuturos.map(t => {
    const arcoNum = extractArcNumber(t.momento);
    return `Arco ${arcoNum}: [Revelação pendente — será detalhada quando o arco iniciar]`;
  }).join('\n  ');
  return `**REVIRAVOLTAS (ARCOS FUTUROS):**\n  ${maskedLines}`;
}

// --- Helpers ---

function buildTwistsAtivadosSet(progressaoAtual) {
  return new Set(
    (progressaoAtual?.twists_ativados || [])
      .map(t => typeof t === 'number' ? t : parseInt(t))
      .filter(n => !isNaN(n))
  );
}

/**
 * Extracts the arc number from a twist's "momento" field (e.g. "arco 2" -> 2).
 * Returns null if no arc number is found (twist always included in current arc).
 */
function extractArcNumber(momento) {
  if (!momento) return null;
  const match = momento.match(/arco\s*(\d+)/i);
  return match ? parseInt(match[1]) : null;
}

/**
 * Truncates by dropping complete sections from the end until within budget.
 * Never cuts mid-section.
 */
function truncateBySections(sections) {
  const validSections = sections.filter(Boolean);

  let resultado = validSections.join('\n\n');
  if (resultado.length <= MAX_CONDENSED_CHARS_V2) return resultado;

  // Drop sections from the end (lowest priority) until we fit
  const includedSections = [...validSections];
  while (includedSections.length > 1) {
    includedSections.pop();
    resultado = includedSections.join('\n\n');
    if (resultado.length <= MAX_CONDENSED_CHARS_V2) return resultado;
  }

  // Single section still too long — hard truncate as last resort
  return includedSections[0].substring(0, MAX_CONDENSED_CHARS_V2 - 30) + '\n\n(Blueprint V2 condensado)';
}

/**
 * Atualiza progressão do blueprint com base no resumo mais recente.
 * Usa modelo barato para extrair arco atual, NPCs encontrados, twists ativados.
 * @param {Object} roteiro - Roteiro completo
 * @param {string} resumoTexto - Resumo da aventura recém-gerado
 * @param {Object|null} progressaoAnterior - Progressão salva anteriormente
 * @param {string} userId - ID do usuário (para tracking)
 * @returns {Promise<Object|null>} Nova progressão ou null se falhar
 */
export async function atualizarProgressao(roteiro, resumoTexto, progressaoAnterior = null, userId = null) {
  if (!roteiro || !resumoTexto) return null;

  try {
    const { ChatGroq } = await import('@langchain/groq');
    const { trackLLMUsage } = await import('../../../services/llmTracker.js');

    const model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      temperature: 0.1,
      maxTokens: 500
    });

    const arcosNomes = (roteiro.arcos || []).map(a => `${a.numero}: "${a.titulo}"`).join(', ');
    const npcsNomes = (roteiro.npcs || []).map(n => n.nome).join(', ');
    const twistsDesc = (roteiro.plotTwists || []).map((t, i) => `${i + 1}: "${t.momento || t.titulo}"`).join(', ');

    const prompt = `Analise o resumo da aventura e atualize a progressão do roteiro.

ARCOS: ${arcosNomes}
NPCs DO ROTEIRO: ${npcsNomes}
PLOT TWISTS: ${twistsDesc}

PROGRESSÃO ANTERIOR: ${progressaoAnterior ? JSON.stringify(progressaoAnterior) : 'nenhuma'}

RESUMO RECENTE:
${resumoTexto.substring(0, 1000)}

Responda APENAS com JSON válido:
{"arco_atual": <numero>, "npcs_encontrados": ["nome1"], "twists_ativados": [<indice>], "notas": "observação breve"}`;

    const startTime = Date.now();
    const response = await model.invoke(prompt);
    trackLLMUsage(response, { modelName: 'meta-llama/llama-4-scout-17b-16e-instruct', userId, startTime, agent: 'ProgressaoBlueprint' });

    // Parse JSON da resposta
    const text = response.content.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return progressaoAnterior;

    const parsed = JSON.parse(jsonMatch[0]);

    // Merge com progressão anterior
    return {
      arco_atual: parsed.arco_atual || progressaoAnterior?.arco_atual || 1,
      npcs_encontrados: [...new Set([
        ...(progressaoAnterior?.npcs_encontrados || []),
        ...(parsed.npcs_encontrados || [])
      ])],
      twists_ativados: [...new Set([
        ...(progressaoAnterior?.twists_ativados || []),
        ...(parsed.twists_ativados || [])
      ])],
      notas: parsed.notas || progressaoAnterior?.notas || '',
      atualizado_em: new Date().toISOString()
    };
  } catch (error) {
    log.warn({ err: error }, 'Falha ao atualizar progressao');
    return progressaoAnterior;
  }
}

export default condensarRoteiro;
