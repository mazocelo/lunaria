export default class StatusUpdateHandler {
  constructor(manager) {
    this.manager = manager;
  }

  async handleStatusUpdate(socket, data) {
    const sm = this.manager;

    try {
      const {
        roomId: rawRoomId,
        userId: rawUserId,
        username: rawUsername,
        status: rawStatus,
        details: rawDetails
      } = data || {};

      if (!rawRoomId || !rawUserId || !rawStatus) {
        // @event error → socket (sender) | campos obrigatorios ausentes
        socket.emit('error', { message: 'roomId, userId e status são obrigatórios' });
        return;
      }

      // Validar userId corresponde ao autenticado
      if (String(rawUserId) !== String(socket.userId)) {
        // @event error → socket (sender) | userId nao corresponde ao autenticado
        socket.emit('error', { message: 'userId não corresponde ao usuário autenticado.', code: 'USER_MISMATCH' });
        return;
      }

      // Fazer parsing dos dados para tipos corretos
      const roomId = String(rawRoomId);
      const userId = String(rawUserId);
      const username = rawUsername ? String(rawUsername) : 'Usuario';
      const status = String(rawStatus);
      const details = rawDetails || null;

      const statusData = {
        userId,
        username,
        status,
        details,
        roomId,
        timestamp: Date.now()
      };

      // Status do jogador já está gerenciado em jogadoresConectados na rpg_session
      // Não precisamos mais salvar em room:* duplicado

      // @event status_update → room (broadcast) | status do jogador atualizado para todos na sala
      sm.sendToRoom(roomId, 'status_update', statusData);

      sm.log('INFO', 'STATUS_UPDATE', socket.id, userId, {
        roomId, status, username
      });

    } catch (error) {
      sm.log('ERROR', 'STATUS_UPDATE_ERROR', socket.id, socket.userId, {
        error: error.message, roomId: data?.roomId
      });
      // @event error → socket (sender) | erro ao atualizar status
      socket.emit('error', { message: 'Erro ao atualizar status' });
    }
  }
}
