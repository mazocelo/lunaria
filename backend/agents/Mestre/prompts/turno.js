/**
 * Prompts especificos para sistema de turnos
 */

/**
 * Criar prompt para turno do jogador
 */
export function criarPromptTurno(
  jogador,
  personagem,
  mensagem,
  rodada,
  turno,
  contadorMensagens,
  maxAcoesPorTurno = 4
) {
  const respostasRestantes = Math.max(0, maxAcoesPorTurno - contadorMensagens - 1);

  let prompt = `TURNO DO JOGADOR ${personagem} (Jogador: ${jogador})
Rodada: ${rodada} | Turno: ${turno} | Mensagem ${contadorMensagens + 1}/${maxAcoesPorTurno}

Mensagem do Jogador:
"${mensagem}"
`;

  if (contadorMensagens >= maxAcoesPorTurno - 1) {
    prompt += '\nIMPORTANTE: Este e o limite de interacoes deste turno. Finalize a acao de forma conclusiva e use fimDeTurno: true no JSON.\n';
  } else {
    prompt += `\nResponda de forma dinamica. Restam ${respostasRestantes} resposta(s). Se a acao estiver completamente resolvida, use fimDeTurno: true para avancar.\n`;
  }

  return prompt;
}

/**
 * Criar prompt para iniciar turno
 */
export function criarPromptInicioTurno(jogador, personagem, rodada, turno) {
  return `INICIO DO TURNO DE ${personagem} (${jogador})
Rodada: ${rodada} | Turno: ${turno + 1}

Dirija-se a ${personagem}:
1. Descreva a situacao atual do personagem
2. Apresente um desafio, obstaculo ou situacao interessante
3. Se a situacao exigir teste, solicite rolagem via solicitaDados no JSON
4. Termine com gancho narrativo para o jogador agir
5. Nao se narre em terceira pessoa; fale diretamente ao jogador, sem descrever suas proprias acoes

O que acontece com ${personagem}?`;
}

export default {
  criarPromptTurno,
  criarPromptInicioTurno
};
