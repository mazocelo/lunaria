import analyticsService from '../services/analyticsService.js';
import { appendMensagemSessao, buildAcaoMestreMensagem } from './utils/sessionMessages.js';
import { buildTurnStateProjection } from './stateProjector.js';

export default class SessionEventBus {
  constructor(manager) {
    this.manager = manager;
  }

  emitToRoom(roomId, event, data) {
    if (!this.manager.io) return;
    this.manager.io.to(roomId).emit(event, data);
  }

  emitToUser(userId, event, data) {
    const socket = this.manager.connectedUsers.get(userId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  emitTurnState(roomId, sessao) {
    if (!roomId || !sessao) return;
    this.emitToRoom(roomId, 'turno_estado_atualizado', buildTurnStateProjection(roomId, sessao));
  }

  emitPersistedMasterAction(roomId, sessao, payload) {
    const mensagem = buildAcaoMestreMensagem(payload);
    appendMensagemSessao(sessao, mensagem);

    this.emitToRoom(roomId, 'acao_mestre', {
      ...payload,
      id: mensagem.id,
      message: mensagem.message,
      mensagem: mensagem.message,
      payload: mensagem.payload
    });
  }

  emitAdventureStart(salaId, dados) {
    this.emitToRoom(salaId, 'aventura_iniciada', {
      ...dados,
      timestamp: Date.now()
    });
    analyticsService.track('sessao_inicio', { salaId, totalJogadores: dados.totalJogadores });
  }

  emitPhaseUpdate(salaId, fase, dadosAdicionais = {}) {
    this.emitToRoom(salaId, 'fase_atualizada', {
      fase,
      ...dadosAdicionais,
      timestamp: Date.now()
    });
  }
}
