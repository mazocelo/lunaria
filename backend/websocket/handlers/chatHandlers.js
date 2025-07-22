import gerenciadorSessoes from '../../redis/sessoes.js';
import { EventEmitter } from '../events/EventEmitter.js';
import { EVENT_TYPES } from '../events/eventTypes.js';

/**
 * Handlers para eventos de chat
 */
export class ChatHandlers {
  constructor(io) {
    this.io = io;
    this.eventEmitter = EventEmitter.getInstance();
    this.typingUsers = new Map(); // roomId -> Set of userIds
  }

  /**
   * Log estruturado para handlers de chat
   */
  log(level, event, socketId, userId = null, data = {}) {
    const timestamp = new Date().toISOString();
    const prefix = {
      'INFO': '💬',
      'WARN': '⚠️',
      'ERROR': '❌',
      'SUCCESS': '✅',
      'DEBUG': '🔍'
    }[level] || '💬';
    
    const userInfo = userId ? `[User:${userId}]` : '';
    const socketInfo = `[Socket:${socketId?.substring(0, 8)}...]`;
    const handlerInfo = '[ChatHandler]';
    
    console.log(`${prefix} ${timestamp} ${event} ${handlerInfo}${socketInfo}${userInfo}`, data);
  }

  /**
   * Handler para envio de mensagem
   */
  async handleSendMessage(socket, data) {
    const startTime = Date.now();
    
    this.log('INFO', 'SEND_MESSAGE_HANDLER_START', socket.id, socket.userId, {
      receivedData: {
        roomId: data?.roomId,
        sessionId: data?.sessionId,
        messageLength: data?.message?.length,
        messageType: data?.messageType,
        isPrivate: data?.isPrivate,
        targetUser: data?.targetUser
      },
      username: socket.username
    });

    try {
      const { roomId, sessionId, message, messageType = 'chat', isPrivate = false, targetUser } = data;

      if (!socket.userId) {
        this.log('ERROR', 'SEND_MESSAGE_USER_NOT_AUTHENTICATED', socket.id, null, {
          receivedData: data
        });
        socket.emit('error', { message: 'Usuário não autenticado' });
        return;
      }

      if (!roomId || !message) {
        this.log('ERROR', 'SEND_MESSAGE_MISSING_REQUIRED_FIELDS', socket.id, socket.userId, {
          missingFields: {
            roomId: !roomId,
            message: !message
          },
          receivedData: data
        });
        socket.emit('error', { message: 'RoomId e message são obrigatórios' });
        return;
      }

      if (message.trim().length === 0) {
        this.log('ERROR', 'SEND_MESSAGE_EMPTY_MESSAGE', socket.id, socket.userId, {
          roomId: roomId,
          messageLength: message.length
        });
        socket.emit('error', { message: 'Mensagem não pode estar vazia' });
        return;
      }

      this.log('INFO', 'SEND_MESSAGE_VALIDATION_PASSED', socket.id, socket.userId, {
        roomId: roomId,
        sessionId: sessionId,
        messageLength: message.trim().length,
        messageType: messageType,
        isPrivate: isPrivate,
        targetUser: targetUser,
        messageTruncated: message.length > 100 ? `${message.substring(0, 100)}...` : message
      });

      // Criar objeto da mensagem
      const messageObj = {
        id: `msg_${Date.now()}_${socket.userId}`,
        userId: socket.userId,
        username: socket.username,
        message: message.trim(),
        messageType,
        isPrivate,
        targetUser,
        timestamp: new Date().toISOString(),
        roomId,
        sessionId
      };

      // Processar mensagem baseada no tipo
      const processedMessage = await this.processMessage(messageObj, socket);

      // Salvar mensagem na sessão se existir
      if (sessionId) {
        await gerenciadorSessoes.adicionarMensagem(sessionId, processedMessage);
      }

      // Emitir evento de mensagem
      this.eventEmitter.emit(EVENT_TYPES.CHAT.MESSAGE_SENT, {
        ...processedMessage,
        socketId: socket.id
      });

      // Enviar mensagem baseada no tipo e privacidade
      if (isPrivate && targetUser) {
        // Mensagem privada
        await this.sendPrivateMessage(socket, processedMessage, targetUser);
      } else {
        // Mensagem pública para a sala
        this.io.to(roomId).emit('new_message', processedMessage);
      }

      // Confirmar envio para o remetente
      socket.emit('message_sent', {
        messageId: messageObj.id,
        timestamp: processedMessage.timestamp
      });

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      socket.emit('error', {
        message: 'Erro ao enviar mensagem',
        details: error.message
      });
    }
  }

  /**
   * Processar mensagem baseada no tipo
   */
  async processMessage(messageObj, socket) {
    switch (messageObj.messageType) {
      case 'chat':
        return this.processChatMessage(messageObj);
      
      case 'ooc': // Out of Character
        return this.processOOCMessage(messageObj);
      
      case 'ic': // In Character
        return this.processICMessage(messageObj);
      
      case 'whisper':
        return this.processWhisperMessage(messageObj);
      
      case 'action':
        return this.processActionMessage(messageObj);
      
      case 'system':
        return this.processSystemMessage(messageObj);
      
      case 'dice':
        return await this.processDiceMessage(messageObj, socket);
      
      default:
        return this.processChatMessage(messageObj);
    }
  }

  /**
   * Processar mensagem de chat normal
   */
  processChatMessage(messageObj) {
    return {
      ...messageObj,
      formattedMessage: `${messageObj.username}: ${messageObj.message}`,
      style: 'chat'
    };
  }

  /**
   * Processar mensagem OOC (Out of Character)
   */
  processOOCMessage(messageObj) {
    return {
      ...messageObj,
      formattedMessage: `((${messageObj.username})) ${messageObj.message}`,
      style: 'ooc'
    };
  }

  /**
   * Processar mensagem IC (In Character)
   */
  processICMessage(messageObj) {
    return {
      ...messageObj,
      formattedMessage: `${messageObj.username} diz: "${messageObj.message}"`,
      style: 'ic'
    };
  }

  /**
   * Processar mensagem de sussurro
   */
  processWhisperMessage(messageObj) {
    return {
      ...messageObj,
      formattedMessage: `${messageObj.username} sussurra: "${messageObj.message}"`,
      style: 'whisper'
    };
  }

  /**
   * Processar mensagem de ação
   */
  processActionMessage(messageObj) {
    return {
      ...messageObj,
      formattedMessage: `* ${messageObj.username} ${messageObj.message}`,
      style: 'action'
    };
  }

  /**
   * Processar mensagem do sistema
   */
  processSystemMessage(messageObj) {
    return {
      ...messageObj,
      formattedMessage: `[SISTEMA] ${messageObj.message}`,
      style: 'system'
    };
  }

  /**
   * Processar mensagem com rolagem de dados
   */
  async processDiceMessage(messageObj, socket) {
    // Extrair comando de dados da mensagem (ex: "/roll 2d6+3")
    const diceMatch = messageObj.message.match(/\/roll\s+([^\s]+)(?:\s+(.+))?/);
    
    if (!diceMatch) {
      return {
        ...messageObj,
        formattedMessage: `${messageObj.username}: ${messageObj.message}`,
        style: 'chat'
      };
    }

    const diceNotation = diceMatch[1];
    const reason = diceMatch[2] || '';

    try {
      // Simular rolagem de dados
      const diceResult = this.rollDice(diceNotation);
      
      return {
        ...messageObj,
        messageType: 'dice',
        diceResult: {
          notation: diceNotation,
          rolls: diceResult.rolls,
          total: diceResult.total,
          reason
        },
        formattedMessage: `🎲 ${messageObj.username} rolou ${diceNotation}: [${diceResult.rolls.join(', ')}] = ${diceResult.total}${reason ? ` (${reason})` : ''}`,
        style: 'dice'
      };
    } catch (error) {
      return {
        ...messageObj,
        formattedMessage: `❌ ${messageObj.username}: Erro na rolagem - ${error.message}`,
        style: 'error'
      };
    }
  }

  /**
   * Enviar mensagem privada
   */
  async sendPrivateMessage(senderSocket, messageObj, targetUsername) {
    try {
      // Encontrar socket do usuário alvo
      const sockets = await this.io.fetchSockets();
      const targetSocket = sockets.find(s => s.username === targetUsername);

      if (!targetSocket) {
        senderSocket.emit('error', {
          message: `Usuário ${targetUsername} não está conectado`
        });
        return;
      }

      // Enviar para o destinatário
      targetSocket.emit('private_message', {
        ...messageObj,
        formattedMessage: `[PRIVADO] ${messageObj.formattedMessage}`
      });

      // Confirmar para o remetente
      senderSocket.emit('private_message_sent', {
        ...messageObj,
        targetUser: targetUsername,
        formattedMessage: `[PARA ${targetUsername}] ${messageObj.formattedMessage}`
      });

      console.log(`🔒 Mensagem privada de ${senderSocket.username} para ${targetUsername}`);

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem privada:', error);
      senderSocket.emit('error', {
        message: 'Erro ao enviar mensagem privada'
      });
    }
  }

  /**
   * Handler para início de digitação
   */
  handleTypingStart(socket, data) {
    try {
      const { roomId } = data;

      if (!socket.userId || !roomId) {
        return;
      }

      // Adicionar usuário à lista de digitação
      if (!this.typingUsers.has(roomId)) {
        this.typingUsers.set(roomId, new Set());
      }
      
      this.typingUsers.get(roomId).add(socket.userId);

      // Notificar outros usuários na sala
      socket.to(roomId).emit('user_typing', {
        userId: socket.userId,
        username: socket.username,
        isTyping: true
      });

      console.log(`⌨️ ${socket.username} começou a digitar na sala ${roomId}`);

    } catch (error) {
      console.error('❌ Erro no typing start:', error);
    }
  }

  /**
   * Handler para parada de digitação
   */
  handleTypingStop(socket, data) {
    try {
      const { roomId } = data;

      if (!socket.userId || !roomId) {
        return;
      }

      // Remover usuário da lista de digitação
      if (this.typingUsers.has(roomId)) {
        this.typingUsers.get(roomId).delete(socket.userId);
        
        // Limpar set vazio
        if (this.typingUsers.get(roomId).size === 0) {
          this.typingUsers.delete(roomId);
        }
      }

      // Notificar outros usuários na sala
      socket.to(roomId).emit('user_typing', {
        userId: socket.userId,
        username: socket.username,
        isTyping: false
      });

      console.log(`⌨️ ${socket.username} parou de digitar na sala ${roomId}`);

    } catch (error) {
      console.error('❌ Erro no typing stop:', error);
    }
  }

  /**
   * Limpar digitação do usuário em todas as salas
   */
  clearUserTyping(userId) {
    for (const [roomId, typingSet] of this.typingUsers.entries()) {
      if (typingSet.has(userId)) {
        typingSet.delete(userId);
        
        if (typingSet.size === 0) {
          this.typingUsers.delete(roomId);
        }
      }
    }
  }

  /**
   * Obter histórico de mensagens de uma sessão
   */
  async getMessageHistory(socket, data) {
    try {
      const { sessionId, limit = 50, offset = 0 } = data;

      if (!sessionId) {
        socket.emit('error', { message: 'SessionId é obrigatório' });
        return;
      }

      const session = await gerenciadorSessoes.obterSessao(sessionId);
      if (!session) {
        socket.emit('error', { message: 'Sessão não encontrada' });
        return;
      }

      const messages = session.mensagens || [];
      const totalMessages = messages.length;
      const paginatedMessages = messages
        .slice(offset, offset + limit)
        .reverse(); // Mais recentes primeiro

      socket.emit('message_history', {
        sessionId,
        messages: paginatedMessages,
        pagination: {
          total: totalMessages,
          limit,
          offset,
          hasMore: offset + limit < totalMessages
        }
      });

    } catch (error) {
      console.error('❌ Erro ao obter histórico:', error);
      socket.emit('error', {
        message: 'Erro ao obter histórico de mensagens'
      });
    }
  }

  /**
   * Função para simular rolagem de dados
   */
  rollDice(diceNotation) {
    // Parse da notação de dados (ex: "2d6", "1d20+3")
    const match = diceNotation.match(/(\d+)d(\d+)(?:([+-])(\d+))?/);
    if (!match) {
      throw new Error('Notação de dados inválida. Use formato como: 2d6, 1d20+3, 3d8-1');
    }

    const numDice = parseInt(match[1]);
    const diceSides = parseInt(match[2]);
    const operator = match[3];
    const modifier = match[4] ? parseInt(match[4]) : 0;

    if (numDice < 1 || numDice > 100) {
      throw new Error('Número de dados deve estar entre 1 e 100');
    }

    if (diceSides < 2 || diceSides > 1000) {
      throw new Error('Lados do dado devem estar entre 2 e 1000');
    }

    const rolls = [];
    let total = 0;

    for (let i = 0; i < numDice; i++) {
      const roll = Math.floor(Math.random() * diceSides) + 1;
      rolls.push(roll);
      total += roll;
    }

    // Aplicar modificador
    if (operator === '+') {
      total += modifier;
    } else if (operator === '-') {
      total -= modifier;
    }

    return { rolls, total, modifier: operator ? `${operator}${modifier}` : null };
  }

  /**
   * Obter estatísticas de chat
   */
  getChatStats() {
    const typingStats = {};
    for (const [roomId, typingSet] of this.typingUsers.entries()) {
      typingStats[roomId] = typingSet.size;
    }

    return {
      activeTypingUsers: Array.from(this.typingUsers.values()).reduce((sum, set) => sum + set.size, 0),
      typingByRoom: typingStats
    };
  }
} 