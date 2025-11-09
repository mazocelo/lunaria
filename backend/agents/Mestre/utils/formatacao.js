/**
 * Utilitários para formatação de mensagens
 */

/**
 * Formata mensagem do jogador para o mestre
 */
export function formatarMensagemJogador(jogador, personagem, mensagem) {
  return {
    tipo: 'jogador',
    jogador,
    personagem,
    mensagem,
    timestamp: new Date().toISOString()
  };
}

/**
 * Formata resposta do mestre
 */
export function formatarRespostaMestre(narracao, contexto = {}) {
  return {
    tipo: 'mestre',
    narracao,
    contexto,
    timestamp: new Date().toISOString()
  };
}

/**
 * Extrai informações de personagem de um objeto
 */
export function extrairInfoPersonagem(personagem) {
  if (typeof personagem === 'string') {
    return { nome: personagem };
  }
  
  return {
    nome: personagem.nome || personagem.personagemNome || 'Aventureiro',
    classe: personagem.classe || personagem.classe_nome || '',
    raca: personagem.raca || personagem.raca_nome || '',
    nivel: personagem.nivel || 1
  };
}

export default {
  formatarMensagemJogador,
  formatarRespostaMestre,
  extrairInfoPersonagem
};

