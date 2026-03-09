/**
 * Prompts específicos para narrativa entre rodadas
 */

/**
 * Criar prompt para transição entre rodadas
 */
export function criarPromptEntreRodadas(rodadaAnterior, proximaRodada, resumoAcoes = []) {
  const resumoTexto = resumoAcoes.length > 0
    ? `Resumo da Rodada ${rodadaAnterior}:\n${resumoAcoes.map((acao, idx) => `${idx + 1}. ${acao}`).join('\n')}`
    : `A rodada ${rodadaAnterior} foi concluída.`;

  return `FIM DA RODADA ${rodadaAnterior} — INÍCIO DA RODADA ${proximaRodada}

${resumoTexto}

Como Mestre:
1. Crie um NOVO DESAFIO ou situação para a Rodada ${proximaRodada}
2. Conecte com as ações da rodada anterior
3. Ofereça múltiplas possibilidades de resolução
4. Mantenha tensão e interesse

Narre a transição e apresente o novo desafio. Responda no formato JSON padrão.`;
}

export default {
  criarPromptEntreRodadas
};
