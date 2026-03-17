/**
 * Gerenciamento de histórico de mensagens
 */

/**
 * Converte histórico para formato do LangChain
 */
export function converterHistoricoParaLangChain(mensagens) {
  if (!Array.isArray(mensagens)) {
    return [];
  }

  return mensagens.map(msg => {
    if (msg.tipo === 'jogador') {
      return {
        role: 'user',
        content: `Jogador: ${msg.jogador || msg.username}\nPersonagem: ${msg.personagem}\nAção: ${msg.mensagem || msg.acao}`
      };
    } else if (msg.tipo === 'mestre') {
      let content = msg.narracao || msg.mensagem || '';
      if (typeof content === 'string' && content.trimStart().startsWith('{')) {
        try {
          const parsed = JSON.parse(content);
          const segTexts = Array.isArray(parsed.segmentos)
            ? parsed.segmentos.map(s => s?.text).filter(Boolean).join('\n')
            : '';
          content = parsed.narrativa || segTexts || content;
        } catch { /* keep original */ }
      }
      if (content.length > 1500) {
        content = content.slice(0, 1500) + '...';
      }
      return {
        role: 'assistant',
        content
      };
    } else if (msg.tipo === 'resultado_teste') {
      const p = msg.payload || {};
      const desc = p.descricaoResultado || (p.sucesso === true ? 'Sucesso' : p.sucesso === false ? 'Falha' : 'Resultado inconclusivo');
      return {
        role: 'user',
        content: `[Resultado de teste] ${msg.username || 'Jogador'} rolou ${p.dice || 'd20'}: ${p.rolagemBruta || '?'} + ${p.totalModificador || 0} (${p.atributoNome || '?'}) = ${p.total || '?'} vs DC ${p.dc || '?'} → ${desc}`
      };
    }
    return null;
  }).filter(Boolean);
}

/**
 * Limita o histórico ao número máximo de mensagens
 */
export function limitarHistorico(mensagens, maxLength = 20) {
  if (!Array.isArray(mensagens) || mensagens.length <= maxLength) {
    return mensagens;
  }

  // Pega as mensagens mais recentes
  return mensagens.slice(-maxLength);
}

/**
 * Adiciona mensagem ao histórico
 */
export function adicionarMensagem(historico, mensagem) {
  const novoHistorico = [...(historico || []), mensagem];
  return limitarHistorico(novoHistorico);
}

export default {
  converterHistoricoParaLangChain,
  limitarHistorico,
  adicionarMensagem
};

