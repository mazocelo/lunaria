/**
 * Prompts específicos para narração de ações
 */

export function criarPromptNarracao(jogador, personagem, acao) {
  return `Jogador: ${jogador}\nPersonagem: ${personagem}\nAção: ${acao}`;
}

export function criarPromptReacao(contexto, evento) {
  return `O mestre precisa reagir ao seguinte evento: ${evento}\n\nContexto atual: ${contexto}`;
}

export default {
  criarPromptNarracao,
  criarPromptReacao
};

