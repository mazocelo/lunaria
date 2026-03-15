/**
 * Prompts específicos para narração de ações
 */

export function criarPromptNarracao(jogador, personagem, acao) {
  return `Jogador: ${jogador}
Personagem: ${personagem}
Ação: ${acao}

INSTRUÇÕES:
- IMPORTANTE: Revise o histórico de chat antes de narrar. Não repita diálogos, descrições ou introduções que já ocorreram. Cada resposta deve avançar a história.
- Narre o resultado dessa ação
- Se SIMPLES/SEGURA: narre diretamente (observar sala, conversar)
- Se ARRISCADA/DIFÍCIL: solicite rolagem via solicitaDados no JSON e inclua 🎲 na narrativa
- NÃO inclua faixas numéricas — o sistema resolve automaticamente
- Mantenha emoção e suspense
- Termine com gancho narrativo para o jogador agir`;
}

export function criarPromptReacao(contexto, evento) {
  return `EVENTO: ${evento}

CONTEXTO ATUAL:
${contexto}

Como Mestre, narre a reação do mundo a este evento. Descreva consequências imediatas e possíveis desdobramentos. Mantenha consistência com o contexto.`;
}

export default {
  criarPromptNarracao,
  criarPromptReacao
};
