import { resolvePlayerVoice, pickRandomFreeVoice } from '../../helpers/playerVoiceHelper.js';

export default class ChatHandler {
  constructor(manager) {
    this.manager = manager;
  }

  async handleChatMessage(socket, data) {
    const sm = this.manager;
    const startTime = Date.now();
    sm.log('INFO', 'CHAT_MESSAGE_PROCESSING_START', socket.id, socket.userId, {
      receivedData: {
        roomId: data?.roomId,
        userId: data?.userId,
        username: data?.username,
        messageLength: data?.message?.length,
        type: data?.type
      }
    });

    try {
      const {
        roomId: rawRoomId,
        userId: rawUserId,
        username: rawUsername,
        message: rawMessage,
        type: rawType = 'chat'
      } = data || {};

      if (!rawRoomId || !rawUserId || !rawMessage) {
        sm.log('ERROR', 'CHAT_MESSAGE_VALIDATION_FAILED', socket.id, socket.userId, {
          missingFields: {
            roomId: !rawRoomId,
            userId: !rawUserId,
            message: !rawMessage
          },
          receivedData: data
        });
        // @event error → socket (sender) | campos obrigatórios ausentes
        socket.emit('error', { message: 'roomId, userId e message são obrigatórios' });
        return;
      }

      // Validar userId corresponde ao autenticado
      if (String(rawUserId) !== String(socket.userId)) {
        sm.log('ERROR', 'CHAT_USER_MISMATCH', socket.id, socket.userId, {
          authenticatedUserId: socket.userId,
          requestedUserId: rawUserId
        });
        // @event error → socket (sender) | userId não corresponde ao autenticado
        socket.emit('error', { message: 'userId não corresponde ao usuário autenticado.', code: 'USER_MISMATCH' });
        return;
      }

      // Validar tamanho da mensagem
      const MAX_MESSAGE_LENGTH = 5000;
      if (rawMessage && String(rawMessage).length > MAX_MESSAGE_LENGTH) {
        // @event erro_mensagem → socket (sender) | mensagem excede limite de caracteres
        socket.emit('erro_mensagem', { message: `Mensagem excede o limite de ${MAX_MESSAGE_LENGTH} caracteres` });
        return;
      }

      // Fazer parsing dos dados para tipos corretos
      const roomId = String(rawRoomId);
      const userId = String(rawUserId);
      const username = rawUsername ? String(rawUsername) : 'Usuario';
      const message = String(rawMessage);
      const type = String(rawType);

      sm.log('INFO', 'CHAT_MESSAGE_DATA_PARSED', socket.id, userId, {
        roomId: roomId,
        username: username,
        messageLength: message.length,
        type: type,
        messageTruncated: message.length > 100 ? `${message.substring(0, 100)}...` : message
      });

      // Resolver voz do personagem server-side (ignora voice_id do cliente)
      const pcId = data.personagemId ? Number(data.personagemId) : null;
      const playerVoice = pcId
        ? await resolvePlayerVoice(pcId).catch(() => pickRandomFreeVoice())
        : pickRandomFreeVoice();

      const messageData = {
        id: Date.now().toString(),
        userId,
        username,
        message,
        type,
        roomId,
        timestamp: Date.now().toString(),
        voice_id: playerVoice.voice_id,
        voice_provider: playerVoice.voice_provider,
        speech_text: message
      };

      // Enviar para todos na sala
      sm.log('INFO', 'CHAT_MESSAGE_BROADCASTING', socket.id, userId, {
        roomId: roomId,
        messageId: messageData.id,
        type: type
      });

      // @event chat_message → room (broadcast) | mensagem de chat enviada para todos na sala
      sm.sendToRoom(roomId, 'chat_message', messageData);

      const processingTime = Date.now() - startTime;
      sm.log('SUCCESS', 'CHAT_MESSAGE_COMPLETED', socket.id, userId, {
        roomId: roomId,
        messageId: messageData.id,
        username: username,
        messageLength: message.length,
        type: type,
        processingTimeMs: processingTime
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      sm.log('ERROR', 'CHAT_MESSAGE_ERROR', socket.id, socket.userId, {
        roomId: data?.roomId,
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime,
        inputData: data
      });
      // @event error → socket (sender) | erro inesperado no processamento de chat
      socket.emit('error', { message: 'Erro ao processar mensagem' });
    }
  }
}
