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
      return {
        role: 'assistant',
        content: msg.narracao || msg.mensagem
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

