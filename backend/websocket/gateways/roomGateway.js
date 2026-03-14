import logger from '../../helpers/logger.js';
const log = logger.child({ module: 'roomGateway' });

export default class RoomGateway {
  constructor(manager) {
    this.manager = manager;
  }

  async handleJoinRoom(socket, data) {
    const sm = this.manager;
    const startTime = Date.now();

    sm.log('INFO', 'JOIN_ROOM_PROCESSING_START', socket.id, socket.userId, {
      receivedData: {
        roomId: data?.roomId,
        userId: data?.userId,
        username: data?.username,
        historiaId: data?.historiaId
      },
      socketCurrentRoom: socket.currentRoom,
      socketAuthenticated: !!socket.userId,
      socketUserId: socket.userId,
      socketUsername: socket.username
    });

    try {
      if (!socket.userId) {
        sm.log('ERROR', 'JOIN_ROOM_NOT_AUTHENTICATED', socket.id, null, {
          message: 'Socket nao autenticado',
          socketId: socket.id,
          receivedData: data
        });
        // @event error → socket (direct) | join attempt rejected because socket is not authenticated
        socket.emit('error', {
          message: 'Socket nao autenticado. Execute authenticate() primeiro.',
          code: 'NOT_AUTHENTICATED'
        });
        return;
      }

      const {
        roomId: rawRoomId,
        userId: rawUserId,
        username: rawUsername,
        historiaId: rawHistoriaId
      } = data || {};

      if (!rawRoomId || !rawUserId) {
        sm.log('ERROR', 'JOIN_ROOM_VALIDATION_FAILED', socket.id, socket.userId, {
          missingFields: {
            roomId: !rawRoomId,
            userId: !rawUserId
          },
          receivedData: data
        });
        // @event error → socket (direct) | join attempt rejected: roomId or userId missing from payload
        socket.emit('error', {
          message: 'roomId e userId sao obrigatorios',
          code: 'MISSING_REQUIRED_FIELDS'
        });
        return;
      }

      if (String(rawUserId) !== String(socket.userId)) {
        sm.log('ERROR', 'JOIN_ROOM_USER_MISMATCH', socket.id, socket.userId, {
          authenticatedUserId: socket.userId,
          requestedUserId: rawUserId
        });
        // @event error → socket (direct) | join attempt rejected: userId in payload does not match authenticated socket
        socket.emit('error', {
          message: 'userId nao corresponde ao usuario autenticado.',
          code: 'USER_MISMATCH'
        });
        return;
      }

      const roomId = String(rawRoomId);
      const userId = String(rawUserId);
      const username = rawUsername ? String(rawUsername) : 'Usuario';
      const historiaId = rawHistoriaId ? String(rawHistoriaId) : null;

      sm.log('INFO', 'JOIN_ROOM_DATA_PARSED', socket.id, userId, {
        parsedData: {
          roomId,
          userId,
          username,
          historiaId
        },
        roomType: roomId.startsWith('historia_') ? 'historia' : 'generic'
      });

      if (socket.currentRoom && socket.currentRoom !== roomId) {
        sm.log('INFO', 'JOIN_ROOM_LEAVING_CURRENT', socket.id, userId, {
          currentRoom: socket.currentRoom,
          targetRoom: roomId
        });

        await this.handleLeaveRoom(socket, {
          roomId: socket.currentRoom,
          userId,
          username: socket.username || username
        });
      }

      let sessao = null;

      if (roomId.startsWith('historia_')) {
        sm.log('INFO', 'JOIN_ROOM_HISTORIA_TYPE', socket.id, userId, {
          roomId,
          extractedHistoriaId: historiaId
        });

        sessao = await sm.obterSessaoHistoria(roomId);

        if (!sessao) {
          sm.log('ERROR', 'JOIN_ROOM_SESSAO_NOT_FOUND', socket.id, userId, {
            roomId,
            historiaId
          });
          // @event error → socket (direct) | no session found for the requested historia roomId
          socket.emit('error', {
            message: 'Historia nao encontrada.',
            code: 'HISTORIA_NAO_ENCONTRADA'
          });
          return;
        }

        sm.log('SUCCESS', 'JOIN_ROOM_SESSAO_FOUND', socket.id, userId, {
          sessaoStatus: sessao.status,
          historiaNome: sessao.historiaNome,
          historiaId: sessao.historiaId,
          maxJogadores: sessao.maxJogadores,
          jogadoresConectados: sessao.jogadoresConectados?.length || 0,
          donoId: sessao.donoId
        });

        if (sessao.statusJogo === 'iniciado') {
          const estaNoMapaJogadores = sessao.jogadores && sessao.jogadores[String(userId)];

          sm.log('INFO', 'JOIN_ROOM_AVENTURA_INICIADA_CHECK', socket.id, userId, {
            sessaoStatus: sessao.status,
            statusJogo: sessao.statusJogo,
            userId,
            userIdTipo: typeof userId,
            estaNoMapaJogadores: !!estaNoMapaJogadores,
            mapaJogadores: sessao.jogadores ? Object.keys(sessao.jogadores) : [],
            jogadoresConectados: sessao.jogadoresConectados || []
          });

          if (!estaNoMapaJogadores) {
            sm.log('ERROR', 'JOIN_ROOM_JOGO_INICIADO_BLOCKED', socket.id, userId, {
              roomId,
              sessaoStatus: sessao.status,
              statusJogo: sessao.statusJogo,
              motivo: 'O jogo ja iniciou - usuario nao esta no mapa de jogadores'
            });
            // @event error → socket (direct) | join blocked: game already started and user is not a registered player
            socket.emit('error', {
              message: 'O jogo ja foi iniciado. Nao e possivel entrar agora.',
              code: 'JOGO_INICIADO'
            });
            return;
          }

          log.info({ userId, username: socket.username, personagem: estaNoMapaJogadores.personagemNome }, 'Permitindo reconexao de jogador existente no jogo iniciado');
          sm.log('INFO', 'JOIN_ROOM_RECONNECTION_ALLOWED', socket.id, userId, {
            username,
            sessaoStatus: sessao.status,
            statusJogo: sessao.statusJogo,
            personagem: estaNoMapaJogadores.personagemNome
          });
        }

        if (sessao.status === 'iniciada' && !sessao.statusJogo) {
          const estaNoMapaJogadores = sessao.jogadores && sessao.jogadores[String(userId)];

          if (!estaNoMapaJogadores) {
            sm.log('WARN', 'JOIN_ROOM_SESSAO_ANTIGA_BLOCKED', socket.id, userId, {
              roomId,
              motivo: 'Sessao antiga (sem statusJogo) mas status=iniciada'
            });
            // @event error → socket (direct) | join blocked: legacy session with status=iniciada and user not in player map
            socket.emit('error', {
              message: 'A aventura ja foi iniciada. Nao e possivel entrar agora.',
              code: 'AVENTURA_INICIADA'
            });
            return;
          }
        }

        if (sessao.maxJogadores) {
          const jogadoresAtuais = sessao.jogadoresConectados?.length || 0;
          sm.log('INFO', 'JOIN_ROOM_CAPACITY_CHECK', socket.id, userId, {
            jogadoresAtuais,
            maxJogadores: sessao.maxJogadores,
            roomId
          });

          if (jogadoresAtuais >= sessao.maxJogadores) {
            const jaConectado = sessao.jogadoresConectados?.some((jogador) =>
              String(jogador?.userId || jogador) === userId
            );
            if (!jaConectado) {
              sm.log('ERROR', 'JOIN_ROOM_CAPACITY_EXCEEDED', socket.id, userId, {
                jogadoresAtuais,
                maxJogadores: sessao.maxJogadores,
                roomId
              });
              // @event error → socket (direct) | join blocked: room is at max capacity and user has no prior connection
              socket.emit('error', {
                message: `Sala lotada. Maximo de ${sessao.maxJogadores} jogadores.`,
                code: 'SALA_LOTADA'
              });
              return;
            }

            sm.log('INFO', 'JOIN_ROOM_CAPACITY_RECONNECTION_ALLOWED', socket.id, userId, {
              message: 'Usuario ja conectado anteriormente, permitindo reconexao mesmo com sala lotada'
            });
          }
        }
      }

      sm.log('INFO', 'JOIN_ROOM_SOCKET_JOIN_START', socket.id, userId, {
        roomId,
        previousRoom: socket.currentRoom
      });

      socket.join(roomId);
      socket.currentRoom = roomId;

      sm.log('SUCCESS', 'JOIN_ROOM_SOCKET_JOINED', socket.id, userId, {
        roomId,
        socketRoomsCount: socket.rooms.size
      });

      if (!sm.roomUsers.has(roomId)) {
        sm.roomUsers.set(roomId, new Set());
        sm.log('INFO', 'JOIN_ROOM_CREATED_ROOM_USERLIST', socket.id, userId, { roomId });
      }

      const wasAlreadyInRoom = sm.roomUsers.get(roomId).has(userId);
      sm.roomUsers.get(roomId).add(userId);

      let isOwner = false;
      let isGuest = false;

      if (roomId.startsWith('historia_')) {
        if (sessao) {
          isOwner = sessao.donoId === userId;
          isGuest = !isOwner && !wasAlreadyInRoom;
          log.info({ statusJogo: sessao.statusJogo || 'null', statusSessao: sessao.status }, 'Status da sala');
        }
      }

      sm.log('INFO', 'JOIN_ROOM_ADDED_TO_USERLIST', socket.id, userId, {
        roomId,
        wasAlreadyInRoom,
        totalUsersInRoom: sm.roomUsers.get(roomId).size,
        username,
        isOwner,
        isGuest
      });

      if (isGuest) {
        sm.log('SUCCESS', 'GUEST_JOINED_ROOM', socket.id, userId, {
          roomId,
          username,
          totalJogadores: sm.roomUsers.get(roomId).size
        });
      }

      if (roomId.startsWith('historia_')) {
        sm.log('INFO', 'JOIN_ROOM_UPDATING_SESSAO', socket.id, userId, { roomId });

        await this.adicionarJogadorSessao(roomId, {
          userId,
          username,
          personagemId: data.personagemId || null,
          personagemNome: data.personagemNome || null,
          status: data.personagemId && data.personagemNome ? 'pronto' : 'selecionando',
          socketId: socket.id,
          conectadoEm: new Date().toISOString()
        });

        sm.log('SUCCESS', 'JOIN_ROOM_SESSAO_UPDATED', socket.id, userId, { roomId });
      }

      const userJoinedEvent = {
        userId,
        username,
        personagemId: data.personagemId || null,
        personagemNome: data.personagemNome || null,
        status: data.personagemId && data.personagemNome ? 'pronto' : 'selecionando',
        roomId,
        timestamp: Date.now(),
        isReconnection: wasAlreadyInRoom
      };

      sm.log('INFO', 'JOIN_ROOM_NOTIFYING_OTHERS', socket.id, userId, {
        roomId,
        eventData: userJoinedEvent,
        isReconnection: wasAlreadyInRoom,
        hasPersonagem: !!data.personagemNome
      });

      log.info({ userId, username, personagemNome: data.personagemNome, status: userJoinedEvent.status }, 'Notificando outros jogadores sobre novo usuario');

      // @event user_joined → room (broadcast) | notifies existing room members that a new player has joined or reconnected
      socket.to(roomId).emit('user_joined', userJoinedEvent);

      const roomUsers = Array.from(sm.roomUsers.get(roomId) || []);

      sm.log('INFO', 'JOIN_ROOM_PREPARING_RESPONSE', socket.id, userId, {
        roomId,
        totalUsers: roomUsers.length,
        userList: roomUsers
      });

      if (roomId.startsWith('historia_')) {
        sm.log('INFO', 'JOIN_ROOM_SENDING_HISTORIA_RESPONSE', socket.id, userId, { roomId });

        const sessaoAtual = await sm.obterSessaoHistoria(roomId);
        if (!sessaoAtual) {
          sm.log('ERROR', 'JOIN_ROOM_SESSAO_DISAPPEARED', socket.id, userId, {
            roomId,
            message: 'Sessao deveria existir mas retornou null'
          });
          // @event error → socket (direct) | sessao disappeared between join processing and response building
          socket.emit('error', { message: 'Erro ao conectar a historia' });
          return;
        }

        const responseData = {
          roomId,
          users: roomUsers,
          sessao: {
            status: sessaoAtual.status,
            historiaId: sessaoAtual.historiaId,
            historiaNome: sessaoAtual.historiaNome,
            historiaTemas: sessaoAtual.historiaTemas,
            historiaPrologo: sessaoAtual.historiaPrologo,
            mestreConfig: sessaoAtual.mestreConfig || null,
            donoId: sessaoAtual.donoId,
            donoNome: sessaoAtual.donoNome,
            maxJogadores: sessaoAtual.maxJogadores,
            totalJogadores: sessaoAtual.jogadoresConectados?.length || 0,
            jogadores: sessaoAtual.jogadores || {},
            jogadoresConectados: sessaoAtual.jogadoresConectados || [],
            estadoJogo: sessaoAtual.estadoJogo || {},
            iniciadaEm: sessaoAtual.iniciadaEm || null,
            mensagens: sessaoAtual.mensagens || []
          }
        };

        log.info({ roomId: responseData.roomId, totalJogadores: responseData.sessao.jogadoresConectados.length, jogadores: responseData.sessao.jogadoresConectados }, 'Enviando room_joined com jogadores');

        // @event room_joined → socket (direct) | confirms join for a historia room, includes full session state
        socket.emit('room_joined', responseData);

        const processingTime = Date.now() - startTime;
        sm.log('SUCCESS', 'JOIN_ROOM_HISTORIA_COMPLETED', socket.id, userId, {
          roomId,
          historiaNome: sessaoAtual.historiaNome,
          historiaId: sessaoAtual.historiaId,
          totalJogadores: sessaoAtual.jogadoresConectados?.length || 0,
          processingTimeMs: processingTime,
          responseData: {
            roomId: responseData.roomId,
            usersCount: responseData.users.length,
            sessaoStatus: responseData.sessao.status
          }
        });
        return;
      }

      const responseData = {
        roomId,
        users: roomUsers
      };

      // @event room_joined → socket (direct) | confirms join for a generic (non-historia) room
      socket.emit('room_joined', responseData);

      const processingTime = Date.now() - startTime;
      sm.log('SUCCESS', 'JOIN_ROOM_GENERIC_COMPLETED', socket.id, userId, {
        roomId,
        totalUsers: roomUsers.length,
        processingTimeMs: processingTime,
        responseData
      });
    } catch (error) {
      const processingTime = Date.now() - startTime;
      sm.log('ERROR', 'JOIN_ROOM_ERROR', socket.id, socket.userId, {
        roomId: data?.roomId,
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime,
        inputData: data
      });
      // @event error → socket (direct) | unhandled exception during join room flow
      socket.emit('error', { message: 'Erro ao entrar na sala' });
    }
  }

  async handleLeaveRoom(socket, data) {
    const sm = this.manager;
    const startTime = Date.now();

    sm.log('INFO', 'LEAVE_ROOM_PROCESSING_START', socket.id, socket.userId, {
      receivedData: data,
      currentRoom: socket.currentRoom
    });

    try {
      const { roomId: rawRoomId, userId: rawUserId, username: rawUsername } = data || {};

      if (!rawRoomId || !rawUserId) {
        sm.log('ERROR', 'LEAVE_ROOM_VALIDATION_FAILED', socket.id, socket.userId, {
          missingFields: {
            roomId: !rawRoomId,
            userId: !rawUserId
          },
          receivedData: data
        });
        // @event error → socket (direct) | leave attempt rejected: roomId or userId missing
        socket.emit('error', { message: 'roomId e userId sao obrigatorios' });
        return;
      }

      const roomId = String(rawRoomId);
      const userId = String(rawUserId);
      const username = rawUsername ? String(rawUsername) : 'Usuario';

      sm.log('INFO', 'LEAVE_ROOM_DATA_PARSED', socket.id, userId, {
        roomId,
        userId,
        username
      });

      sm.log('INFO', 'LEAVE_ROOM_SOCKET_LEAVE', socket.id, userId, {
        roomId,
        socketRoomsBeforeLeave: Array.from(socket.rooms)
      });

      socket.leave(roomId);
      socket.currentRoom = null;

      sm.log('SUCCESS', 'LEAVE_ROOM_SOCKET_LEFT', socket.id, userId, {
        roomId,
        socketRoomsAfterLeave: Array.from(socket.rooms)
      });

      const roomUserSet = sm.roomUsers.get(roomId);
      if (roomUserSet) {
        const wasInRoom = roomUserSet.has(userId);
        roomUserSet.delete(userId);

        sm.log('INFO', 'LEAVE_ROOM_REMOVED_FROM_USERLIST', socket.id, userId, {
          roomId,
          wasInRoom,
          remainingUsersInRoom: roomUserSet.size
        });

        if (roomUserSet.size === 0) {
          sm.roomUsers.delete(roomId);
          sm.log('INFO', 'LEAVE_ROOM_DELETED_EMPTY_ROOM', socket.id, userId, { roomId });
        }
      } else {
        sm.log('WARN', 'LEAVE_ROOM_USER_NOT_IN_ROOM', socket.id, userId, { roomId });
      }

      if (roomId.startsWith('historia_')) {
        sm.log('INFO', 'LEAVE_ROOM_REMOVING_FROM_SESSAO', socket.id, userId, { roomId });
        await this.removerJogadorSessao(roomId, userId);
        sm.log('SUCCESS', 'LEAVE_ROOM_REMOVED_FROM_SESSAO', socket.id, userId, { roomId });
      }

      const userLeftEvent = {
        userId,
        username,
        roomId,
        timestamp: Date.now()
      };

      sm.log('INFO', 'LEAVE_ROOM_NOTIFYING_OTHERS', socket.id, userId, {
        roomId,
        eventData: userLeftEvent
      });

      // @event user_left → room (broadcast) | notifies remaining room members that a player has voluntarily left
      socket.to(roomId).emit('user_left', userLeftEvent);

      // @event room_left → socket (direct) | confirms to the leaving player that they have exited the room
      socket.emit('room_left', {
        roomId,
        timestamp: Date.now()
      });

      const processingTime = Date.now() - startTime;
      sm.log('SUCCESS', 'LEAVE_ROOM_COMPLETED', socket.id, userId, {
        roomId,
        username,
        processingTimeMs: processingTime
      });
    } catch (error) {
      const processingTime = Date.now() - startTime;
      sm.log('ERROR', 'LEAVE_ROOM_ERROR', socket.id, socket.userId, {
        roomId: data?.roomId,
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime,
        inputData: data
      });
      // @event error → socket (direct) | unhandled exception during leave room flow
      socket.emit('error', { message: 'Erro ao sair da sala' });
    }
  }

  async handleDisconnect(socket, reason = 'unknown') {
    const sm = this.manager;
    const startTime = Date.now();
    const connectionDuration = socket.connectedAt ? Date.now() - socket.connectedAt : 'unknown';

    sm.log('INFO', 'DISCONNECT_PROCESSING_START', socket.id, socket.userId, {
      reason,
      connectionDurationMs: connectionDuration,
      socketProperties: {
        userId: socket.userId,
        username: socket.username,
        currentRoom: socket.currentRoom,
        authenticatedAt: socket.authenticatedAt
      }
    });

    if (!socket.userId) {
      const processingTime = Date.now() - startTime;
      sm.log('INFO', 'DISCONNECT_UNAUTHENTICATED_USER', socket.id, null, {
        reason,
        connectionDurationMs: connectionDuration,
        processingTimeMs: processingTime
      });
      return;
    }

    const username = socket.username || 'Usuario';

    sm.log('INFO', 'DISCONNECT_AUTHENTICATED_USER', socket.id, socket.userId, {
      username,
      connectedUsersBeforeRemoval: sm.connectedUsers.size
    });

    const currentSocket = sm.connectedUsers.get(socket.userId);
    if (currentSocket && currentSocket.id !== socket.id) {
      sm.log('INFO', 'DISCONNECT_SKIPPED_USER_RECONNECTED', socket.id, socket.userId, {
        newSocketId: currentSocket.id
      });
      return;
    }

    sm.connectedUsers.delete(socket.userId);

    sm.log('SUCCESS', 'DISCONNECT_REMOVED_FROM_CONNECTED_USERS', socket.id, socket.userId, {
      username,
      connectedUsersAfterRemoval: sm.connectedUsers.size
    });

    const userRooms = [];
    for (const [roomId, userSet] of sm.roomUsers.entries()) {
      if (userSet.has(socket.userId)) {
        userRooms.push(roomId);
      }
    }

    sm.log('INFO', 'DISCONNECT_USER_ROOMS_FOUND', socket.id, socket.userId, {
      totalRooms: userRooms.length,
      rooms: userRooms
    });

    for (const [roomId, userSet] of sm.roomUsers.entries()) {
      if (!userSet.has(socket.userId)) {
        continue;
      }

      sm.log('INFO', 'DISCONNECT_LEAVING_ROOM', socket.id, socket.userId, {
        roomId,
        roomType: roomId.startsWith('historia_') ? 'historia' : 'generic',
        usersInRoomBeforeLeaving: userSet.size
      });

      if (roomId.startsWith('historia_')) {
        sm.log('INFO', 'DISCONNECT_REMOVING_FROM_HISTORIA_SESSAO', socket.id, socket.userId, {
          roomId
        });
        try {
          await this.removerJogadorSessao(roomId, socket.userId);
          sm.log('SUCCESS', 'DISCONNECT_REMOVED_FROM_HISTORIA_SESSAO', socket.id, socket.userId, {
            roomId
          });
        } catch (error) {
          sm.log('ERROR', 'DISCONNECT_ERROR_REMOVING_FROM_SESSAO', socket.id, socket.userId, {
            roomId,
            error: error.message
          });
        }
      }

      userSet.delete(socket.userId);
      const shouldDeleteRoom = userSet.size === 0;

      if (shouldDeleteRoom && roomId.startsWith('historia_')) {
        try {
          const sessaoParaSnapshot = await sm.gerenciadorSessoes.obterSessao(roomId);
          if (sessaoParaSnapshot) {
            sm._tentarSnapshot(roomId, sessaoParaSnapshot, true);
            sm.log('INFO', 'DISCONNECT_FORCED_SNAPSHOT', socket.id, socket.userId, { roomId });
          }
        } catch (snapErr) {
          sm.log('ERROR', 'DISCONNECT_SNAPSHOT_ERROR', socket.id, socket.userId, {
            roomId,
            error: snapErr.message
          });
        }
      }

      if (shouldDeleteRoom) {
        sm.roomUsers.delete(roomId);
        sm.log('INFO', 'DISCONNECT_DELETED_EMPTY_ROOM', socket.id, socket.userId, { roomId });
      }

      const userLeftEvent = {
        userId: socket.userId,
        username,
        roomId,
        timestamp: Date.now(),
        reason: 'disconnect'
      };

      sm.log('INFO', 'DISCONNECT_NOTIFYING_ROOM_USERS', socket.id, socket.userId, {
        roomId,
        eventData: userLeftEvent,
        remainingUsersInRoom: userSet.size
      });

      // @event user_left → room (broadcast) | notifies remaining room members that a player disconnected
      socket.to(roomId).emit('user_left', userLeftEvent);
    }

    if (sm.redis) {
      sm.log('INFO', 'DISCONNECT_REDIS_CLEANUP_START', socket.id, socket.userId, {
        redisKey: `user:${socket.userId}`
      });

      try {
        await sm.redis.del(`user:${socket.userId}`);
        sm.log('SUCCESS', 'DISCONNECT_REDIS_CLEANED', socket.id, socket.userId, {
          redisKey: `user:${socket.userId}`
        });
      } catch (error) {
        sm.log('ERROR', 'DISCONNECT_REDIS_CLEANUP_ERROR', socket.id, socket.userId, {
          redisKey: `user:${socket.userId}`,
          error: error.message
        });
      }
    } else {
      sm.log('WARN', 'DISCONNECT_REDIS_UNAVAILABLE', socket.id, socket.userId);
    }

    const processingTime = Date.now() - startTime;
    sm.log('SUCCESS', 'DISCONNECT_COMPLETED', socket.id, socket.userId, {
      username,
      roomsLeft: userRooms.length,
      processingTimeMs: processingTime,
      connectionDurationMs: connectionDuration,
      finalStats: {
        connectedUsers: sm.connectedUsers.size,
        activeRooms: sm.roomUsers.size
      }
    });
  }

  async adicionarJogadorSessao(salaId, dadosJogador) {
    const sm = this.manager;

    try {
      await sm.gerenciadorSessoes.initialize();

      const sessao = await sm.gerenciadorSessoes.obterSessao(salaId);
      if (!sessao) return;

      const userId = String(dadosJogador.userId);

      if (sessao.status === 'iniciada') {
        const jogadoresConectados = Array.isArray(sessao.jogadoresConectados)
          ? sessao.jogadoresConectados
          : [];

        if (!jogadoresConectados.includes(userId)) {
          jogadoresConectados.push(userId);
          sessao.jogadoresConectados = jogadoresConectados;
          sessao.atualizadaEm = new Date().toISOString();

          await sm.gerenciadorSessoes.atualizarSessao(salaId, sessao);
          log.info({ userId, username: dadosJogador.username, salaId }, 'Jogador reconectado a sessao iniciada');
        } else {
          log.info({ userId }, 'Jogador ja esta em jogadoresConectados');
        }
        return;
      }

      const jogadoresAtuais = sessao.jogadoresConectados || [];
      const jaExiste = jogadoresAtuais.find((jogador) => String(jogador.userId) === userId);

      if (!jaExiste) {
        jogadoresAtuais.push(dadosJogador);
        sessao.jogadoresConectados = jogadoresAtuais;

        const statusAnterior = sessao.statusJogo;
        sessao.statusJogo = 'esperando';
        if (jogadoresAtuais.length === 1) {
          log.info('Primeiro jogador entrou, status: esperando');
        } else {
          log.info({ count: jogadoresAtuais.length }, 'Jogadores esperando');
        }

        sessao.atualizadaEm = new Date().toISOString();

        await sm.gerenciadorSessoes.atualizarSessao(salaId, sessao);
        log.info({ username: dadosJogador.username, salaId }, 'Jogador adicionado a sessao');

        if (statusAnterior !== sessao.statusJogo && sm.io) {
          // @event status_jogo_alterado → room (broadcast) | fires when game lobby status changes (e.g. waiting → ready)
          sm.sendToRoom(salaId, 'status_jogo_alterado', {
            statusJogo: sessao.statusJogo,
            totalJogadores: jogadoresAtuais.length,
            timestamp: Date.now()
          });
          log.info({ statusAnterior, statusNovo: sessao.statusJogo }, 'Evento status_jogo_alterado emitido');
        }
        return;
      }

      Object.assign(jaExiste, dadosJogador);
      sessao.atualizadaEm = new Date().toISOString();

      await sm.gerenciadorSessoes.atualizarSessao(salaId, sessao);
      log.info({ username: dadosJogador.username, salaId }, 'Dados do jogador atualizados na sessao');
    } catch (error) {
      log.error({ err: error }, 'Erro ao adicionar jogador a sessao');
    }
  }

  async removerJogadorSessao(salaId, userId) {
    const sm = this.manager;

    try {
      await sm.gerenciadorSessoes.initialize();

      const sessao = await sm.gerenciadorSessoes.obterSessao(salaId);
      if (!sessao || !sessao.jogadoresConectados) return;

      const userIdString = String(userId);

      if (sessao.status === 'iniciada') {
        const jogadoresConectados = Array.isArray(sessao.jogadoresConectados)
          ? sessao.jogadoresConectados
          : [];
        sessao.jogadoresConectados = jogadoresConectados.filter((id) => String(id) !== userIdString);
        sessao.atualizadaEm = new Date().toISOString();

        await sm.gerenciadorSessoes.atualizarSessao(salaId, sessao);
        log.info({ userId, salaId }, 'Jogador desconectado da sessao iniciada');
        return;
      }

      sessao.jogadoresConectados = sessao.jogadoresConectados.filter(
        (jogador) => String(jogador.userId) !== userIdString
      );
      sessao.atualizadaEm = new Date().toISOString();

      await sm.gerenciadorSessoes.atualizarSessao(salaId, sessao);
      log.info({ userId, salaId }, 'Jogador removido da sessao');
    } catch (error) {
      log.error({ err: error }, 'Erro ao remover jogador da sessao');
    }
  }
}
