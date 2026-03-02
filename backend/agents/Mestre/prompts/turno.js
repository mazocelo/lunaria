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

  // Se já houve 3 mensagens, avisar que é hora de finalizar
  if (contadorMensagens >= 3) {
    prompt += `\n⚠️ LIMITE ALCANÇADO: Finalize e sinalize "Próximo jogador!"\n`;
  } else {
    prompt += `\nVocê tem ${4 - contadorMensagens - 1} resposta(s) restantes. Se a ação estiver completa, sinalize "Próximo jogador!" para avançar.\n`;
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
5. **IMPORTANTE:** Se a situação exigir teste de habilidade, perícia, ataque, sorte ou talento, solicite rolagem de dados usando 🎲 e explicando as consequências

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

