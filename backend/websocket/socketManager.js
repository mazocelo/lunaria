import { Server } from 'socket.io';
import { createClient } from 'redis';
import gerenciadorSessoes from '../redis/sessoes.js';
import criarMestreRPG from '../agents/Mestre/index.js';

/**
 * Gerenciador de WebSocket para o Role Chat Game
 */
class SocketManager {
  constructor() {
    this.io = null;
    this.redis = null;
    this.gerenciadorSessoes = gerenciadorSessoes;
    this.connectedUsers = new Map(); // userId -> socket
    this.roomUsers = new Map(); // roomId -> Set of userIds
  }

  /**
   * Inicializar o servidor WebSocket
   * @param {Object} server - Servidor HTTP
   */
  async initialize(server) {
    console.log('🔌 Inicializando WebSocket...');
    
    // Criar servidor Socket.IO
    this.io = new Server(server, {
      cors: {
        origin: "*", // Em produção, especificar domínios permitidos
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    });

    // Conectar ao Redis
    await this.connectRedis();

    // Inicializar gerenciador de sessões
    try {
      await this.gerenciadorSessoes.initialize();
      console.log('✅ Gerenciador de sessões inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar gerenciador de sessões:', error);
    }

    // Configurar eventos
    this.setupEventHandlers();

    console.log('✅ WebSocket inicializado com sucesso');
  }

  /**
   * Conectar ao Redis
   */
  async connectRedis() {
    try {
      // Prioriza UPSTASH_REDIS_URL (Upstash), depois REDIS_URL, e por último localhost
      this.redis = createClient({
        url: process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379'
      });

      await this.redis.connect();
      console.log('✅ Conectado ao Redis para WebSocket');
    } catch (error) {
      console.error('❌ Erro ao conectar ao Redis:', error);
      // Continuar sem Redis se não estiver disponível
    }
  }

  /**
   * Log estruturado para eventos WebSocket
   */
  log(level, event, socketId, userId = null, data = {}) {
    const timestamp = new Date().toISOString();
    const prefix = {
      'INFO': '📡',
      'WARN': '⚠️',
      'ERROR': '❌',
      'SUCCESS': '✅',
      'DEBUG': '🔍'
    }[level] || '📡';
    
    const userInfo = userId ? `[User:${userId}]` : '';
    const socketInfo = `[Socket:${socketId?.substring(0, 8)}...]`;
    
    console.log(`${prefix} ${timestamp} ${event} ${socketInfo}${userInfo}`, data);
  }

  /**
   * Configurar handlers de eventos
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.log('INFO', 'CLIENT_CONNECTED', socket.id, null, {
        transport: socket.conn.transport.name,
        remoteAddress: socket.conn.remoteAddress,
        userAgent: socket.handshake.headers['user-agent']?.substring(0, 50)
      });

      // Evento de autenticação
      socket.on('authenticate', async (data) => {
        this.log('INFO', 'AUTH_REQUEST_RECEIVED', socket.id, data?.userId, {
          username: data?.username,
          email: data?.email,
          sessionId: data?.sessionId
        });
        try {
          await this.handleAuthentication(socket, data);
        } catch (error) {
          this.log('ERROR', 'AUTH_REQUEST_FAILED', socket.id, data?.userId, {
            error: error.message,
            stack: error.stack
          });
        }
      });

      // Evento de entrar em sala
      socket.on('join_room', async (data) => {
        this.log('INFO', 'JOIN_ROOM_REQUEST', socket.id, socket.userId, {
          roomId: data?.roomId,
          historiaId: data?.historiaId,
          username: data?.username || socket.username
        });
        try {
          await this.handleJoinRoom(socket, data);
        } catch (error) {
          this.log('ERROR', 'JOIN_ROOM_FAILED', socket.id, socket.userId, {
            roomId: data?.roomId,
            error: error.message,
            stack: error.stack
          });
        }
      });

      // Evento de sair da sala
      socket.on('leave_room', async (data) => {
        this.log('INFO', 'LEAVE_ROOM_REQUEST', socket.id, socket.userId, {
          roomId: data?.roomId || socket.currentRoom
        });
        try {
          await this.handleLeaveRoom(socket, data);
        } catch (error) {
          this.log('ERROR', 'LEAVE_ROOM_FAILED', socket.id, socket.userId, {
            roomId: data?.roomId,
            error: error.message
          });
        }
      });

      // Evento de mensagem de chat
      socket.on('chat_message', async (data) => {
        this.log('INFO', 'CHAT_MESSAGE_RECEIVED', socket.id, socket.userId, {
          roomId: data?.roomId || socket.currentRoom,
          messageLength: data?.message?.length,
          type: data?.type
        });
        try {
          await this.handleChatMessage(socket, data);
        } catch (error) {
          this.log('ERROR', 'CHAT_MESSAGE_FAILED', socket.id, socket.userId, {
            error: error.message
          });
        }
      });

      // Evento de mensagem para o Mestre (IA)
      socket.on('mensagem_para_mestre', async (data) => {
        this.log('INFO', 'MENSAGEM_PARA_MESTRE_RECEIVED', socket.id, socket.userId, {
          roomId: data?.roomId || socket.currentRoom,
          messageLength: data?.mensagem?.length,
          personagem: data?.personagem?.nome
        });
        try {
          await this.handleMensagemParaMestre(socket, data);
        } catch (error) {
          this.log('ERROR', 'MENSAGEM_PARA_MESTRE_FAILED', socket.id, socket.userId, {
            error: error.message,
            stack: error.stack
          });
        }
      });

      // Evento de mensagem roleplay (jogadores fora do turno)
      socket.on('mensagem_roleplay', async (data) => {
        this.log('INFO', 'MENSAGEM_ROLEPLAY_RECEIVED', socket.id, socket.userId, {
          roomId: data?.roomId || socket.currentRoom,
          messageLength: data?.mensagem?.length,
          username: data?.username || socket.username
        });
        try {
          await this.handleMensagemRoleplay(socket, data);
        } catch (error) {
          this.log('ERROR', 'MENSAGEM_ROLEPLAY_FAILED', socket.id, socket.userId, {
            error: error.message,
            stack: error.stack
          });
        }
      });

      // Evento de ação RPG
      socket.on('rpg_action', async (data) => {
        this.log('INFO', 'RPG_ACTION_RECEIVED', socket.id, socket.userId, {
          roomId: data?.roomId || socket.currentRoom,
          action: data?.action,
          target: data?.target
        });
        try {
          await this.handleRpgAction(socket, data);
        } catch (error) {
          this.log('ERROR', 'RPG_ACTION_FAILED', socket.id, socket.userId, {
            action: data?.action,
            error: error.message
          });
        }
      });

      // Evento de rolagem de dados
      socket.on('dice_roll', async (data) => {
        this.log('INFO', 'DICE_ROLL_RECEIVED', socket.id, socket.userId, {
          roomId: data?.roomId || socket.currentRoom,
          diceType: data?.diceType,
          quantity: data?.quantity,
          modifier: data?.modifier
        });
        try {
          await this.handleDiceRoll(socket, data);
        } catch (error) {
          this.log('ERROR', 'DICE_ROLL_FAILED', socket.id, socket.userId, {
            error: error.message
          });
        }
      });

      // Evento de rolagem de dado inicial (d20 para definir ordem)
      socket.on('rolar_dado_inicial', async (data) => {
        this.log('INFO', 'ROLAR_DADO_INICIAL_RECEIVED', socket.id, socket.userId, {
          roomId: data?.roomId || socket.currentRoom,
          username: data?.username || socket.username
        });
        try {
          await this.handleRolarDadoInicial(socket, data);
        } catch (error) {
          this.log('ERROR', 'ROLAR_DADO_INICIAL_FAILED', socket.id, socket.userId, {
            error: error.message,
            stack: error.stack
          });
        }
      });

      // Evento de iniciar turno (jogador clica para receber mensagem inicial do Mestre)
      socket.on('iniciar_turno', async (data) => {
        this.log('INFO', 'INICIAR_TURNO_RECEIVED', socket.id, socket.userId, {
          roomId: data?.roomId || socket.currentRoom,
          userId: data?.userId,
          username: data?.username
        });
        try {
          await this.handleIniciarTurno(socket, data);
        } catch (error) {
          this.log('ERROR', 'INICIAR_TURNO_FAILED', socket.id, socket.userId, {
            error: error.message,
            stack: error.stack
          });
        }
      });

      // Evento de atualização de status
      socket.on('status_update', async (data) => {
        this.log('INFO', 'STATUS_UPDATE_RECEIVED', socket.id, socket.userId, {
          roomId: data?.roomId || socket.currentRoom,
          status: data?.status,
          attribute: data?.attribute
        });
        try {
          await this.handleStatusUpdate(socket, data);
        } catch (error) {
          this.log('ERROR', 'STATUS_UPDATE_FAILED', socket.id, socket.userId, {
            error: error.message
          });
        }
      });

      // Evento de ping para manter conexão
      socket.on('ping', () => {
        this.log('DEBUG', 'PING_RECEIVED', socket.id, socket.userId);
        socket.emit('pong', { timestamp: Date.now() });
        this.log('DEBUG', 'PONG_SENT', socket.id, socket.userId);
      });

      // Evento de desconexão
      socket.on('disconnect', (reason) => {
        this.log('WARN', 'CLIENT_DISCONNECTING', socket.id, socket.userId, {
          reason: reason,
          currentRoom: socket.currentRoom,
          connectionDuration: socket.connectedAt ? Date.now() - socket.connectedAt : 'unknown'
        });
        this.handleDisconnect(socket, reason);
      });

      // Log de eventos genéricos não tratados
      socket.onAny((eventName, ...args) => {
        if (!['authenticate', 'join_room', 'leave_room', 'chat_message', 'rpg_action', 'dice_roll', 'status_update', 'ping', 'disconnect'].includes(eventName)) {
          this.log('WARN', 'UNKNOWN_EVENT_RECEIVED', socket.id, socket.userId, {
            eventName: eventName,
            argsCount: args.length,
            firstArg: args[0] ? JSON.stringify(args[0]).substring(0, 100) : 'undefined'
          });
        }
      });

      // Marcar timestamp de conexão
      socket.connectedAt = Date.now();
    });
  }

  /**
   * Handler para autenticação
   */
  async handleAuthentication(socket, data) {
    const startTime = Date.now();
    this.log('INFO', 'AUTH_PROCESSING_START', socket.id, data?.userId, {
      receivedData: {
        userId: data?.userId,
        username: data?.username,
        email: data?.email,
        sessionId: data?.sessionId,
        token: data?.token ? `${data.token.substring(0, 10)}...` : 'absent'
      }
    });

    try {
      const { userId: rawUserId, username: rawUsername, sessionId: rawSessionId } = data || {};

      if (!rawUserId || !rawUsername) {
        this.log('ERROR', 'AUTH_VALIDATION_FAILED', socket.id, rawUserId, {
          missingFields: {
            userId: !rawUserId,
            username: !rawUsername
          },
          receivedData: data
        });
        socket.emit('error', { message: 'userId e username são obrigatórios' });
        return;
      }

      // Fazer parsing dos dados para tipos corretos
      const userId = String(rawUserId);
      const username = String(rawUsername);
      const sessionId = rawSessionId ? String(rawSessionId) : null;

      this.log('INFO', 'AUTH_DATA_PARSED', socket.id, userId, {
        parsedData: {
          userId: userId,
          username: username,
          sessionId: sessionId,
          hasEmail: !!data?.email,
          hasToken: !!data?.token
        }
      });

      // Verificar se usuário já está conectado
      const existingSocket = this.connectedUsers.get(userId);
      if (existingSocket && existingSocket.id !== socket.id) {
        this.log('WARN', 'AUTH_USER_ALREADY_CONNECTED', socket.id, userId, {
          existingSocketId: existingSocket.id,
          existingSocketConnected: existingSocket.connected
        });
        
        // Desconectar conexão anterior
        existingSocket.emit('force_disconnect', { 
          reason: 'Nova conexão detectada',
          timestamp: Date.now()
        });
        existingSocket.disconnect(true);
        this.log('INFO', 'AUTH_PREVIOUS_CONNECTION_TERMINATED', existingSocket.id, userId);
      }

      // Armazenar informações do usuário
      socket.userId = userId;
      socket.username = username;
      socket.sessionId = sessionId;
      socket.authenticatedAt = Date.now();

      this.connectedUsers.set(userId, socket);

      this.log('INFO', 'AUTH_USER_DATA_STORED', socket.id, userId, {
        connectedUsersCount: this.connectedUsers.size,
        socketProperties: {
          userId: socket.userId,
          username: socket.username,
          sessionId: socket.sessionId
        }
      });

      // Salvar no Redis com valores parseados
      if (this.redis) {
        const redisData = {
          socketId: socket.id,
          username: username,
          connectedAt: Date.now().toString()
        };

        // Adicionar sessionId apenas se existir
        if (sessionId) {
          redisData.sessionId = sessionId;
        }

        this.log('INFO', 'AUTH_REDIS_SAVE_START', socket.id, userId, {
          redisKey: `user:${userId}`,
          redisData: redisData
        });

        await this.redis.hSet(`user:${userId}`, redisData);
        
        this.log('SUCCESS', 'AUTH_REDIS_SAVE_SUCCESS', socket.id, userId, {
          redisKey: `user:${userId}`
        });
      } else {
        this.log('WARN', 'AUTH_REDIS_UNAVAILABLE', socket.id, userId, {
          message: 'Redis não disponível para salvar dados do usuário'
        });
      }

      const authResponse = {
        userId,
        username,
        socketId: socket.id,
        sessionId: sessionId
      };

      socket.emit('authenticated', authResponse);

      const processingTime = Date.now() - startTime;
      this.log('SUCCESS', 'AUTH_COMPLETED', socket.id, userId, {
        username: username,
        sessionId: sessionId,
        processingTimeMs: processingTime,
        responseData: authResponse
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.log('ERROR', 'AUTH_ERROR', socket.id, data?.userId, {
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime,
        inputData: data
      });
      socket.emit('error', { message: 'Erro na autenticação' });
    }
  }

  /**
   * Handler para entrar em sala (conectar a uma história)
   */
  async handleJoinRoom(socket, data) {
    const startTime = Date.now();
    this.log('INFO', 'JOIN_ROOM_PROCESSING_START', socket.id, socket.userId, {
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
      // ===== VALIDAÇÃO 1: Socket autenticado =====
      if (!socket.userId) {
        this.log('ERROR', 'JOIN_ROOM_NOT_AUTHENTICATED', socket.id, null, {
          message: 'Socket não autenticado',
          socketId: socket.id,
          receivedData: data
        });
        socket.emit('error', { 
          message: 'Socket não autenticado. Execute authenticate() primeiro.',
          code: 'NOT_AUTHENTICATED' 
        });
        return;
      }

      // ===== VALIDAÇÃO 2: Dados obrigatórios =====
      const { roomId: rawRoomId, userId: rawUserId, username: rawUsername, historiaId: rawHistoriaId } = data || {};

      if (!rawRoomId || !rawUserId) {
        this.log('ERROR', 'JOIN_ROOM_VALIDATION_FAILED', socket.id, socket.userId, {
          missingFields: {
            roomId: !rawRoomId,
            userId: !rawUserId
          },
          receivedData: data
        });
        socket.emit('error', { 
          message: 'roomId e userId são obrigatórios',
          code: 'MISSING_REQUIRED_FIELDS'
        });
        return;
      }

      // Fazer parsing dos dados para tipos corretos
      const roomId = String(rawRoomId);
      const userId = String(rawUserId);
      const username = rawUsername ? String(rawUsername) : 'Usuario';
      const historiaId = rawHistoriaId ? String(rawHistoriaId) : null;

      this.log('INFO', 'JOIN_ROOM_DATA_PARSED', socket.id, userId, {
        parsedData: {
          roomId: roomId,
          userId: userId,
          username: username,
          historiaId: historiaId
        },
        roomType: roomId.startsWith('historia_') ? 'historia' : 'generic'
      });

      // Verificar se usuário está tentando entrar em uma sala diferente
      if (socket.currentRoom && socket.currentRoom !== roomId) {
        this.log('INFO', 'JOIN_ROOM_LEAVING_CURRENT', socket.id, userId, {
          currentRoom: socket.currentRoom,
          targetRoom: roomId
        });
        
        // Sair da sala atual primeiro
        await this.handleLeaveRoom(socket, { roomId: socket.currentRoom });
      }

      // Verificar se é uma sala de história
      if (roomId.startsWith('historia_')) {
        this.log('INFO', 'JOIN_ROOM_HISTORIA_TYPE', socket.id, userId, {
          roomId: roomId,
          extractedHistoriaId: historiaId
        });

        // Obter ou criar sessão da história (isso também valida se a história existe)
        const sessao = await this.obterSessaoHistoria(roomId);
        
        if (!sessao) {
          this.log('ERROR', 'JOIN_ROOM_SESSAO_NOT_FOUND', socket.id, userId, {
            roomId: roomId,
            historiaId: historiaId
          });
          socket.emit('error', { 
            message: 'História não encontrada.',
            code: 'HISTORIA_NAO_ENCONTRADA'
          });
          return;
        }
        
        this.log('SUCCESS', 'JOIN_ROOM_SESSAO_FOUND', socket.id, userId, {
          sessaoStatus: sessao.status,
          historiaNome: sessao.historiaNome,
          historiaId: sessao.historiaId,
          maxJogadores: sessao.maxJogadores,
          jogadoresConectados: sessao.jogadoresConectados?.length || 0,
          donoId: sessao.donoId
        });

        // Se a sessão foi iniciada, bloquear entrada de novos usuários
        if (sessao.status === 'iniciada') {
          // Verificar se o usuário está no mapa de jogadores (participou do início)
          const estaNoMapaJogadores = sessao.jogadores && sessao.jogadores[String(userId)];
          
          this.log('INFO', 'JOIN_ROOM_AVENTURA_INICIADA_CHECK', socket.id, userId, {
            sessaoStatus: sessao.status,
            userId: userId,
            userIdTipo: typeof userId,
            estaNoMapaJogadores: !!estaNoMapaJogadores,
            mapaJogadores: sessao.jogadores ? Object.keys(sessao.jogadores) : [],
            jogadoresConectados: sessao.jogadoresConectados || []
          });
          
          if (!estaNoMapaJogadores) {
            this.log('ERROR', 'JOIN_ROOM_AVENTURA_INICIADA_BLOCKED', socket.id, userId, {
              roomId: roomId,
              sessaoStatus: sessao.status,
              motivo: 'Usuário não está no mapa de jogadores'
            });
            socket.emit('error', { 
              message: 'A aventura já foi iniciada. Não é possível entrar agora.',
              code: 'AVENTURA_INICIADA'
            });
            return;
          } else {
            console.log('✅ Permitindo reconexão de jogador existente na sessão iniciada:', {
              userId,
              username: socket.username,
              personagem: estaNoMapaJogadores.personagemNome
            });
            this.log('INFO', 'JOIN_ROOM_RECONNECTION_ALLOWED', socket.id, userId, {
              username: username,
              sessaoStatus: sessao.status,
              personagem: estaNoMapaJogadores.personagemNome
            });
          }
        }
        
        // Verificar limite de jogadores
        if (sessao.maxJogadores) {
          const jogadoresAtuais = sessao.jogadoresConectados?.length || 0;
          this.log('INFO', 'JOIN_ROOM_CAPACITY_CHECK', socket.id, userId, {
            jogadoresAtuais: jogadoresAtuais,
            maxJogadores: sessao.maxJogadores,
            roomId: roomId
          });
          
          if (jogadoresAtuais >= sessao.maxJogadores) {
            const jaConectado = sessao.jogadoresConectados?.some(j => j.userId === userId);
            if (!jaConectado) {
              this.log('ERROR', 'JOIN_ROOM_CAPACITY_EXCEEDED', socket.id, userId, {
                jogadoresAtuais: jogadoresAtuais,
                maxJogadores: sessao.maxJogadores,
                roomId: roomId
              });
              socket.emit('error', { 
                message: `Sala lotada. Máximo de ${sessao.maxJogadores} jogadores.`,
                code: 'SALA_LOTADA' 
              });
              return;
            } else {
              this.log('INFO', 'JOIN_ROOM_CAPACITY_RECONNECTION_ALLOWED', socket.id, userId, {
                message: 'Usuário já conectado anteriormente, permitindo reconexão mesmo com sala lotada'
              });
            }
          }
        }
      }

      // Entrar na sala
      this.log('INFO', 'JOIN_ROOM_SOCKET_JOIN_START', socket.id, userId, {
        roomId: roomId,
        previousRoom: socket.currentRoom
      });

      socket.join(roomId);
      socket.currentRoom = roomId;

      this.log('SUCCESS', 'JOIN_ROOM_SOCKET_JOINED', socket.id, userId, {
        roomId: roomId,
        socketRoomsCount: socket.rooms.size
      });

      // Adicionar usuário à lista da sala
      if (!this.roomUsers.has(roomId)) {
        this.roomUsers.set(roomId, new Set());
        this.log('INFO', 'JOIN_ROOM_CREATED_ROOM_USERLIST', socket.id, userId, {
          roomId: roomId
        });
      }
      
      const wasAlreadyInRoom = this.roomUsers.get(roomId).has(userId);
      this.roomUsers.get(roomId).add(userId);

      // Detectar se é convidado (não é o dono da sala) - APÓS obter sessão
      let isOwner = false;
      let isGuest = false;
      
      if (roomId.startsWith('historia_')) {
        // Buscar sessão se já não estiver disponível neste escopo
        const sessaoParaDeteccao = await this.obterSessaoHistoria(roomId);
        if (sessaoParaDeteccao) {
          isOwner = sessaoParaDeteccao.donoId === userId;
          isGuest = !isOwner && !wasAlreadyInRoom;
        }
      }

      this.log('INFO', 'JOIN_ROOM_ADDED_TO_USERLIST', socket.id, userId, {
        roomId: roomId,
        wasAlreadyInRoom: wasAlreadyInRoom,
        totalUsersInRoom: this.roomUsers.get(roomId).size,
        username: username,
        isOwner: isOwner,
        isGuest: isGuest
      });

      // Log específico para convidados
      if (isGuest) {
        this.log('SUCCESS', 'GUEST_JOINED_ROOM', socket.id, userId, {
          roomId: roomId,
          username: username,
          totalJogadores: this.roomUsers.get(roomId).size
        });
      }

      // Atualizar sessão no Redis se for uma história
      if (roomId.startsWith('historia_')) {
        this.log('INFO', 'JOIN_ROOM_UPDATING_SESSAO', socket.id, userId, {
          roomId: roomId
        });

        await this.adicionarJogadorSessao(roomId, {
          userId,
          username,
          personagemId: data.personagemId || null,
          personagemNome: data.personagemNome || null,
          status: data.personagemId && data.personagemNome ? 'pronto' : 'selecionando',
          socketId: socket.id,
          conectadoEm: new Date().toISOString()
        });

        this.log('SUCCESS', 'JOIN_ROOM_SESSAO_UPDATED', socket.id, userId, {
          roomId: roomId
        });
      }

      // Dados de usuário já salvos via gerenciadorSessoes.adicionarJogadorSessao()
      // Não precisamos mais salvar em room:* duplicado

      // Notificar outros usuários (incluir dados do personagem)
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

      this.log('INFO', 'JOIN_ROOM_NOTIFYING_OTHERS', socket.id, userId, {
        roomId: roomId,
        eventData: userJoinedEvent,
        isReconnection: wasAlreadyInRoom,
        hasPersonagem: !!data.personagemNome
      });

      console.log('📢 SocketManager: Notificando outros jogadores sobre novo usuário:', {
        userId,
        username,
        personagemNome: data.personagemNome,
        status: userJoinedEvent.status
      });

      socket.to(roomId).emit('user_joined', userJoinedEvent);

      // Obter lista de usuários na sala
      const roomUsers = Array.from(this.roomUsers.get(roomId) || []);
      
      this.log('INFO', 'JOIN_ROOM_PREPARING_RESPONSE', socket.id, userId, {
        roomId: roomId,
        totalUsers: roomUsers.length,
        userList: roomUsers
      });
      
      // Se for uma história, enviar dados da sessão também
      if (roomId.startsWith('historia_')) {
        this.log('INFO', 'JOIN_ROOM_SENDING_HISTORIA_RESPONSE', socket.id, userId, {
          roomId: roomId
        });

        // Obter sessão (que já foi criada/validada anteriormente)
        const sessao = await this.obterSessaoHistoria(roomId);
        
        if (sessao) {
          const responseData = {
            roomId,
            users: roomUsers,
            sessao: {
              status: sessao.status,
              historiaId: sessao.historiaId,
              historiaNome: sessao.historiaNome,
              historiaTemas: sessao.historiaTemas,
              historiaPrologo: sessao.historiaPrologo,
              donoId: sessao.donoId,
              donoNome: sessao.donoNome,
              maxJogadores: sessao.maxJogadores,
              totalJogadores: sessao.jogadoresConectados?.length || 0,
              jogadores: sessao.jogadores || {},  // ← Mapa de jogadores
              jogadoresConectados: sessao.jogadoresConectados || [],  // ← Array de IDs
              estadoJogo: sessao.estadoJogo || {},  // ← Estado completo do jogo
              iniciadaEm: sessao.iniciadaEm || null,
              mensagens: sessao.mensagens || []  // ← Mensagens do chat
            }
          };

          console.log('📤 SocketManager: Enviando room_joined com jogadores:', {
            roomId: responseData.roomId,
            totalJogadores: responseData.sessao.jogadoresConectados.length,
            jogadores: responseData.sessao.jogadoresConectados
          });

          socket.emit('room_joined', responseData);
          
          const processingTime = Date.now() - startTime;
          this.log('SUCCESS', 'JOIN_ROOM_HISTORIA_COMPLETED', socket.id, userId, {
            roomId: roomId,
            historiaNome: sessao.historiaNome,
            historiaId: sessao.historiaId,
            totalJogadores: sessao.jogadoresConectados?.length || 0,
            processingTimeMs: processingTime,
            responseData: {
              roomId: responseData.roomId,
              usersCount: responseData.users.length,
              sessaoStatus: responseData.sessao.status
            }
          });
        } else {
          // Se chegou aqui, algo deu errado
          this.log('ERROR', 'JOIN_ROOM_SESSAO_DISAPPEARED', socket.id, userId, {
            roomId: roomId,
            message: 'Sessão deveria existir mas retornou null'
          });
          socket.emit('error', { message: 'Erro ao conectar à história' });
          return;
        }
      } else {
        const responseData = {
          roomId,
          users: roomUsers
        };
        
        socket.emit('room_joined', responseData);
        
        const processingTime = Date.now() - startTime;
        this.log('SUCCESS', 'JOIN_ROOM_GENERIC_COMPLETED', socket.id, userId, {
          roomId: roomId,
          totalUsers: roomUsers.length,
          processingTimeMs: processingTime,
          responseData: responseData
        });
      }

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.log('ERROR', 'JOIN_ROOM_ERROR', socket.id, socket.userId, {
        roomId: data?.roomId,
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime,
        inputData: data
      });
      socket.emit('error', { message: 'Erro ao entrar na sala' });
    }
  }

  /**
   * Handler para sair da sala
   */
  async handleLeaveRoom(socket, data) {
    const startTime = Date.now();
    this.log('INFO', 'LEAVE_ROOM_PROCESSING_START', socket.id, socket.userId, {
      receivedData: data,
      currentRoom: socket.currentRoom
    });

    try {
      const { roomId: rawRoomId, userId: rawUserId, username: rawUsername } = data || {};

      if (!rawRoomId || !rawUserId) {
        this.log('ERROR', 'LEAVE_ROOM_VALIDATION_FAILED', socket.id, socket.userId, {
          missingFields: {
            roomId: !rawRoomId,
            userId: !rawUserId
          },
          receivedData: data
        });
        socket.emit('error', { message: 'roomId e userId são obrigatórios' });
        return;
      }

      // Fazer parsing dos dados para tipos corretos
      const roomId = String(rawRoomId);
      const userId = String(rawUserId);
      const username = rawUsername ? String(rawUsername) : 'Usuario';

      this.log('INFO', 'LEAVE_ROOM_DATA_PARSED', socket.id, userId, {
        roomId: roomId,
        userId: userId,
        username: username
      });

      // Sair da sala
      this.log('INFO', 'LEAVE_ROOM_SOCKET_LEAVE', socket.id, userId, {
        roomId: roomId,
        socketRoomsBeforeLeave: Array.from(socket.rooms)
      });

      socket.leave(roomId);
      socket.currentRoom = null;

      this.log('SUCCESS', 'LEAVE_ROOM_SOCKET_LEFT', socket.id, userId, {
        roomId: roomId,
        socketRoomsAfterLeave: Array.from(socket.rooms)
      });

      // Remover usuário da lista da sala
      const roomUserSet = this.roomUsers.get(roomId);
      if (roomUserSet) {
        const wasInRoom = roomUserSet.has(userId);
        roomUserSet.delete(userId);
        
        this.log('INFO', 'LEAVE_ROOM_REMOVED_FROM_USERLIST', socket.id, userId, {
          roomId: roomId,
          wasInRoom: wasInRoom,
          remainingUsersInRoom: roomUserSet.size
        });
        
        if (roomUserSet.size === 0) {
          this.roomUsers.delete(roomId);
          this.log('INFO', 'LEAVE_ROOM_DELETED_EMPTY_ROOM', socket.id, userId, {
            roomId: roomId
          });
        }
      } else {
        this.log('WARN', 'LEAVE_ROOM_USER_NOT_IN_ROOM', socket.id, userId, {
          roomId: roomId
        });
      }

      // Remover da sessão se for uma história
      if (roomId.startsWith('historia_')) {
        this.log('INFO', 'LEAVE_ROOM_REMOVING_FROM_SESSAO', socket.id, userId, {
          roomId: roomId
        });
        await this.removerJogadorSessao(roomId, userId);
        this.log('SUCCESS', 'LEAVE_ROOM_REMOVED_FROM_SESSAO', socket.id, userId, {
          roomId: roomId
        });
      }

      // Dados de usuário já removidos via gerenciadorSessoes.removerJogadorSessao()
      // Não precisamos mais remover de room:* duplicado

      // Notificar outros usuários
      const userLeftEvent = {
        userId,
        username,
        roomId,
        timestamp: Date.now()
      };

      this.log('INFO', 'LEAVE_ROOM_NOTIFYING_OTHERS', socket.id, userId, {
        roomId: roomId,
        eventData: userLeftEvent
      });

      socket.to(roomId).emit('user_left', userLeftEvent);

      // Confirmar saída para o usuário
      const roomLeftEvent = {
        roomId,
        timestamp: Date.now()
      };

      socket.emit('room_left', roomLeftEvent);

      const processingTime = Date.now() - startTime;
      this.log('SUCCESS', 'LEAVE_ROOM_COMPLETED', socket.id, userId, {
        roomId: roomId,
        username: username,
        processingTimeMs: processingTime
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.log('ERROR', 'LEAVE_ROOM_ERROR', socket.id, socket.userId, {
        roomId: data?.roomId,
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime,
        inputData: data
      });
      socket.emit('error', { message: 'Erro ao sair da sala' });
    }
  }

  /**
   * Handler para mensagem de chat
   */
  async handleChatMessage(socket, data) {
    const startTime = Date.now();
    this.log('INFO', 'CHAT_MESSAGE_PROCESSING_START', socket.id, socket.userId, {
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
        this.log('ERROR', 'CHAT_MESSAGE_VALIDATION_FAILED', socket.id, socket.userId, {
          missingFields: {
            roomId: !rawRoomId,
            userId: !rawUserId,
            message: !rawMessage
          },
          receivedData: data
        });
        socket.emit('error', { message: 'roomId, userId e message são obrigatórios' });
        return;
      }

      // Fazer parsing dos dados para tipos corretos
      const roomId = String(rawRoomId);
      const userId = String(rawUserId);
      const username = rawUsername ? String(rawUsername) : 'Usuario';
      const message = String(rawMessage);
      const type = String(rawType);

      this.log('INFO', 'CHAT_MESSAGE_DATA_PARSED', socket.id, userId, {
        roomId: roomId,
        username: username,
        messageLength: message.length,
        type: type,
        messageTruncated: message.length > 100 ? `${message.substring(0, 100)}...` : message
      });

      const messageData = {
        id: Date.now().toString(),
        userId,
        username,
        message,
        type,
        roomId,
        timestamp: Date.now().toString()
      };

      // Mensagens de chat não precisam persistência separada
      // handleMensagemParaMestre já salva mensagens importantes na rpg_session

      // Enviar para todos na sala
      this.log('INFO', 'CHAT_MESSAGE_BROADCASTING', socket.id, userId, {
        roomId: roomId,
        messageId: messageData.id,
        type: type
      });

      this.io.to(roomId).emit('chat_message', messageData);

      const processingTime = Date.now() - startTime;
      this.log('SUCCESS', 'CHAT_MESSAGE_COMPLETED', socket.id, userId, {
        roomId: roomId,
        messageId: messageData.id,
        username: username,
        messageLength: message.length,
        type: type,
        processingTimeMs: processingTime
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.log('ERROR', 'CHAT_MESSAGE_ERROR', socket.id, socket.userId, {
        roomId: data?.roomId,
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime,
        inputData: data
      });
      socket.emit('error', { message: 'Erro ao processar mensagem' });
    }
  }

  /**
   * Handler para ação RPG
   */
  async handleRpgAction(socket, data) {
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
        socket.emit('error', { message: 'roomId, userId e action são obrigatórios' });
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
        await this.gerenciadorSessoes.adicionarAcao(roomId, actionData);
      }

      // Enviar para todos na sala
      this.io.to(roomId).emit('rpg_action', actionData);

      console.log(`⚔️ ${username} executou ação: ${action} (sala ${roomId})`);

    } catch (error) {
      console.error('❌ Erro ao processar ação RPG:', error);
      socket.emit('error', { message: 'Erro ao processar ação RPG' });
    }
  }

  /**
   * Handler para rolagem de dados
   */
  async handleDiceRoll(socket, data) {
    try {
      const { 
        roomId: rawRoomId, 
        userId: rawUserId, 
        username: rawUsername, 
        dice: rawDice, 
        result: rawResult, 
        description: rawDescription 
      } = data || {};

      if (!rawRoomId || !rawUserId || !rawDice || !rawResult) {
        socket.emit('error', { message: 'roomId, userId, dice e result são obrigatórios' });
        return;
      }

      // Fazer parsing dos dados para tipos corretos
      const roomId = String(rawRoomId);
      const userId = String(rawUserId);
      const username = rawUsername ? String(rawUsername) : 'Usuario';
      const dice = String(rawDice);
      const result = String(rawResult);
      const description = rawDescription ? String(rawDescription) : null;

      const rollData = {
        id: Date.now().toString(),
        userId,
        username,
        dice,
        result,
        description,
        roomId,
        timestamp: Date.now().toString()
      };

      // Salvar rolagem na sessão unificada
      if (roomId.startsWith('historia_')) {
        await this.gerenciadorSessoes.adicionarRolagem(roomId, rollData);
      }

      // Enviar para todos na sala
      this.io.to(roomId).emit('dice_roll', rollData);

      console.log(`🎲 ${username} rolou ${dice}: ${result} (sala ${roomId})`);

    } catch (error) {
      console.error('❌ Erro ao processar rolagem:', error);
      socket.emit('error', { message: 'Erro ao processar rolagem' });
    }
  }

  /**
   * Handler para rolagem de dado inicial (d20) para definir ordem de jogadores
   */
  async handleRolarDadoInicial(socket, data) {
    const startTime = Date.now();
    this.log('INFO', 'ROLAR_DADO_INICIAL_PROCESSING_START', socket.id, socket.userId, {
      receivedData: data
    });

    try {
      const { 
        roomId: rawRoomId, 
        userId: rawUserId, 
        username: rawUsername 
      } = data || {};

      if (!rawRoomId || !rawUserId) {
        this.log('ERROR', 'ROLAR_DADO_INICIAL_VALIDATION_FAILED', socket.id, socket.userId, {
          missingFields: {
            roomId: !rawRoomId,
            userId: !rawUserId
          }
        });
        socket.emit('error', { message: 'roomId e userId são obrigatórios' });
        return;
      }

      // Parsing dos dados
      const roomId = String(rawRoomId);
      const userId = String(rawUserId);
      const username = rawUsername ? String(rawUsername) : socket.username || 'Jogador';

      this.log('INFO', 'ROLAR_DADO_INICIAL_DATA_PARSED', socket.id, userId, {
        roomId,
        username
      });

      // Obter sessão
      const sessao = await this.obterSessaoHistoria(roomId);
      if (!sessao) {
        this.log('ERROR', 'ROLAR_DADO_INICIAL_SESSAO_NOT_FOUND', socket.id, userId, {
          roomId
        });
        return socket.emit('error', { message: 'Sessão não encontrada' });
      }

      // Verificar se jogador já rolou
      const estadoJogo = sessao.estadoJogo || {};
      const rolagemInicial = estadoJogo.rolagemInicial || {};
      
      if (rolagemInicial[userId]) {
        this.log('WARN', 'ROLAR_DADO_INICIAL_JA_ROLOU', socket.id, userId, {
          roomId,
          valorAnterior: rolagemInicial[userId].valor
        });
        return socket.emit('erro_dado_inicial', { 
          message: 'Você já rolou o dado inicial',
          valorAnterior: rolagemInicial[userId].valor
        });
      }

      // ⚡ GERAR VALOR DO DADO NO BACKEND (1-20)
      const valorDado = Math.floor(Math.random() * 20) + 1;

      this.log('SUCCESS', 'ROLAR_DADO_INICIAL_VALOR_GERADO', socket.id, userId, {
        roomId,
        username,
        valorDado
      });

      // Registrar rolagem no Redis
      await this.gerenciadorSessoes.registrarRolagemDado(roomId, userId, valorDado);

      // Obter informações do personagem
      const jogadores = sessao.jogadores || {};
      const jogador = jogadores[userId] || {};
      const personagemNome = jogador.personagemNome || null;

      // Emitir resultado para toda a sala
      const resultadoData = {
        userId,
        username,
        personagemNome,
        valor: valorDado,
        timestamp: Date.now()
      };

      this.log('INFO', 'ROLAR_DADO_INICIAL_BROADCASTING', socket.id, userId, {
        roomId,
        resultadoData
      });

      this.io.to(roomId).emit('resultado_dado_inicial', resultadoData);

      // Verificar se todos jogadores rolaram
      const sessaoAtualizada = await this.obterSessaoHistoria(roomId);
      const estadoJogoAtualizado = sessaoAtualizada.estadoJogo || {};
      const rolagemInicialAtualizada = estadoJogoAtualizado.rolagemInicial || {};
      const totalJogadores = Object.keys(sessaoAtualizada.jogadores || {}).length;
      const totalRolagens = Object.keys(rolagemInicialAtualizada).length;

      this.log('INFO', 'ROLAR_DADO_INICIAL_CHECK_TODOS_ROLARAM', socket.id, userId, {
        roomId,
        totalJogadores,
        totalRolagens
      });

      if (totalRolagens === totalJogadores && totalJogadores > 0) {
        this.log('SUCCESS', 'ROLAR_DADO_INICIAL_TODOS_ROLARAM', socket.id, userId, {
          roomId,
          totalJogadores
        });

        // Definir ordem dos jogadores
        await this.gerenciadorSessoes.definirOrdemJogadores(roomId);
        
        // Obter sessão com ordem definida
        const sessaoComOrdem = await this.obterSessaoHistoria(roomId);
        const ordemJogadores = sessaoComOrdem.estadoJogo.ordemJogadores || [];

        this.log('SUCCESS', 'ROLAR_DADO_INICIAL_ORDEM_DEFINIDA', socket.id, userId, {
          roomId,
          ordemJogadores: ordemJogadores.map(j => `${j.username} (${j.valorDado})`)
        });

        // Emitir ordem definida para todos
        this.io.to(roomId).emit('ordem_definida', {
          ordemJogadores,
          timestamp: Date.now()
        });

        // Atualizar fase para rodada em andamento
        await this.gerenciadorSessoes.atualizarFaseJogo(roomId, 'rodada_em_andamento');

        // Iniciar primeiro turno
        await this.iniciarPrimeiroTurno(roomId);
      }

      const processingTime = Date.now() - startTime;
      this.log('SUCCESS', 'ROLAR_DADO_INICIAL_COMPLETED', socket.id, userId, {
        roomId,
        username,
        valorDado,
        processingTimeMs: processingTime
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.log('ERROR', 'ROLAR_DADO_INICIAL_ERROR', socket.id, socket.userId, {
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime
      });
      socket.emit('error', { message: 'Erro ao rolar dado inicial' });
    }
  }

  /**
   * Handler para mensagem destinada ao Mestre (IA)
   */
  async handleMensagemParaMestre(socket, data) {
    const startTime = Date.now();
    this.log('INFO', 'MENSAGEM_PARA_MESTRE_PROCESSING_START', socket.id, socket.userId, {
      receivedData: {
        roomId: data?.roomId,
        userId: data?.userId,
        username: data?.username,
        personagem: data?.personagem?.nome,
        mensagemLength: data?.mensagem?.length
      }
    });

    try {
      const { 
        roomId: rawRoomId, 
        userId: rawUserId, 
        username: rawUsername, 
        mensagem: rawMensagem,
        personagem: rawPersonagem
      } = data || {};

      if (!rawRoomId || !rawUserId || !rawMensagem || !rawPersonagem) {
        this.log('ERROR', 'MENSAGEM_PARA_MESTRE_VALIDATION_FAILED', socket.id, socket.userId, {
          missingFields: {
            roomId: !rawRoomId,
            userId: !rawUserId,
            mensagem: !rawMensagem,
            personagem: !rawPersonagem
          }
        });
        socket.emit('error', { message: 'roomId, userId, mensagem e personagem são obrigatórios' });
        return;
      }

      // Parsing dos dados
      const roomId = String(rawRoomId);
      const userId = String(rawUserId);
      const username = rawUsername ? String(rawUsername) : 'Jogador';
      const mensagem = String(rawMensagem);
      const personagem = rawPersonagem;

      this.log('INFO', 'MENSAGEM_PARA_MESTRE_DATA_PARSED', socket.id, userId, {
        roomId,
        username,
        personagemNome: personagem.nome,
        mensagemTruncated: mensagem.substring(0, 100)
      });

      // 1. Obter sessão da história
      const sessao = await this.obterSessaoHistoria(roomId);
      if (!sessao) {
        this.log('ERROR', 'MENSAGEM_PARA_MESTRE_SESSAO_NOT_FOUND', socket.id, userId, {
          roomId
        });
        return socket.emit('error', { message: 'Sessão não encontrada' });
      }

      this.log('INFO', 'MENSAGEM_PARA_MESTRE_SESSAO_FOUND', socket.id, userId, {
        sessaoStatus: sessao.status,
        historiaNome: sessao.historiaNome,
        totalMensagens: sessao.mensagens?.length || 0
      });

      // 2. VERIFICAR SISTEMA DE TURNOS
      const estadoJogo = sessao.estadoJogo || {};
      const fase = estadoJogo.fase;
      
      // Se o jogo está em fase de rodadas, verificar turnos
      if (fase === 'rodada_em_andamento') {
        const turnoAtual = estadoJogo.turnoAtual || 0;
        const ordemJogadores = estadoJogo.ordemJogadores || [];
        
        if (ordemJogadores.length === 0) {
          this.log('ERROR', 'MENSAGEM_PARA_MESTRE_SEM_ORDEM', socket.id, userId, {
            roomId
          });
          return socket.emit('error', { message: 'Ordem de jogadores não definida' });
        }
        
        const jogadorDaVez = ordemJogadores[turnoAtual];
        
        // Verificar se é o turno do jogador
        if (String(jogadorDaVez.userId) !== String(userId)) {
          this.log('WARN', 'MENSAGEM_PARA_MESTRE_NAO_E_SEU_TURNO', socket.id, userId, {
            roomId,
            turnoAtual,
            jogadorDaVez: jogadorDaVez.username
          });
          return socket.emit('erro_turno', { 
            message: `Não é seu turno! Aguarde a vez de ${jogadorDaVez.username}`,
            jogadorDaVez: jogadorDaVez.username
          });
        }
        
        this.log('INFO', 'MENSAGEM_PARA_MESTRE_TURNO_VALIDADO', socket.id, userId, {
          roomId,
          turnoAtual,
          jogador: username
        });
      }

      // 3. Obter histórico de mensagens
      const historico = sessao.mensagens || [];

      // 3. Criar instância do Mestre com temas e personagens da história
      this.log('INFO', 'MENSAGEM_PARA_MESTRE_CREATING_MESTRE', socket.id, userId, {
        temas: sessao.historiaTemas,
        jogadoresCount: sessao.jogadoresConectados?.length || 0
      });

      const mestre = await criarMestreRPG(
        sessao.historiaTemas || [],
        sessao.jogadoresConectados || []
      );

      // 4. Narrar ação do jogador
      this.log('INFO', 'MENSAGEM_PARA_MESTRE_INVOKING_IA', socket.id, userId, {
        jogador: username,
        personagem: personagem.nome,
        historicoLength: historico.length
      });

      const resposta = await mestre.narrarAcao({
        jogador: username,
        personagem: personagem.nome,
        acao: mensagem,
        chatHistory: historico
      });

      this.log('SUCCESS', 'MENSAGEM_PARA_MESTRE_IA_RESPONDED', socket.id, userId, {
        narracaoLength: resposta.narracao?.length || 0
      });

      // 5. Salvar mensagem do jogador na sessão
      const mensagemJogador = {
        tipo: 'jogador',
        userId,
        username,
        personagem: personagem.nome,
        mensagem,
        timestamp: Date.now()
      };

      if (!sessao.mensagens) {
        sessao.mensagens = [];
      }
      sessao.mensagens.push(mensagemJogador);

      // 6. Salvar resposta do mestre na sessão
      const mensagemMestre = {
        tipo: 'mestre',
        userId: 'mestre',
        username: 'Mestre',
        mensagem: resposta.narracao,
        timestamp: Date.now()
      };

      sessao.mensagens.push(mensagemMestre);

      // 7. Atualizar sessão no Redis
      sessao.atualizadaEm = new Date().toISOString();
      await this.gerenciadorSessoes.atualizarSessao(roomId, sessao);

      this.log('SUCCESS', 'MENSAGEM_PARA_MESTRE_SESSAO_UPDATED', socket.id, userId, {
        roomId,
        totalMensagens: sessao.mensagens.length
      });

      // 8. Enviar mensagem do jogador para todos (echo)
      this.io.to(roomId).emit('chat_message', {
        id: Date.now().toString(),
        userId,
        username,
        personagem: personagem.nome,
        message: mensagem,
        tipo: 'jogador',
        timestamp: Date.now()
      });

      // 9. Enviar resposta do mestre para todos na sala
      this.io.to(roomId).emit('mensagem_mestre', {
        id: (Date.now() + 1).toString(),
        userId: 'mestre',
        username: 'Mestre',
        message: resposta.narracao,
        tipo: 'mestre',
        timestamp: Date.now() + 1
      });

      // 10. CONTROLE DE TURNOS: Incrementar contador e verificar se deve avançar
      if (fase === 'rodada_em_andamento') {
        const contador = await this.gerenciadorSessoes.incrementarContadorMensagensTurno(roomId);
        
        this.log('INFO', 'MENSAGEM_PARA_MESTRE_CONTADOR_INCREMENTADO', socket.id, userId, {
          roomId,
          contadorAtual: contador
        });
        
        // Se atingiu o limite de mensagens (2-3), avançar turno
        if (contador >= 2) {
          this.log('INFO', 'MENSAGEM_PARA_MESTRE_FIM_TURNO', socket.id, userId, {
            roomId,
            contador,
            jogador: username
          });
          
          // Aguardar 2 segundos antes de avançar turno (para dar tempo de ler)
          setTimeout(async () => {
            await this.avancarProximoTurno(roomId);
          }, 2000);
        }
      }

      const processingTime = Date.now() - startTime;
      this.log('SUCCESS', 'MENSAGEM_PARA_MESTRE_COMPLETED', socket.id, userId, {
        roomId,
        jogador: username,
        personagem: personagem.nome,
        processingTimeMs: processingTime
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.log('ERROR', 'MENSAGEM_PARA_MESTRE_ERROR', socket.id, socket.userId, {
        roomId: data?.roomId,
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime
      });
      socket.emit('error', { message: 'Erro ao processar mensagem para o mestre' });
    }
  }

  /**
   * Handler para mensagem roleplay (jogadores fora do turno)
   */
  async handleMensagemRoleplay(socket, data) {
    const startTime = Date.now();
    this.log('INFO', 'MENSAGEM_ROLEPLAY_PROCESSING_START', socket.id, socket.userId, {
      receivedData: {
        roomId: data?.roomId,
        userId: data?.userId,
        username: data?.username,
        mensagemLength: data?.mensagem?.length
      }
    });

    try {
      const { 
        roomId: rawRoomId, 
        userId: rawUserId, 
        username: rawUsername, 
        mensagem: rawMensagem
      } = data || {};

      if (!rawRoomId || !rawUserId || !rawMensagem) {
        this.log('ERROR', 'MENSAGEM_ROLEPLAY_VALIDATION_FAILED', socket.id, socket.userId, {
          missingFields: {
            roomId: !rawRoomId,
            userId: !rawUserId,
            mensagem: !rawMensagem
          }
        });
        socket.emit('error', { message: 'roomId, userId e mensagem são obrigatórios' });
        return;
      }

      // Parsing dos dados
      const roomId = String(rawRoomId);
      const userId = String(rawUserId);
      const username = rawUsername ? String(rawUsername) : socket.username || 'Jogador';
      const mensagem = String(rawMensagem);

      this.log('INFO', 'MENSAGEM_ROLEPLAY_DATA_PARSED', socket.id, userId, {
        roomId,
        username,
        mensagemTruncated: mensagem.substring(0, 100)
      });

      // Obter sessão
      const sessao = await this.obterSessaoHistoria(roomId);
      if (!sessao) {
        this.log('ERROR', 'MENSAGEM_ROLEPLAY_SESSAO_NOT_FOUND', socket.id, userId, {
          roomId
        });
        return socket.emit('error', { message: 'Sessão não encontrada' });
      }

      // Verificar cooldown de 12 segundos
      const cooldownRestante = await this.gerenciadorSessoes.verificarCooldownRoleplay(roomId, userId);
      
      if (cooldownRestante > 0) {
        this.log('WARN', 'MENSAGEM_ROLEPLAY_COOLDOWN_ATIVO', socket.id, userId, {
          roomId,
          cooldownRestante
        });
        return socket.emit('erro_cooldown_roleplay', { 
          message: `Aguarde ${cooldownRestante} segundos antes de enviar outra mensagem roleplay`,
          segundosRestantes: cooldownRestante
        });
      }

      this.log('INFO', 'MENSAGEM_ROLEPLAY_COOLDOWN_OK', socket.id, userId, {
        roomId
      });

      // Atualizar cooldown
      await this.gerenciadorSessoes.atualizarCooldownRoleplay(roomId, userId);

      // Salvar mensagem na sessão (marcada como roleplay)
      const mensagemRoleplay = {
        tipo: 'roleplay',
        userId,
        username,
        mensagem,
        timestamp: Date.now()
      };

      if (!sessao.mensagens) {
        sessao.mensagens = [];
      }
      sessao.mensagens.push(mensagemRoleplay);

      // Atualizar sessão no Redis
      sessao.atualizadaEm = new Date().toISOString();
      await this.gerenciadorSessoes.atualizarSessao(roomId, sessao);

      this.log('SUCCESS', 'MENSAGEM_ROLEPLAY_SALVA', socket.id, userId, {
        roomId,
        totalMensagens: sessao.mensagens.length
      });

      // Enviar mensagem roleplay para todos na sala (NÃO vai para o Mestre IA)
      this.io.to(roomId).emit('mensagem_roleplay', {
        id: Date.now().toString(),
        userId,
        username,
        message: mensagem,
        tipo: 'roleplay',
        timestamp: Date.now()
      });

      const processingTime = Date.now() - startTime;
      this.log('SUCCESS', 'MENSAGEM_ROLEPLAY_COMPLETED', socket.id, userId, {
        roomId,
        jogador: username,
        processingTimeMs: processingTime
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.log('ERROR', 'MENSAGEM_ROLEPLAY_ERROR', socket.id, socket.userId, {
        roomId: data?.roomId,
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime
      });
      socket.emit('error', { message: 'Erro ao processar mensagem roleplay' });
    }
  }

  /**
   * Handler para iniciar turno do jogador
   * Gera mensagem inicial do Mestre direcionada ao jogador
   */
  async handleIniciarTurno(socket, data) {
    const startTime = Date.now();
    this.log('INFO', 'INICIAR_TURNO_PROCESSING_START', socket.id, socket.userId, {
      receivedData: data
    });

    try {
      const { 
        roomId: rawRoomId, 
        userId: rawUserId, 
        username: rawUsername 
      } = data || {};

      if (!rawRoomId || !rawUserId) {
        this.log('ERROR', 'INICIAR_TURNO_VALIDATION_FAILED', socket.id, socket.userId, {
          missingFields: {
            roomId: !rawRoomId,
            userId: !rawUserId
          }
        });
        socket.emit('error', { message: 'roomId e userId são obrigatórios' });
        return;
      }

      // Parsing dos dados
      const roomId = String(rawRoomId);
      const userId = String(rawUserId);
      const username = rawUsername ? String(rawUsername) : socket.username || 'Jogador';

      this.log('INFO', 'INICIAR_TURNO_DATA_PARSED', socket.id, userId, {
        roomId,
        username
      });

      // Obter sessão
      const sessao = await this.obterSessaoHistoria(roomId);
      if (!sessao) {
        this.log('ERROR', 'INICIAR_TURNO_SESSAO_NOT_FOUND', socket.id, userId, {
          roomId
        });
        return socket.emit('error', { message: 'Sessão não encontrada' });
      }

      // Verificar se é o turno do jogador
      const estadoJogo = sessao.estadoJogo || {};
      const turnoAtual = estadoJogo.turnoAtual || 0;
      const ordemJogadores = estadoJogo.ordemJogadores || [];
      const jogadorDaVez = ordemJogadores[turnoAtual];
      
      if (!jogadorDaVez || String(jogadorDaVez.userId) !== String(userId)) {
        this.log('WARN', 'INICIAR_TURNO_NAO_E_SEU_TURNO', socket.id, userId, {
          roomId,
          turnoAtual,
          jogadorDaVez: jogadorDaVez?.username
        });
        return socket.emit('erro_turno', { 
          message: 'Não é seu turno!' 
        });
      }

      this.log('INFO', 'INICIAR_TURNO_VALIDADO', socket.id, userId, {
        roomId,
        turnoAtual,
        jogador: username
      });

      // Criar instância do Mestre
      const mestre = await criarMestreRPG(
        sessao.historiaTemas || [],
        sessao.jogadoresConectados || []
      );

      this.log('INFO', 'INICIAR_TURNO_GERANDO_MENSAGEM_MESTRE', socket.id, userId, {
        jogador: username,
        personagem: jogadorDaVez.personagemNome
      });

      // Gerar mensagem inicial do Mestre para o jogador
      const mensagemInicial = await mestre.narrarTurnoJogador({
        jogador: username,
        personagem: jogadorDaVez.personagemNome || username,
        mensagem: `Iniciar turno de ${jogadorDaVez.personagemNome || username}`,
        rodada: estadoJogo.rodadaAtual || 1,
        turno: turnoAtual,
        contadorMensagens: 0,
        chatHistory: sessao.mensagens || []
      });

      this.log('SUCCESS', 'INICIAR_TURNO_MENSAGEM_GERADA', socket.id, userId, {
        respostaLength: mensagemInicial.resposta?.length || 0
      });

      // Salvar mensagem do Mestre
      if (!sessao.mensagens) {
        sessao.mensagens = [];
      }
      
      sessao.mensagens.push({
        tipo: 'mestre',
        userId: 'mestre',
        username: 'Mestre',
        mensagem: mensagemInicial.resposta,
        timestamp: Date.now()
      });

      // Marcar que o turno foi iniciado
      estadoJogo.turnoIniciado = true;
      sessao.estadoJogo = estadoJogo;

      await this.gerenciadorSessoes.atualizarSessao(roomId, sessao);

      this.log('SUCCESS', 'INICIAR_TURNO_SESSAO_ATUALIZADA', socket.id, userId, {
        roomId
      });

      // Enviar mensagem do Mestre para todos
      this.io.to(roomId).emit('mensagem_mestre', {
        id: Date.now().toString(),
        userId: 'mestre',
        username: 'Mestre',
        message: mensagemInicial.resposta,
        tipo: 'mestre',
        timestamp: Date.now()
      });

      // Emitir evento de turno iniciado
      this.io.to(roomId).emit('turno_iniciado', {
        userId,
        username,
        rodada: estadoJogo.rodadaAtual || 1,
        turno: turnoAtual,
        timestamp: Date.now()
      });

      const processingTime = Date.now() - startTime;
      this.log('SUCCESS', 'INICIAR_TURNO_COMPLETED', socket.id, userId, {
        roomId,
        username,
        processingTimeMs: processingTime
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.log('ERROR', 'INICIAR_TURNO_ERROR', socket.id, socket.userId, {
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime
      });
      socket.emit('error', { message: 'Erro ao iniciar turno' });
    }
  }

  /**
   * Handler para atualização de status
   */
  async handleStatusUpdate(socket, data) {
    try {
      const { 
        roomId: rawRoomId, 
        userId: rawUserId, 
        username: rawUsername, 
        status: rawStatus, 
        details: rawDetails 
      } = data || {};

      if (!rawRoomId || !rawUserId || !rawStatus) {
        socket.emit('error', { message: 'roomId, userId e status são obrigatórios' });
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

      // Enviar para todos na sala
      this.io.to(roomId).emit('status_update', statusData);

      console.log(`📊 ${username} atualizou status: ${status} (sala ${roomId})`);

    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      socket.emit('error', { message: 'Erro ao atualizar status' });
    }
  }

  /**
   * Handler para desconexão
   */
  async handleDisconnect(socket, reason = 'unknown') {
    const startTime = Date.now();
    const connectionDuration = socket.connectedAt ? Date.now() - socket.connectedAt : 'unknown';
    
    this.log('INFO', 'DISCONNECT_PROCESSING_START', socket.id, socket.userId, {
      reason: reason,
      connectionDurationMs: connectionDuration,
      socketProperties: {
        userId: socket.userId,
        username: socket.username,
        currentRoom: socket.currentRoom,
        authenticatedAt: socket.authenticatedAt
      }
    });

    if (socket.userId) {
      const username = socket.username || 'Usuario';
      
      this.log('INFO', 'DISCONNECT_AUTHENTICATED_USER', socket.id, socket.userId, {
        username: username,
        connectedUsersBeforeRemoval: this.connectedUsers.size
      });
      
      // Remover usuário da lista de conectados
      this.connectedUsers.delete(socket.userId);

      this.log('SUCCESS', 'DISCONNECT_REMOVED_FROM_CONNECTED_USERS', socket.id, socket.userId, {
        username: username,
        connectedUsersAfterRemoval: this.connectedUsers.size
      });

      // Contar salas que o usuário estava conectado
      const userRooms = [];
      for (const [roomId, userSet] of this.roomUsers.entries()) {
        if (userSet.has(socket.userId)) {
          userRooms.push(roomId);
        }
      }

      this.log('INFO', 'DISCONNECT_USER_ROOMS_FOUND', socket.id, socket.userId, {
        totalRooms: userRooms.length,
        rooms: userRooms
      });

      // Remover de todas as salas e notificar
      for (const [roomId, userSet] of this.roomUsers.entries()) {
        if (userSet.has(socket.userId)) {
          this.log('INFO', 'DISCONNECT_LEAVING_ROOM', socket.id, socket.userId, {
            roomId: roomId,
            roomType: roomId.startsWith('historia_') ? 'historia' : 'generic',
            usersInRoomBeforeLeaving: userSet.size
          });

          // Remover da sessão se for uma história
          if (roomId.startsWith('historia_')) {
            this.log('INFO', 'DISCONNECT_REMOVING_FROM_HISTORIA_SESSAO', socket.id, socket.userId, {
              roomId: roomId
            });
            try {
              await this.removerJogadorSessao(roomId, socket.userId);
              this.log('SUCCESS', 'DISCONNECT_REMOVED_FROM_HISTORIA_SESSAO', socket.id, socket.userId, {
                roomId: roomId
              });
            } catch (error) {
              this.log('ERROR', 'DISCONNECT_ERROR_REMOVING_FROM_SESSAO', socket.id, socket.userId, {
                roomId: roomId,
                error: error.message
              });
            }
          }
          
          // Remover da lista local
          userSet.delete(socket.userId);
          const shouldDeleteRoom = userSet.size === 0;
          
          if (shouldDeleteRoom) {
            this.roomUsers.delete(roomId);
            this.log('INFO', 'DISCONNECT_DELETED_EMPTY_ROOM', socket.id, socket.userId, {
              roomId: roomId
            });
          }

          // Notificar outros usuários na sala sobre a desconexão
          const userLeftEvent = {
            userId: socket.userId,
            username,
            roomId,
            timestamp: Date.now(),
            reason: 'disconnect'
          };

          this.log('INFO', 'DISCONNECT_NOTIFYING_ROOM_USERS', socket.id, socket.userId, {
            roomId: roomId,
            eventData: userLeftEvent,
            remainingUsersInRoom: userSet.size
          });

          socket.to(roomId).emit('user_left', userLeftEvent);
        }
      }

      // Remover do Redis
      if (this.redis) {
        this.log('INFO', 'DISCONNECT_REDIS_CLEANUP_START', socket.id, socket.userId, {
          redisKey: `user:${socket.userId}`
        });

        try {
          await this.redis.del(`user:${socket.userId}`);
          this.log('SUCCESS', 'DISCONNECT_REDIS_CLEANED', socket.id, socket.userId, {
            redisKey: `user:${socket.userId}`
          });
        } catch (error) {
          this.log('ERROR', 'DISCONNECT_REDIS_CLEANUP_ERROR', socket.id, socket.userId, {
            redisKey: `user:${socket.userId}`,
            error: error.message
          });
        }
      } else {
        this.log('WARN', 'DISCONNECT_REDIS_UNAVAILABLE', socket.id, socket.userId);
      }

      const processingTime = Date.now() - startTime;
      this.log('SUCCESS', 'DISCONNECT_COMPLETED', socket.id, socket.userId, {
        username: username,
        roomsLeft: userRooms.length,
        processingTimeMs: processingTime,
        connectionDurationMs: connectionDuration,
        finalStats: {
          connectedUsers: this.connectedUsers.size,
          activeRooms: this.roomUsers.size
        }
      });
    } else {
      const processingTime = Date.now() - startTime;
      this.log('INFO', 'DISCONNECT_UNAUTHENTICATED_USER', socket.id, null, {
        reason: reason,
        connectionDurationMs: connectionDuration,
        processingTimeMs: processingTime
      });
    }
  }

  /**
   * Enviar mensagem para sala específica
   */
  sendToRoom(roomId, event, data) {
    if (this.io) {
      this.io.to(roomId).emit(event, data);
    }
  }

  /**
   * Enviar mensagem para usuário específico
   */
  sendToUser(userId, event, data) {
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  /**
   * Obter estatísticas do servidor
   */
  getStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      activeRooms: this.roomUsers.size,
      totalRooms: this.io ? this.io.sockets.adapter.rooms.size : 0
    };
  }

  /**
   * Obter ou criar sessão de uma história
   */
  async obterSessaoHistoria(salaId) {
    try {
      // Garantir que o gerenciador de sessões está inicializado
      await this.gerenciadorSessoes.initialize();
      
      // Verificar se é uma sala de história
      if (!salaId.startsWith('historia_')) {
        return null;
      }

      // Extrair historiaId do roomId (ex: historia_67 → 67)
      const historiaId = parseInt(salaId.replace('historia_', ''));
      
      if (isNaN(historiaId)) {
        console.error('❌ ID de história inválido:', salaId);
        return null;
      }

      // Verificar se já existe uma sessão no Redis
      let sessao = await this.gerenciadorSessoes.obterSessao(salaId);
      
      if (sessao) {
        console.log(`📋 Sessão existente encontrada para história ${historiaId}`);
        return sessao;
      }

      // Se não existe, buscar dados da história no banco e criar sessão
      console.log(`🔍 Criando nova sessão para história ${historiaId}`);
      
      // Importar modelo do banco
      const { default: db } = await import('../Model/index.js');
      
      // Buscar dados da história
      const historia = await db.Historia.findById(historiaId);
      
      if (!historia) {
        console.error(`❌ História ${historiaId} não encontrada no banco`);
        return null;
      }

      // Buscar dados do usuário dono
      let donoNome = 'Dono da História';
      if (historia.id_usuario) {
        try {
          const usuario = await db.Usuario.findById(historia.id_usuario);
          if (usuario) {
            donoNome = usuario.nome;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao buscar dados do usuário dono:', error.message);
        }
      }

      // Criar dados da sessão
      const dadosSessao = {
        historiaId: historia.id,
        historiaNome: historia.nome,
        historiaTemas: historia.temas || [],
        historiaPrologo: historia.prologo || '',
        donoId: historia.id_usuario ? String(historia.id_usuario) : null,
        donoNome: donoNome,
        maxJogadores: historia.maximo_de_participantes || 5,
        status: 'aberta', // Status inicial
        jogadoresConectados: [], // Lista vazia inicialmente
        estadoJogo: {
          fase: 'preparacao',
          cenaAtual: 'Aguardando início',
          mensagemMestre: `Bem-vindos à história "${historia.nome}"!`,
          npcs: [],
          ambiente: 'Sala de espera'
        },
        mensagens: [],
        acoes: []
      };

      // Criar sessão no Redis
      sessao = await this.gerenciadorSessoes.criarSessao(salaId, dadosSessao);
      
      console.log(`✅ Nova sessão criada para história "${historia.nome}" (ID: ${historiaId})`);
      
      return sessao;
      
    } catch (error) {
      console.error('❌ Erro ao obter/criar sessão da história:', error.message);
      return null;
    }
  }

  /**
   * Adicionar jogador à sessão
   */
  async adicionarJogadorSessao(salaId, dadosJogador) {
    try {
      // Garantir que o gerenciador de sessões está inicializado
      await this.gerenciadorSessoes.initialize();
      
      const sessao = await this.gerenciadorSessoes.obterSessao(salaId);
      
      if (sessao) {
        const userId = String(dadosJogador.userId);
        
        // Verificar se sessão já foi iniciada
        if (sessao.status === 'iniciada') {
          // APÓS INICIAR: jogadoresConectados é array de IDs
          const jogadoresConectados = Array.isArray(sessao.jogadoresConectados) ? sessao.jogadoresConectados : [];
          
          if (!jogadoresConectados.includes(userId)) {
            jogadoresConectados.push(userId);
            sessao.jogadoresConectados = jogadoresConectados;
            sessao.atualizadaEm = new Date().toISOString();
            
            await this.gerenciadorSessoes.atualizarSessao(salaId, sessao);
            console.log(`👤 Jogador ${userId} (${dadosJogador.username}) reconectado à sessão iniciada ${salaId}`);
          } else {
            console.log(`🔄 Jogador ${userId} já está em jogadoresConectados`);
          }
        } else {
          // ANTES DE INICIAR: jogadoresConectados é array de objetos
          const jogadoresAtuais = sessao.jogadoresConectados || [];
          const jaExiste = jogadoresAtuais.find(j => String(j.userId) === userId);
          
          if (!jaExiste) {
            // Adicionar novo jogador com dados completos
            jogadoresAtuais.push(dadosJogador);
            sessao.jogadoresConectados = jogadoresAtuais;
            sessao.atualizadaEm = new Date().toISOString();
            
            await this.gerenciadorSessoes.atualizarSessao(salaId, sessao);
            console.log(`👤 Jogador ${dadosJogador.username} adicionado à sessão ${salaId}`);
          } else {
            // Atualizar dados do jogador existente (reconexão)
            Object.assign(jaExiste, dadosJogador);
            sessao.atualizadaEm = new Date().toISOString();
            
            await this.gerenciadorSessoes.atualizarSessao(salaId, sessao);
            console.log(`🔄 Dados do jogador ${dadosJogador.username} atualizados na sessão ${salaId}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar jogador à sessão:', error);
    }
  }

  /**
   * Remover jogador da sessão
   */
  async removerJogadorSessao(salaId, userId) {
    try {
      // Garantir que o gerenciador de sessões está inicializado
      await this.gerenciadorSessoes.initialize();
      
      const sessao = await this.gerenciadorSessoes.obterSessao(salaId);
      
      if (sessao && sessao.jogadoresConectados) {
        const userIdString = String(userId);
        
        // Verificar se sessão já foi iniciada
        if (sessao.status === 'iniciada') {
          // APÓS INICIAR: jogadoresConectados é array de IDs
          const jogadoresConectados = Array.isArray(sessao.jogadoresConectados) ? sessao.jogadoresConectados : [];
          sessao.jogadoresConectados = jogadoresConectados.filter(id => String(id) !== userIdString);
          sessao.atualizadaEm = new Date().toISOString();
          
          await this.gerenciadorSessoes.atualizarSessao(salaId, sessao);
          console.log(`👤 Jogador ${userId} desconectado da sessão iniciada ${salaId}`);
        } else {
          // ANTES DE INICIAR: jogadoresConectados é array de objetos
          const jogadoresAtuais = sessao.jogadoresConectados.filter(j => String(j.userId) !== userIdString);
          sessao.jogadoresConectados = jogadoresAtuais;
          sessao.atualizadaEm = new Date().toISOString();
          
          await this.gerenciadorSessoes.atualizarSessao(salaId, sessao);
          console.log(`👤 Jogador ${userId} removido da sessão ${salaId}`);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao remover jogador da sessão:', error);
    }
  }

  /**
   * Notificar início da aventura para uma sala
   */
  notificarInicioAventura(salaId, dados) {
    if (this.io) {
      this.io.to(salaId).emit('aventura_iniciada', {
        ...dados,
        timestamp: Date.now()
      });
      console.log(`🎮 Notificação de início enviada para sala ${salaId}`);
    }
  }

  /**
   * Notificar mudança de fase para toda sala
   */
  notificarMudancaFase(salaId, fase, dadosAdicionais = {}) {
    if (this.io) {
      this.io.to(salaId).emit('fase_atualizada', {
        fase,
        ...dadosAdicionais,
        timestamp: Date.now()
      });
      console.log(`🎮 Fase atualizada para "${fase}" na sala ${salaId}`);
    }
  }

  // ===== FUNÇÕES AUXILIARES PARA SISTEMA DE TURNOS E RODADAS =====

  /**
   * Iniciar primeiro turno após definir ordem dos jogadores
   */
  async iniciarPrimeiroTurno(roomId) {
    try {
      const sessao = await this.obterSessaoHistoria(roomId);
      if (!sessao) {
        console.error(`❌ Sessão não encontrada ao iniciar primeiro turno: ${roomId}`);
        return;
      }

      const estadoJogo = sessao.estadoJogo || {};
      const ordemJogadores = estadoJogo.ordemJogadores || [];
      
      if (ordemJogadores.length === 0) {
        console.error(`❌ Nenhum jogador na ordem para iniciar turno: ${roomId}`);
        return;
      }

      const primeiroJogador = ordemJogadores[0];
      
      console.log(`🎯 Iniciando primeiro turno para ${primeiroJogador.username} na sala ${roomId}`);

      // Notificar mudança de fase
      this.notificarMudancaFase(roomId, 'rodada_em_andamento', {
        rodadaAtual: estadoJogo.rodadaAtual || 1
      });

      // Emitir evento de início de turno
      this.io.to(roomId).emit('turno_alterado', {
        rodadaAtual: estadoJogo.rodadaAtual || 1,
        turnoAtual: 0,
        jogadorAtual: primeiroJogador,
        ordemCompleta: ordemJogadores,
        timestamp: Date.now()
      });

      // Opcional: Mestre pode falar algo direto para o primeiro jogador
      console.log(`✅ Primeiro turno iniciado com ${primeiroJogador.username}`);
    } catch (error) {
      console.error(`❌ Erro ao iniciar primeiro turno:`, error);
    }
  }

  /**
   * Avançar para o próximo turno
   */
  async avancarProximoTurno(roomId) {
    try {
      const sessao = await this.obterSessaoHistoria(roomId);
      if (!sessao) {
        console.error(`❌ Sessão não encontrada ao avançar turno: ${roomId}`);
        return;
      }

      const estadoJogo = sessao.estadoJogo || {};
      const turnoAtual = estadoJogo.turnoAtual || 0;
      const ordemJogadores = estadoJogo.ordemJogadores || [];

      // Resetar flag de turno iniciado ao avançar
      estadoJogo.turnoIniciado = false;

      // Avançar turno no Redis
      await this.gerenciadorSessoes.avancarTurno(roomId);

      const proximoTurno = turnoAtual + 1;

      // Verificar se acabou a rodada
      if (proximoTurno >= ordemJogadores.length) {
        console.log(`🏁 Rodada finalizada na sala ${roomId}`);
        await this.finalizarRodada(roomId);
        return;
      }

      const proximoJogador = ordemJogadores[proximoTurno];
      
      console.log(`⏭️ Avançando para turno ${proximoTurno} - ${proximoJogador.username} na sala ${roomId}`);

      // Emitir evento de mudança de turno
      this.io.to(roomId).emit('turno_alterado', {
        rodadaAtual: estadoJogo.rodadaAtual || 1,
        turnoAtual: proximoTurno,
        jogadorAtual: proximoJogador,
        ordemCompleta: ordemJogadores,
        timestamp: Date.now()
      });

      console.log(`✅ Turno avançado para ${proximoJogador.username}`);
    } catch (error) {
      console.error(`❌ Erro ao avançar turno:`, error);
    }
  }

  /**
   * Finalizar rodada atual e preparar próxima
   */
  async finalizarRodada(roomId) {
    try {
      const sessao = await this.obterSessaoHistoria(roomId);
      if (!sessao) {
        console.error(`❌ Sessão não encontrada ao finalizar rodada: ${roomId}`);
        return;
      }

      const estadoJogo = sessao.estadoJogo || {};
      const rodadaAtual = estadoJogo.rodadaAtual || 1;

      console.log(`🏁 Finalizando rodada ${rodadaAtual} na sala ${roomId}`);

      // Atualizar fase para entre rodadas
      await this.gerenciadorSessoes.atualizarFaseJogo(roomId, 'entre_rodadas');

      // Notificar mudança de fase
      this.notificarMudancaFase(roomId, 'entre_rodadas', {
        rodadaFinalizada: rodadaAtual
      });

      // Emitir evento de rodada finalizada
      this.io.to(roomId).emit('rodada_finalizada', {
        rodada: rodadaAtual,
        timestamp: Date.now()
      });

      // Aguardar 5 segundos antes de iniciar nova rodada
      setTimeout(async () => {
        await this.iniciarNovaRodada(roomId);
      }, 5000);

      console.log(`✅ Rodada ${rodadaAtual} finalizada, próxima rodada em 5s`);
    } catch (error) {
      console.error(`❌ Erro ao finalizar rodada:`, error);
    }
  }

  /**
   * Iniciar nova rodada
   */
  async iniciarNovaRodada(roomId) {
    try {
      const sessao = await this.obterSessaoHistoria(roomId);
      if (!sessao) {
        console.error(`❌ Sessão não encontrada ao iniciar nova rodada: ${roomId}`);
        return;
      }

      // Incrementar rodada e resetar turno
      await this.gerenciadorSessoes.iniciarNovaRodada(roomId);

      const sessaoAtualizada = await this.obterSessaoHistoria(roomId);
      const estadoJogo = sessaoAtualizada.estadoJogo || {};
      const novaRodada = estadoJogo.rodadaAtual || 2;
      const ordemJogadores = estadoJogo.ordemJogadores || [];

      console.log(`🔄 Iniciando rodada ${novaRodada} na sala ${roomId}`);

      // Notificar mudança de fase
      this.notificarMudancaFase(roomId, 'rodada_em_andamento', {
        rodadaAtual: novaRodada
      });

      // Emitir evento de nova rodada iniciada
      this.io.to(roomId).emit('nova_rodada_iniciada', {
        rodada: novaRodada,
        primeiroJogador: ordemJogadores[0],
        timestamp: Date.now()
      });

      // Iniciar primeiro turno da nova rodada
      if (ordemJogadores.length > 0) {
        const primeiroJogador = ordemJogadores[0];
        
        this.io.to(roomId).emit('turno_alterado', {
          rodadaAtual: novaRodada,
          turnoAtual: 0,
          jogadorAtual: primeiroJogador,
          ordemCompleta: ordemJogadores,
          timestamp: Date.now()
        });
      }

      console.log(`✅ Rodada ${novaRodada} iniciada`);
    } catch (error) {
      console.error(`❌ Erro ao iniciar nova rodada:`, error);
    }
  }

  /**
   * Fechar conexões
   */
  async close() {
    if (this.redis) {
      await this.redis.quit();
    }
    if (this.io) {
      this.io.close();
    }
  }
}

export default new SocketManager(); 