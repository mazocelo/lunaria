/**
 * Prompts específicos para narração de ações
 */

export function criarPromptNarracao(jogador, personagem, acao) {
  return `Jogador: ${jogador}
Personagem: ${personagem}
Ação: ${acao}

INSTRUÇÕES PARA NARRAÇÃO:
- Narre o que acontece como resultado dessa ação
- AVALIE SE A AÇÃO É:
  * SIMPLES/SEGURA: Narre diretamente o resultado (ex: observar sala, conversar normalmente)
  * ARRISCADA/DIFÍCIL: Solicite rolagem de dados explicando consequências
  
- Se solicitar dados, use o formato:
  🎲 Role 1d20 para [teste]! (explique faixas de resultado)
  
- Mantenha a emoção e o suspense`;
}

export function criarPromptReacao(contexto, evento) {
  return `O mestre precisa reagir ao seguinte evento: ${evento}\n\nContexto atual: ${contexto}`;
}

export default {
  criarPromptNarracao,
  criarPromptReacao
};

