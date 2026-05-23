/**
 * State Machine para transições de fase do jogo
 *
 * Valida transições para evitar estados inválidos.
 * Transições server-authoritative (reconnect, reset) devem setar direto sem usar transicaoFase.
 */

const TRANSITIONS = {
  aguardando_inicio: ['rolagem_inicial'],
  rolagem_inicial: ['rodada_em_andamento'],
  rodada_em_andamento: ['entre_rodadas', 'combate', 'finalizado'],
  entre_rodadas: ['rodada_em_andamento', 'finalizado'],
  combate: ['rodada_em_andamento', 'entre_rodadas', 'finalizado'],
  finalizado: ['aguardando_inicio'],
};

export const FASES_VALIDAS = Object.keys(TRANSITIONS);

/**
 * Valida e executa transição de fase.
 * Retorna a nova fase se válida, ou a fase atual se inválida.
 */
export function transicaoFase(faseAtual, novaFase) {
  if (faseAtual === novaFase) return faseAtual;

  const validas = TRANSITIONS[faseAtual];
  if (!validas?.includes(novaFase)) {
    console.warn(`⚠️ FaseMachine: Transição inválida: ${faseAtual} → ${novaFase}. Válidas: [${validas?.join(', ')}]`);
    return faseAtual;
  }

  return novaFase;
}
