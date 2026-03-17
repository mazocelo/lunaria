/**
 * Prompts especificos para narracao de acoes
 */

export function criarPromptNarracao(jogador, personagem, acao) {
  return `Jogador: ${jogador}
Personagem: ${personagem}
Acao: ${acao}

INSTRUCOES:
- Se a acao do jogador for uma resposta curta em dialogo, faca o NPC ou o mundo responder a ela, em vez de recomecar a cena.
- Mantenha o personagem aderido ao fio principal do roteiro e ao objetivo imediato da cena.
- Use detalhes de classe, raca, juramento, passado ou reputacao apenas quando isso mudar a resposta da cena.
- Prefira 1 ou 2 paragrafos curtos e concretos, em vez de blocos longos contemplativos.
- Narre o resultado dessa acao.
- Se SIMPLES/SEGURA: narre diretamente (observar sala, conversar).
- Se ARRISCADA/DIFICIL: solicite rolagem via solicitaDados no JSON e inclua ðŸŽ² na narrativa.
- NAO inclua faixas numericas; o sistema resolve automaticamente.
- Mantenha emocao e suspense sem recapitular o que ja foi dito.
- Em combate, respeite o resumo mecanico recebido: nao confirme morte, dano letal ou sucesso final quando a acao ainda depende de teste.
- Se a resposta NAO encerrar o turno, termine com um proximo movimento concreto para o jogador agir: fala, pergunta, ordem, interrupcao, descoberta ou evento imediato.
- A deixa final deve ser clara o suficiente para o jogador entender o que pode responder, perguntar, investigar, atacar, seguir ou recusar.
- Se a cena estiver confusa, aberta demais ou com poucas ancoras praticas, voce pode incluir uma pequena sugestao opcional de encaminhamento, sem retirar a liberdade do jogador.
- Essa sugestao deve soar natural na ficcao, nunca como menu artificial. Exemplo de formato: "Voce pode me mostrar a nota agora, ou podemos seguir direto para o salao."
- Se a resposta encerrar o turno, conclua a batida de forma limpa e nao force um novo gancho.`;
}

export function criarPromptReacao(contexto, evento) {
  return `EVENTO: ${evento}

CONTEXTO ATUAL:
${contexto}

Como Mestre, narre a reacao do mundo a este evento. Descreva consequencias imediatas e possiveis desdobramentos. Mantenha consistencia com o contexto.`;
}

export default {
  criarPromptNarracao,
  criarPromptReacao
};
