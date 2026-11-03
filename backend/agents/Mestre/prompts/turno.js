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

// ── Blocos de continuidade e guia por posicao no turno ──────────────

function montarBlocoContinuidade() {
  return `
PRIORIDADE DE CONTINUIDADE:
1. Continue da última batida canônica do chat_history.
2. Se última interação foi fala NPC↔PJ, responda ESSA fala primeiro.
3. Avance a situação sem re-descrever ambiente já estabelecido.
4. Em combate, trate resumo mecânico como verdade absoluta.
5. Se NÃO encerrar turno: termine com proposta jogável concreta (objeto, porta, pista, NPC, escolha localizada). Nunca pergunta ampla.
6. Se encerrar turno: conclua limpo, sem forçar gancho.
`;
}

/**
 * Criar prompt para primeira mensagem do turno do jogador.
 * Instrucoes de continuidade + guia especifico da primeira mensagem.
 */
export function criarPromptTurnoPrimeira(jogador, personagem, mensagem, rodada, turno, maxAcoes, contadorMensagens) {
  const respostasRestantes = Math.max(0, maxAcoes - contadorMensagens - 1);

  let prompt = `TURNO DO JOGADOR ${personagem} (Jogador: ${jogador})
Rodada: ${rodada} | Turno: ${turno} | Mensagem ${contadorMensagens + 1}/${maxAcoes}

Mensagem do Jogador:
"${mensagem}"

`;

  if (contadorMensagens >= maxAcoes - 1) {
    prompt += `\n⚠️ IMPORTANTE: Este é o limite de interações deste turno. Finalize a ação do jogador de forma conclusiva e use fimDeTurno: true no JSON.\n`;
  } else {
    prompt += `\nResponda à ação do jogador de forma dinâmica e envolvente. Você ainda tem ${respostasRestantes} resposta(s) disponíveis neste turno.\n\nSe a ação estiver completamente resolvida, use fimDeTurno: true no JSON.\n`;
  }

  prompt += montarBlocoContinuidade();

  prompt += `
GUIA DA PRIMEIRA MENSAGEM DO TURNO:
1. Primeira mensagem pode ser mais desenvolvida que as demais.
2. Encaixe o personagem na situação concreta (por que ele está ali, o que ele vê).
3. Fixe onde está, quem/o que está diante, tensão imediata.
4. NPC fala para mover a cena, não para elogiar ou intimidar gratuitamente.
5. NPC respondendo pergunta → encaixe imediato (mostrar objeto, apontar porta, oferecer escolha).
6. Não termine apenas em atmosfera, reflexão interna ou expectativa vaga.
`;

  return prompt;
}

/**
 * Criar prompt para mensagens seguintes do turno (nao a primeira).
 * Instrucoes de continuidade + guia especifico de mensagens subsequentes.
 */
export function criarPromptTurnoSeguinte(jogador, personagem, mensagem, rodada, turno, maxAcoes, contadorMensagens) {
  const respostasRestantes = Math.max(0, maxAcoes - contadorMensagens - 1);

  let prompt = `TURNO DO JOGADOR ${personagem} (Jogador: ${jogador})
Rodada: ${rodada} | Turno: ${turno} | Mensagem ${contadorMensagens + 1}/${maxAcoes}

Mensagem do Jogador:
"${mensagem}"

`;

  if (contadorMensagens >= maxAcoes - 1) {
    prompt += `\n⚠️ IMPORTANTE: Este é o limite de interações deste turno. Finalize a ação do jogador de forma conclusiva e use fimDeTurno: true no JSON.\n`;
  } else {
    prompt += `\nResponda à ação do jogador de forma dinâmica e envolvente. Você ainda tem ${respostasRestantes} resposta(s) disponíveis neste turno.\n\nSe a ação estiver completamente resolvida, use fimDeTurno: true no JSON.\n`;
  }

  prompt += montarBlocoContinuidade();

  prompt += `
GUIA DAS MENSAGENS SEGUINTES:
1. Responda primeiro à ação do jogador.
2. Avance a situação sem reabrir a cena.
3. NPC deve destravar a cena com algo concreto.
4. Use detalhes de classe/raça/passado apenas quando mudam a resposta.
`;

  return prompt;
}

/**
 * Criar prompt para ultima mensagem do turno (limite atingido).
 * Foca em finalizacao conclusiva.
 */
export function criarPromptTurnoFinal(jogador, personagem, mensagem, rodada, turno) {
  let prompt = `TURNO DO JOGADOR ${personagem} (Jogador: ${jogador})
Rodada: ${rodada} | Turno: ${turno}

Mensagem do Jogador:
"${mensagem}"

⚠️ IMPORTANTE: Este é o limite de interações deste turno. Finalize a ação do jogador de forma conclusiva e use fimDeTurno: true no JSON.

PRIORIDADE DE CONTINUIDADE:
- Continue exatamente da ultima batida canonica do chat_history.
- Se a ultima interacao foi uma fala direta entre personagem e NPC, responda a essa fala antes de criar novo evento.
- Prefira respostas curtas e concretas.
- Conclua a batida de forma limpa e nao force um novo gancho.
- Em combate, trate o resumo mecanico como verdade.
`;

  return prompt;
}

export default {
  criarPromptTurno,
  criarPromptInicioTurno,
  criarPromptTurnoPrimeira,
  criarPromptTurnoSeguinte,
  criarPromptTurnoFinal
};
