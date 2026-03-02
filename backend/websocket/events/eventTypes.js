/**
 * Definições centralizadas de eventos WebSocket
 */

// Eventos de conexão
export const CONNECTION_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  CONNECTION_SUCCESS: 'connection_success',
  CONNECTION_ERROR: 'connection_error',
  RECONNECT: 'reconnect',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
  RECONNECT_ERROR: 'reconnect_error'
};

// Eventos de sala/room
export const ROOM_EVENTS = {
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  ROOM_JOINED: 'room_joined',
  ROOM_LEFT: 'room_left',
  ROOM_ERROR: 'room_error',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  ROOM_USERS: 'room_users'
};

// Eventos de chat
export const CHAT_EVENTS = {
  SEND_MESSAGE: 'send_message',
  NEW_MESSAGE: 'new_message',
  MESSAGE_HISTORY: 'message_history',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  USER_TYPING: 'user_typing',
  MESSAGE_DELETED: 'message_deleted',
  MESSAGE_EDITED: 'message_edited'
};

// Eventos de jogo RPG
export const GAME_EVENTS = {
  // Estados do jogo
  GAME_START: 'game_start',
  GAME_END: 'game_end',
  GAME_PAUSE: 'game_pause',
  GAME_RESUME: 'game_resume',
  GAME_STATE_UPDATE: 'game_state_update',
  
  // Ações de personagem
  CHARACTER_ACTION: 'character_action',
  CHARACTER_MOVE: 'character_move',
  CHARACTER_ATTACK: 'character_attack',
  CHARACTER_SKILL: 'character_skill',
  CHARACTER_UPDATE: 'character_update',
  
  // Sistema de turnos
  TURN_START: 'turn_start',
  TURN_END: 'turn_end',
  TURN_ORDER: 'turn_order',
  NEXT_TURN: 'next_turn',
  
  // Dados e rolagens
  ROLL_DICE: 'roll_dice',
  DICE_RESULT: 'dice_result',
  SKILL_CHECK: 'skill_check',
  SKILL_RESULT: 'skill_result',
  
  // Mestre do jogo
  GM_ACTION: 'gm_action',
  GM_MESSAGE: 'gm_message',
  GM_UPDATE: 'gm_update',
  SCENE_UPDATE: 'scene_update'
};

// Eventos de combate
export const COMBAT_EVENTS = {
  COMBATE_INICIADO: 'combate_iniciado',
  COMBATE_ACAO: 'combate_acao',
  COMBATE_RESULTADO_ACAO: 'combate_resultado_acao',
  COMBATE_MONSTRO_DERROTADO: 'combate_monstro_derrotado',
  COMBATE_JOGADOR_FERIDO: 'combate_jogador_ferido',
  COMBATE_FINALIZADO: 'combate_finalizado',
  COMBATE_ESTADO: 'combate_estado'
};

// Eventos de sistema
export const SYSTEM_EVENTS = {
  PING: 'ping',
  PONG: 'pong',
  HEARTBEAT: 'heartbeat',
  STATUS_UPDATE: 'status_update',
  SERVER_MESSAGE: 'server_message',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Eventos de notificação
export const NOTIFICATION_EVENTS = {
  NOTIFICATION: 'notification',
  ALERT: 'alert',
  ACHIEVEMENT: 'achievement',
  LEVEL_UP: 'level_up',
  ITEM_RECEIVED: 'item_received',
  QUEST_UPDATE: 'quest_update'
};

// Eventos de áudio/vídeo (para futuras implementações)
export const MEDIA_EVENTS = {
  VOICE_JOIN: 'voice_join',
  VOICE_LEAVE: 'voice_leave',
  VOICE_MUTE: 'voice_mute',
  VOICE_UNMUTE: 'voice_unmute',
  SCREEN_SHARE_START: 'screen_share_start',
  SCREEN_SHARE_STOP: 'screen_share_stop'
};

// Todos os eventos combinados
export const SOCKET_EVENTS = {
  ...CONNECTION_EVENTS,
  ...ROOM_EVENTS,
  ...CHAT_EVENTS,
  ...GAME_EVENTS,
  ...COMBAT_EVENTS,
  ...SYSTEM_EVENTS,
  ...NOTIFICATION_EVENTS,
  ...MEDIA_EVENTS
};

// Eventos que requerem autenticação
export const AUTHENTICATED_EVENTS = [
  ROOM_EVENTS.JOIN_ROOM,
  ROOM_EVENTS.LEAVE_ROOM,
  CHAT_EVENTS.SEND_MESSAGE,
  GAME_EVENTS.CHARACTER_ACTION,
  GAME_EVENTS.ROLL_DICE,
  GAME_EVENTS.GM_ACTION
];

// Eventos que são apenas para GMs
export const GM_ONLY_EVENTS = [
  GAME_EVENTS.GAME_START,
  GAME_EVENTS.GAME_END,
  GAME_EVENTS.GM_ACTION,
  GAME_EVENTS.GM_MESSAGE,
  GAME_EVENTS.SCENE_UPDATE
];

export default SOCKET_EVENTS; 