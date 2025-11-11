/**
 * Prompts específicos para narrativa entre rodadas
 */

/**
 * Criar prompt para transição entre rodadas
 */
export function criarPromptEntreRodadas(rodadaAnterior, proximaRodada, resumoAcoes = []) {
  // Criar resumo das ações da rodada anterior
  const resumoTexto = resumoAcoes.length > 0 
    ? `Resumo da Rodada ${rodadaAnterior}:\n${resumoAcoes.map((acao, idx) => `${idx + 1}. ${acao}`).join('\n')}`
    : `A rodada ${rodadaAnterior} foi concluída.`;

  return `FIM DA RODADA ${rodadaAnterior} - INÍCIO DA RODADA ${proximaRodada}

${resumoTexto}

Como Mestre, você deve:
1. Criar um NOVO DESAFIO ou situação interessante para a Rodada ${proximaRodada}
2. Manter a narrativa empolgante e dinâmica
3. Dar aos jogadores novos objetivos ou obstáculos
4. Conectar a nova situação com as ações da rodada anterior

Narre a transição e apresente o novo desafio:`;
}

/**
 * Criar prompt para novo desafio
 */
export function criarPromptNovoDesafio(rodada, contextoAtual, historicoAcoes) {
  return `RODADA ${rodada} - NOVO DESAFIO

Contexto Atual:
${contextoAtual}

Histórico de Ações Recentes:
${historicoAcoes}

Como Mestre, crie um novo desafio que:
1. Seja apropriado para o nível dos jogadores
2. Conecte-se com as ações anteriores
3. Ofereça múltiplas possibilidades de resolução
4. Mantenha a tensão e o interesse da história

Apresente o desafio:`;
}

/**
 * Criar prompt para resumo de rodada
 */
export function criarPromptResumoRodada(rodada, acoesJogadores) {
  return `RESUMO DA RODADA ${rodada}

Ações dos Jogadores:
${acoesJogadores.map((acao, idx) => `${idx + 1}. ${acao.jogador} (${acao.personagem}): ${acao.descricao}`).join('\n')}

Como Mestre, resuma de forma épica os eventos desta rodada, destacando:
1. Momentos de glória
2. Consequências das ações
3. Mudanças no cenário
4. Preparação para o que vem a seguir

Resumo da Rodada:`;
}

export default {
  criarPromptEntreRodadas,
  criarPromptNovoDesafio,
  criarPromptResumoRodada
};

