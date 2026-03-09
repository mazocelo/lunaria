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
  * ARRISCADA/DIFÍCIL: Solicite rolagem de dados (o sistema aplica modificadores automaticamente)

- Se solicitar dados, use: 🎲 Role 1d20 para [nome do teste]!
- NÃO inclua faixas numéricas de resultado — o motor mecânico resolve sucesso/falha

- Mantenha a emoção e o suspense
- SEMPRE termine com um gancho narrativo para o jogador agir, como "O que você faz?", "Qual será sua próxima ação?" ou uma pergunta narrativa que estimule a continuidade`;
}

export function criarPromptReacao(contexto, evento) {
  return `O mestre precisa reagir ao seguinte evento: ${evento}\n\nContexto atual: ${contexto}`;
}

export default {
  criarPromptNarracao,
  criarPromptReacao
};

