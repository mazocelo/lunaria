/** Timeouts e durações do jogo (em ms, exceto onde indicado) */
export const TIMEOUTS = {
  INICIAR_TURNO_RESET: 10000,
  COOLDOWN_TICK: 1000,
  FLAG_RESET_DELAY: 500,
  NOTIFICATION_DISPLAY: 5000,
};

/** Cooldown de roleplay (em segundos) */
export const ROLEPLAY_COOLDOWN_SECONDS = 12;

/** Configurações de partículas de background */
export const PARTICLES = {
  DEFAULT_COUNT: 30,
  GAME_SCREEN_COUNT: 50,
};

/** Animação de rolagem de dados */
export const DICE_ANIMATION = {
  FRAME_INTERVAL: 100,
  TOTAL_FRAMES: 10,
};

/** Combate */
export const COMBAT = {
  LOG_MAX_ENTRIES: 10,
};

/** Socket timeouts (em ms) */
export const SOCKET_TIMEOUTS = {
  CONNECTION: 60000,
  PING: 120000,
  AUTHENTICATION: 10000,
  ROOM_JOIN_LEAVE: 10000,
  SESSION_START: 10000,
  MONITOR_INTERVAL: 30000,
};
