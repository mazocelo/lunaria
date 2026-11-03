/**
 * State Machine para transicoes de fase do jogo
 *
 * Valida transicoes para evitar estados invalidos.
 * Transicoes server-authoritative (reconnect, reset) devem setar direto sem usar transicaoFase.
 */

const TRANSITIONS: Record<string, string[]> = {
  aguardando_inicio: ['rolagem_inicial'],
  rolagem_inicial: ['rodada_em_andamento'],
  rodada_em_andamento: ['entre_rodadas', 'combate', 'finalizado'],
  entre_rodadas: ['rodada_em_andamento', 'finalizado'],
  combate: ['rodada_em_andamento', 'entre_rodadas', 'finalizado'],
  finalizado: ['aguardando_inicio'],
};

export const FASES_VALIDAS = Object.keys(TRANSITIONS);

/**
 * Valida e executa transicao de fase.
 * Retorna a nova fase se valida, ou a fase atual se invalida.
 */
export function transicaoFase(faseAtual: string, novaFase: string): string {
  if (faseAtual === novaFase) return faseAtual;

  const validas = TRANSITIONS[faseAtual];
  if (!validas?.includes(novaFase)) {
    console.warn(`FaseMachine: Transicao invalida: ${faseAtual} -> ${novaFase}. Validas: [${validas?.join(', ')}]`);
    return faseAtual;
  }

  return novaFase;
}
