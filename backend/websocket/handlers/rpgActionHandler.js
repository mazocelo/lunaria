export default class RpgActionHandler {
  constructor(manager) {
    this.manager = manager;
  }

  async handleRpgAction(socket, data) {
    const sm = this.manager;

    try {
      const {
        roomId: rawRoomId,
        userId: rawUserId,
        username: rawUsername,
        action: rawAction,
        target: rawTarget,
        description: rawDescription
      } = data || {};

      if (!rawRoomId || !rawUserId || !rawAction) {
        // @event error → socket (sender) | campos obrigatorios ausentes
        socket.emit('error', { message: 'roomId, userId e action são obrigatórios' });
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
      const action = String(rawAction);
      const target = rawTarget ? String(rawTarget) : null;
      const description = rawDescription ? String(rawDescription) : null;

      const actionData = {
        id: Date.now().toString(),
        userId,
        username,
        action,
        target,
        description,
        roomId,
        timestamp: Date.now().toString()
      };

      // Salvar ação na sessão unificada
      if (roomId.startsWith('historia_')) {
        await sm.gerenciadorSessoes.adicionarAcao(roomId, actionData);
      }

      // @event rpg_action → room (broadcast) | acao RPG enviada para todos na sala
      sm.sendToRoom(roomId, 'rpg_action', actionData);

      sm.log('INFO', 'RPG_ACTION', socket.id, userId, {
        roomId, action, target, username
      });

    } catch (error) {
      sm.log('ERROR', 'RPG_ACTION_ERROR', socket.id, socket.userId, {
        error: error.message, roomId: data?.roomId
      });
      // @event error → socket (sender) | erro ao processar acao RPG
      socket.emit('error', { message: 'Erro ao processar ação RPG' });
    }
  }
}
