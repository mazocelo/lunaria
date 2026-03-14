import jwt from 'jsonwebtoken';

export default class AuthHandler {
  constructor(manager) {
    this.manager = manager;
  }

  async handleAuthentication(socket, data) {
    const sm = this.manager;
    const startTime = Date.now();
    sm.log('INFO', 'AUTH_PROCESSING_START', socket.id, data?.userId, {
      receivedData: {
        userId: data?.userId,
        username: data?.username,
        email: data?.email,
        sessionId: data?.sessionId,
        token: data?.token ? `${data.token.substring(0, 10)}...` : 'absent'
      }
    });

    try {
      // S-01: Validar JWT do socketToken antes de aceitar autenticação
      const token = socket.handshake?.auth?.token || data?.token;

      if (!token) {
        sm.log('ERROR', 'AUTH_TOKEN_MISSING', socket.id, data?.userId, {
          message: 'Token ausente no handshake e no payload'
        });
        socket.emit('error', { message: 'Token de autenticação obrigatório' });
        return;
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (jwtError) {
        sm.log('ERROR', 'AUTH_TOKEN_INVALID', socket.id, data?.userId, {
          error: jwtError.message,
          tokenPrefix: token.substring(0, 10)
        });
        socket.emit('error', { message: 'Token inválido ou expirado' });
        return;
      }

      // Usar userId e username do token verificado (fonte confiável)
      const userId = String(decoded.userId);
      const username = decoded.nome || decoded.username || String(data?.username || 'Jogador');
      const rawSessionId = data?.sessionId;
      const sessionId = rawSessionId ? String(rawSessionId) : null;

      sm.log('INFO', 'AUTH_TOKEN_VERIFIED', socket.id, userId, {
        tokenUserId: decoded.userId,
        tokenEmail: decoded.email,
        payloadUserId: data?.userId
      });

      sm.log('INFO', 'AUTH_DATA_PARSED', socket.id, userId, {
        parsedData: {
          userId: userId,
          username: username,
          sessionId: sessionId,
          hasEmail: !!data?.email,
          tokenVerified: true
        }
      });

      // Verificar se usuário já está conectado
      const existingSocket = sm.connectedUsers.get(userId);
      if (existingSocket && existingSocket.id !== socket.id) {
        sm.log('WARN', 'AUTH_USER_ALREADY_CONNECTED', socket.id, userId, {
          existingSocketId: existingSocket.id,
          existingSocketConnected: existingSocket.connected
        });

        // @event force_disconnect → socket (anterior) | nova conexão do mesmo usuário
        existingSocket.emit('force_disconnect', {
          reason: 'Nova conexão detectada',
          timestamp: Date.now()
        });
        existingSocket.disconnect(true);
        sm.log('INFO', 'AUTH_PREVIOUS_CONNECTION_TERMINATED', existingSocket.id, userId);
      }

      // Armazenar informações do usuário
      socket.userId = userId;
      socket.username = username;
      socket.sessionId = sessionId;
      socket.authenticatedAt = Date.now();

      sm.connectedUsers.set(userId, socket);

      sm.log('INFO', 'AUTH_USER_DATA_STORED', socket.id, userId, {
        connectedUsersCount: sm.connectedUsers.size,
        socketProperties: {
          userId: socket.userId,
          username: socket.username,
          sessionId: socket.sessionId
        }
      });

      // Salvar no Redis com valores parseados
      if (sm.redis) {
        const redisData = {
          socketId: socket.id,
          username: username,
          connectedAt: Date.now().toString()
        };

        // Adicionar sessionId apenas se existir
        if (sessionId) {
          redisData.sessionId = sessionId;
        }

        sm.log('INFO', 'AUTH_REDIS_SAVE_START', socket.id, userId, {
          redisKey: `user:${userId}`,
          redisData: redisData
        });

        await sm.redis.hSet(`user:${userId}`, redisData);

        sm.log('SUCCESS', 'AUTH_REDIS_SAVE_SUCCESS', socket.id, userId, {
          redisKey: `user:${userId}`
        });
      } else {
        sm.log('WARN', 'AUTH_REDIS_UNAVAILABLE', socket.id, userId, {
          message: 'Redis não disponível para salvar dados do usuário'
        });
      }

      const authResponse = {
        userId,
        username,
        socketId: socket.id,
        sessionId: sessionId
      };

      // @event authenticated → socket (sender) | autenticação bem-sucedida
      socket.emit('authenticated', authResponse);

      const processingTime = Date.now() - startTime;
      sm.log('SUCCESS', 'AUTH_COMPLETED', socket.id, userId, {
        username: username,
        sessionId: sessionId,
        processingTimeMs: processingTime,
        responseData: authResponse
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      sm.log('ERROR', 'AUTH_ERROR', socket.id, data?.userId, {
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime,
        inputData: data
      });
      // @event error → socket (sender) | erro inesperado na autenticação
      socket.emit('error', { message: 'Erro na autenticação' });
    }
  }
}
