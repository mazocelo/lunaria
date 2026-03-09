/**
 * Prompts específicos para sistema de turnos
 */

/**
 * Criar prompt para turno do jogador
 */
export function criarPromptTurno(jogador, personagem, mensagem, rodada, turno, contadorMensagens) {
  let prompt = `TURNO DO JOGADOR ${personagem} (Jogador: ${jogador})
Rodada: ${rodada} | Turno: ${turno} | Mensagem ${contadorMensagens + 1}/4

Mensagem do Jogador:
"${mensagem}"
`;

  if (contadorMensagens >= 3) {
    prompt += `\n⚠️ IMPORTANTE: Este é o limite de interações deste turno. Finalize a ação de forma conclusiva e use fimDeTurno: true no JSON.\n`;
  } else {
    prompt += `\nResponda de forma dinâmica. Restam ${4 - contadorMensagens - 1} resposta(s). Se a ação estiver completamente resolvida, use fimDeTurno: true para avançar.\n`;
  }

  return prompt;
}

/**
 * Criar prompt para iniciar turno
 */
export function criarPromptInicioTurno(jogador, personagem, rodada, turno) {
  return `INÍCIO DO TURNO DE ${personagem} (${jogador})
Rodada: ${rodada} | Turno: ${turno + 1}

Como Mestre, dirija-se a ${personagem}:
1. Descreva a situação atual do personagem
2. Apresente um desafio, obstáculo ou situação interessante
3. Se a situação exigir teste, solicite rolagem via solicitaDados no JSON
4. Termine com gancho narrativo para o jogador agir

O que acontece com ${personagem}?`;
}

export default {
  criarPromptTurno,
  criarPromptInicioTurno
};
