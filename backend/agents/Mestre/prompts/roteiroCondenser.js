/**
 * Condensa um roteiro completo em um resumo compacto (~2000 chars)
 * para injetar no system prompt do Mestre sem estourar o contexto.
 *
 * BLUEPRINT_V2: Quando ativo, inclui instruções do Mestre por arco,
 * segredos de NPCs, diálogos exemplo, e plot twists detalhados.
 */
import { isEnabled } from '../../../config/featureFlags.js';

const MAX_CONDENSED_CHARS = 2500;
const MAX_CONDENSED_CHARS_V2 = 4000;

/**
 * @param {Object} roteiro - JSON completo do roteiro (12 seções)
 * @param {Object} [estadoAtual] - Estado atual da sessão (arco, local, etc)
 * @returns {string} Texto condensado para injection no prompt
 */
export function condensarRoteiro(roteiro, estadoAtual = null) {
  if (!roteiro || typeof roteiro !== 'object') return '';

  if (isEnabled('BLUEPRINT_V2')) {
    return condensarRoteiroV2(roteiro, estadoAtual);
  }

  const parts = [];

  // 1. Sinopse (sempre incluída, truncada)
  if (roteiro.sinopse) {
    const sinopse = roteiro.sinopse.length > 400
      ? roteiro.sinopse.substring(0, 400) + '...'
      : roteiro.sinopse;
    parts.push(`**SINOPSE:** ${sinopse}`);
  }

  // 2. Antagonista (resumo curto)
  if (roteiro.antagonista) {
    const ant = roteiro.antagonista;
    parts.push(`**ANTAGONISTA:** ${ant.nome}${ant.titulo ? ` (${ant.titulo})` : ''} — ${(ant.motivacao || '').substring(0, 150)}`);
  }

  // 3. Arco atual (ou todos se não há estado)
  if (roteiro.arcos?.length) {
    const arcoAtual = estadoAtual?.arcoAtual || roteiro.progressao?.arco_atual || 1;
    const arco = roteiro.arcos.find(a => a.numero === arcoAtual) || roteiro.arcos[0];
    parts.push(`**ARCO ATUAL (${arco.numero}/${roteiro.arcos.length}): "${arco.titulo}"** — ${arco.descricao?.substring(0, 200) || ''}`);
    if (arco.objetivos?.length) {
      parts.push(`Objetivos: ${arco.objetivos.join('; ')}`);
    }
    // Preview próximo arco
    const proximo = roteiro.arcos.find(a => a.numero === arcoAtual + 1);
    if (proximo) {
      parts.push(`Próximo arco: "${proximo.titulo}"`);
    }
  }

  // 4. NPCs relevantes (filtrados pelo arco/local atual, ou top 5)
  if (roteiro.npcs?.length) {
    const npcsRelevantes = roteiro.npcs.slice(0, 6);
    const npcList = npcsRelevantes.map(n =>
      `${n.nome} (${n.papel}) — ${(n.descricao || '').substring(0, 60)}`
    ).join('\n  ');
    parts.push(`**NPCs ATIVOS:**\n  ${npcList}`);
  }

  // 5. Locais relevantes (top 4)
  if (roteiro.locais?.length) {
    const arcoAtual = estadoAtual?.arcoAtual || roteiro.progressao?.arco_atual || 1;
    const locaisArco = roteiro.locais.filter(l => l.arco_relacionado === arcoAtual);
    const locaisUsar = locaisArco.length > 0 ? locaisArco.slice(0, 4) : roteiro.locais.slice(0, 4);
    const locaisList = locaisUsar.map(l => `${l.nome} (${l.tipo}) — ${(l.descricao || '').substring(0, 60)}`).join('; ');
    parts.push(`**LOCAIS:** ${locaisList}`);
  }

  // 6. Plot twists pendentes (sem spoilar, só indicar que há surpresas)
  if (roteiro.plotTwists?.length) {
    const arcoAtual = estadoAtual?.arcoAtual || roteiro.progressao?.arco_atual || 1;
    const twistsRelevantes = roteiro.plotTwists.filter(t => {
      const match = t.momento?.match(/arco\s*(\d+)/i);
      return match ? parseInt(match[1]) >= arcoAtual : true;
    });
    if (twistsRelevantes.length > 0) {
      parts.push(`**REVIRAVOLTAS PLANEJADAS:** ${twistsRelevantes.length} plot twists pendentes. Próximo: "${twistsRelevantes[0].momento}"`);
    }
  }

  // 7. Encontros-chave do arco atual
  if (roteiro.encontrosChave?.length) {
    const arcoAtual = estadoAtual?.arcoAtual || roteiro.progressao?.arco_atual || 1;
    const encontros = roteiro.encontrosChave.filter(e => e.arco_relacionado === arcoAtual);
    if (encontros.length > 0) {
      const lista = encontros.map(e => `${e.nome} (${e.tipo}, ${e.dificuldade})`).join(', ');
      parts.push(`**ENCONTROS DO ARCO:** ${lista}`);
    }
  }

  // 8. Instruções do mestre (resumo)
  if (roteiro.instrucoesGeraisParaOMestre) {
    const inst = roteiro.instrucoesGeraisParaOMestre;
    if (inst.tom_narrativo) {
      parts.push(`**TOM:** ${inst.tom_narrativo.substring(0, 150)}`);
    }
  }

  // 9. Progressão
  if (roteiro.progressao) {
    const marcos = roteiro.progressao.marcos || [];
    const concluidos = marcos.filter(m => m.concluido).length;
    parts.push(`**PROGRESSÃO:** ${concluidos}/${marcos.length} marcos concluídos (${roteiro.progressao.porcentagem_estimada || 0}%)`);
  }

  let resultado = parts.join('\n\n');

  // Truncar se necessário
  if (resultado.length > MAX_CONDENSED_CHARS) {
    resultado = resultado.substring(0, MAX_CONDENSED_CHARS);
    const lastNewline = resultado.lastIndexOf('\n');
    if (lastNewline > MAX_CONDENSED_CHARS * 0.7) {
      resultado = resultado.substring(0, lastNewline);
    }
    resultado += '\n\n(Roteiro condensado — consulte o blueprint completo para mais detalhes)';
  }

  return resultado;
}

/**
 * Blueprint V2: Versão expandida com mais detalhes narrativos
 */
function condensarRoteiroV2(roteiro, estadoAtual = null) {
  const parts = [];
  const arcoAtual = estadoAtual?.arcoAtual || roteiro.progressao?.arco_atual || 1;

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

  // 4. NPCs (expandido com segredos e diálogos)
  if (roteiro.npcs?.length) {
    const npcsRelevantes = roteiro.npcs.slice(0, 8);
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

  // 6. Plot twists (expandido com gatilho e foreshadowing)
  if (roteiro.plotTwists?.length) {
    const twistsRelevantes = roteiro.plotTwists.filter(t => {
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

export default condensarRoteiro;
