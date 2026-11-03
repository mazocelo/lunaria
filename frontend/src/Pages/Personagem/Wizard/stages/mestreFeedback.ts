// src/Pages/Personagem/Wizard/stages/mestreFeedback.ts
// Feedback do Mestre nas telas novas: o chat fica fechado no MestrePanel, então recusa e
// falha precisam aparecer na própria etapa.
import type { WizardMessage } from '../hooks/useChatState';

/** Pedido de avanço (Continuar ou escolha de carta) feito pelo jogador. */
export interface TentativaDeAvanco {
  etapa: string;
  /** Quantas mensagens havia no momento do pedido: só falas posteriores contam como resposta. */
  qtdMensagens: number;
}

/**
 * Fala do Mestre que recusou o avanço: ele respondeu, terminou de pensar e a etapa não mudou.
 * Sem fala nova (erro de rede) não há recusa; o erro aparece pelo banner de erro.
 */
export function falaDeRecusa(
  tentativa: TentativaDeAvanco | null,
  etapaAtual: string,
  enviando: boolean,
  mensagens: WizardMessage[],
): WizardMessage | null {
  if (!tentativa || enviando || tentativa.etapa !== etapaAtual) return null;
  return [...mensagens.slice(tentativa.qtdMensagens)].reverse().find((m) => m.role === 'mestre') ?? null;
}

/** Última mensagem é de sistema gerada por falha do Mestre (marcada com `falha`) nesta etapa. */
export function avisoDeFalha(mensagens: WizardMessage[], etapaAtual: string): WizardMessage | null {
  const ultima = mensagens[mensagens.length - 1];
  return ultima?.role === 'sistema' && ultima.falha === true && ultima.etapa === etapaAtual ? ultima : null;
}
