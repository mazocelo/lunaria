/**
 * Condensa um roteiro completo em um resumo compacto (~2000 chars)
 * para injetar no system prompt do Mestre sem estourar o contexto.
 */

const MAX_CONDENSED_CHARS = 2500;

/**
 * @param {Object} roteiro - JSON completo do roteiro (12 seções)
 * @param {Object} [estadoAtual] - Estado atual da sessão (arco, local, etc)
 * @returns {string} Texto condensado para injection no prompt
 */
export function condensarRoteiro(roteiro, estadoAtual = null) {
  if (!roteiro || typeof roteiro !== 'object') return '';

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

export default condensarRoteiro;
