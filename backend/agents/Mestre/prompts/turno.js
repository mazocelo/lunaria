/**
 * Prompts específicos para sistema de turnos
 */

/**
 * Criar prompt para turno do jogador
 */
export function criarPromptTurno(jogador, personagem, mensagem, rodada, turno, contadorMensagens) {
  let prompt = `TURNO DO JOGADOR ${personagem} (Jogador: ${jogador})
Rodada: ${rodada} | Turno: ${turno} | Mensagem ${contadorMensagens + 1}/3

Mensagem do Jogador:
"${mensagem}"

`;

  // Se já houve 2 mensagens, avisar que é hora de finalizar
  if (contadorMensagens >= 2) {
    prompt += `\n⚠️ IMPORTANTE: Este é o limite de interações deste turno. Finalize a ação do jogador de forma conclusiva e prepare para passar para o próximo jogador.\n`;
  } else {
    prompt += `\nResponda à ação do jogador de forma dinâmica e envolvente. Você pode fazer até ${3 - contadorMensagens - 1} resposta(s) adicionais antes de finalizar o turno.\n`;
  }

  return prompt;
}

/**
 * Criar prompt para iniciar turno
 */
export function criarPromptInicioTurno(jogador, personagem, rodada, turno) {
  return `INÍCIO DO TURNO DE ${personagem} (${jogador})
Rodada: ${rodada} | Turno: ${turno + 1}

Como Mestre, dirija-se diretamente a ${personagem} e:
1. Descreva a situação atual em que o personagem se encontra
2. Apresente um desafio, obstáculo ou situação interessante
3. Faça perguntas diretas que demandem ação do jogador
4. Mantenha a narrativa dinâmica e envolvente

O que acontece com ${personagem}? O que ${personagem} vê e percebe?`;
}

/**
 * Criar prompt para finalizar turno
 */
export function criarPromptFimTurno(jogador, personagem, resumoAcoes) {
  return `Finalizando turno de ${personagem} (${jogador}).

Resumo das ações:
${resumoAcoes}

Conclua de forma épica as ações de ${personagem} neste turno e prepare a transição para o próximo jogador.`;
}

export default {
  criarPromptTurno,
  criarPromptInicioTurno,
  criarPromptFimTurno
};

