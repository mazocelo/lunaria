/**
 * Condensa um roteiro completo em um blueprint compacto (~4000 chars)
 * para injetar no system prompt do Mestre sem estourar o contexto.
 *
 * Inclui instruções do Mestre por arco, segredos de NPCs,
 * diálogos exemplo, e plot twists detalhados.
 */

import logger from '../../../helpers/logger.js';

const log = logger.child({ module: 'roteiroCondenser' });
const MAX_CONDENSED_CHARS_V2 = 4000;

/**
 * @param {Object} roteiro - JSON completo do roteiro (12 seções)
 * @param {Object} [estadoAtual] - Estado atual da sessão (arco, local, etc)
 * @returns {string} Texto condensado para injection no prompt
 */
export function condensarRoteiro(roteiro, estadoAtual = null) {
  if (!roteiro || typeof roteiro !== 'object') return '';
  const parts = [];
  const arcoAtual = estadoAtual?.arcoAtual || roteiro.progressao?.arco_atual || 1;
  const progressaoAtual = estadoAtual?.progressao || roteiro.progressao || null;

  // 1. Sinopse
  if (roteiro.sinopse) {
    const sinopse = roteiro.sinopse.length > 500
      ? roteiro.sinopse.substring(0, 500) + '...'
      : roteiro.sinopse;
    parts.push(`**SINOPSE:** ${sinopse}`);
  }

  // 2. Antagonista (expandido)
  if (roteiro.antagonista) {
    const ant = roteiro.antagonista;
    let antText = `**ANTAGONISTA:** ${ant.nome}${ant.titulo ? ` (${ant.titulo})` : ''}`;
    if (ant.motivacao) antText += `\n  Motivação: ${ant.motivacao.substring(0, 200)}`;
    if (ant.segredo) antText += `\n  Segredo: ${ant.segredo.substring(0, 150)}`;
    if (ant.fraqueza) antText += `\n  Fraqueza: ${ant.fraqueza.substring(0, 100)}`;
    parts.push(antText);
  }

  // 3. Arco atual (expandido com instruções do Mestre)
  if (roteiro.arcos?.length) {
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
    // Preview próximo arco
    const proximo = roteiro.arcos.find(a => a.numero === arcoAtual + 1);
    if (proximo) {
      arcoText += `\n  Próximo arco: "${proximo.titulo}" — ${(proximo.descricao || '').substring(0, 100)}`;
    }
    parts.push(arcoText);
  }

  // 3b. Cena/local atual (do contexto de sessão)
  const cenaParts = [];
  if (estadoAtual?.cenaAtual) cenaParts.push(`Local: ${estadoAtual.cenaAtual}`);
  if (estadoAtual?.ambiente && estadoAtual.ambiente !== estadoAtual?.cenaAtual) cenaParts.push(`Ambiente: ${estadoAtual.ambiente}`);
  if (cenaParts.length > 0) parts.push(`**CENA ATUAL:** ${cenaParts.join(' | ')}`);

  // 4. NPCs (priorizados por presença na cena e encontros)
  if (roteiro.npcs?.length) {
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
    parts.push(`**NPCs:**\n  ${npcLines}`);
  }

  // 5. Locais
  if (roteiro.locais?.length) {
    const locaisArco = roteiro.locais.filter(l => l.arco_relacionado === arcoAtual);
    const locaisUsar = locaisArco.length > 0 ? locaisArco.slice(0, 5) : roteiro.locais.slice(0, 5);
    const locaisList = locaisUsar.map(l => {
      let line = `${l.nome} (${l.tipo}) — ${(l.descricao || '').substring(0, 80)}`;
      if (l.segredo) line += ` [Segredo: ${l.segredo.substring(0, 60)}]`;
      return line;
    }).join('; ');
    parts.push(`**LOCAIS:** ${locaisList}`);
  }

  // 6. Plot twists (pendentes — exclui já ativados, foca em arco atual e futuros)
  if (roteiro.plotTwists?.length) {
    const twistsAtivados = new Set((progressaoAtual?.twists_ativados || []).map(t => typeof t === 'number' ? t : parseInt(t)).filter(n => !isNaN(n)));
    const twistsRelevantes = roteiro.plotTwists.filter((t, idx) => {
      if (twistsAtivados.has(idx) || twistsAtivados.has(idx + 1)) return false;
      const match = t.momento?.match(/arco\s*(\d+)/i);
      return match ? parseInt(match[1]) >= arcoAtual : true;
    }).slice(0, 4);
    if (twistsRelevantes.length > 0) {
      const twistLines = twistsRelevantes.map(t => {
        let line = `"${t.momento}" — ${(t.descricao || t.titulo || '').substring(0, 100)}`;
        if (t.gatilho) line += `\n    Gatilho: ${t.gatilho.substring(0, 80)}`;
        if (t.foreshadowing) line += `\n    Foreshadowing: ${t.foreshadowing.substring(0, 80)}`;
        return line;
      }).join('\n  ');
      parts.push(`**REVIRAVOLTAS:**\n  ${twistLines}`);
    }
  }

  // 7. Encontros-chave
  if (roteiro.encontrosChave?.length) {
    const encontros = roteiro.encontrosChave.filter(e => e.arco_relacionado === arcoAtual);
    if (encontros.length > 0) {
      const lista = encontros.map(e => {
        let line = `${e.nome} (${e.tipo}, ${e.dificuldade})`;
        if (e.recompensa) line += ` → ${e.recompensa}`;
        return line;
      }).join(', ');
      parts.push(`**ENCONTROS DO ARCO:** ${lista}`);
    }
  }

  // 8. Instruções do mestre (expandido)
  if (roteiro.instrucoesGeraisParaOMestre) {
    const inst = roteiro.instrucoesGeraisParaOMestre;
    let instText = '**INSTRUÇÕES DO MESTRE:**';
    if (inst.tom_narrativo) instText += `\n  Tom: ${inst.tom_narrativo.substring(0, 200)}`;
    if (inst.ritmo) instText += `\n  Ritmo: ${inst.ritmo.substring(0, 100)}`;
    if (inst.temas_evitar) instText += `\n  Evitar: ${inst.temas_evitar.substring(0, 100)}`;
    if (inst.dicas) instText += `\n  Dicas: ${inst.dicas.substring(0, 150)}`;
    parts.push(instText);
  }

  // 9. Progressão
  if (roteiro.progressao) {
    const marcos = roteiro.progressao.marcos || [];
    const concluidos = marcos.filter(m => m.concluido).length;
    const pendentes = marcos.filter(m => !m.concluido).slice(0, 3);
    let progText = `**PROGRESSÃO:** ${concluidos}/${marcos.length} marcos (${roteiro.progressao.porcentagem_estimada || 0}%)`;
    if (pendentes.length > 0) {
      progText += `\n  Próximos marcos: ${pendentes.map(m => m.descricao || m.nome).join('; ')}`;
    }
    parts.push(progText);
  }

  if (progressaoAtual?.npcs_encontrados?.length) {
    parts.push(`**NPCS ENCONTRADOS EM SESSÃO:** ${progressaoAtual.npcs_encontrados.slice(0, 10).join('; ')}`);
  }
  if (Array.isArray(estadoAtual?.npcs) && estadoAtual.npcs.length > 0) {
    parts.push(`**NPCS PRESENTES AGORA:** ${estadoAtual.npcs.slice(0, 10).join('; ')}`);
  }
  if (progressaoAtual?.twists_ativados?.length) {
    parts.push(`**TWISTS JÁ ATIVADOS:** ${progressaoAtual.twists_ativados.slice(0, 6).join(', ')}`);
  }
  if (Array.isArray(estadoAtual?.locaisVisitados) && estadoAtual.locaisVisitados.length > 0) {
    parts.push(`**LOCAIS JÁ VISITADOS:** ${estadoAtual.locaisVisitados.slice(0, 8).join('; ')}`);
  }

  // 10. Contexto recente da sessão (objetivos, pistas, notas de progressão)
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
  if (ctxRecente.length > 0) {
    parts.push(`**CONTEXTO RECENTE:**\n  ${ctxRecente.join('\n  ')}`);
  }

  let resultado = parts.join('\n\n');

  if (resultado.length > MAX_CONDENSED_CHARS_V2) {
    resultado = resultado.substring(0, MAX_CONDENSED_CHARS_V2);
    const lastNewline = resultado.lastIndexOf('\n');
    if (lastNewline > MAX_CONDENSED_CHARS_V2 * 0.7) {
      resultado = resultado.substring(0, lastNewline);
    }
    resultado += '\n\n(Blueprint V2 condensado)';
  }

  return resultado;
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
