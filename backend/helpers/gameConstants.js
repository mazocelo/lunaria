/**
 * Constantes centralizadas do jogo - elimina magic strings
 */

export const GAME_PHASES = {
  ROLAGEM_INICIAL: 'rolagem_inicial',
  EXPLORACAO: 'exploração',
  COMBATE: 'combate',
  DESCANSO: 'descanso',
  EVENTO: 'evento'
};

export const SESSION_STATUS = {
  AGUARDANDO: 'aguardando',
  INICIADA: 'iniciada',
  FINALIZADA: 'finalizada',
  PAUSADA: 'pausada'
};

export const HISTORIA_STATUS = {
  ATIVA: 'ativa',
  INATIVA: 'inativa',
  ARQUIVADA: 'arquivada'
};

export const AMIZADE_STATUS = {
  PENDENTE: 'pendente',
  ACEITA: 'aceita',
  BLOQUEADA: 'bloqueada'
};

export const FEED_VISIBILITY = {
  AMIGOS: 'amigos',
  COMUNIDADE: 'comunidade'
};

export const FEED_TYPES = {
  POST: 'post',
  EVENTO: 'evento'
};
