import { Server } from 'socket.io';
import { createClient } from 'redis';
import gerenciadorSessoes from '../redis/sessoes.js';
import criarMestreRPG from '../agents/Mestre/index.js';
import { buscarTemasCompletos, extrairNomesTemas } from '../helpers/temasHelper.js';
import { formatarPersonagensParaMestre } from '../helpers/personagensHelper.js';
import db from '../Model/index.js';
import {
  calcularStatsEfetivos,
  calcularHP,
  calcularEsquiva,
  calcularArmadura,
  verificarEsquiva,
  verificarAcerto,
  calcularDano,
  aplicarResistencias,
  rolarDado,
  selecionarHabilidadeMonstro,
  gerarInstanciasCombate,
  verificarFimCombate,
  formatarContextoCombate
} from '../helpers/combateHelper.js';
import { COMBAT_EVENTS } from './events/eventTypes.js';
import sessaoSnapshotService from '../services/sessaoSnapshot.js';
import { verificarLevelUp, xpParaNivel } from '../helpers/evolucaoHelper.js';
import { rolarLootCombate } from '../helpers/lootHelper.js';
import { persistirEstadoClone } from '../helpers/acoesProcessor.js';

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
    this.mestresCache = new Map(); // salaId -> { mestre, criadoEm, ultimoUso, rodadaInicial }
    this._cacheCleaner = null; // interval reference for cleanup
    this._disconnectTimers = new Map(); // userId -> timeout for grace period
    this._snapshotCounters = new Map(); // roomId -> mensagens count since last snapshot
    this._roomLocks = new Map(); // roomId -> Promise (mutex por sala)
  }

  /**
   * Mutex por sala - garante que apenas uma operação por vez modifique a sessão
   * Previne race conditions quando múltiplos jogadores agem simultaneamente
   */
  async withRoomLock(roomId, fn) {
    // Esperar lock anterior terminar (max 10s para evitar deadlock)
    const maxWait = Date.now() + 10000;
    while (this._roomLocks.has(roomId)) {
      if (Date.now() > maxWait) {
        console.warn(`⚠️ withRoomLock: timeout esperando lock da sala ${roomId}, forçando liberação`);
        this._roomLocks.delete(roomId);
        break;
      }
      await this._roomLocks.get(roomId).catch(() => {});
    }
    // Criar novo lock
    let resolve;
    const lockPromise = new Promise(r => { resolve = r; });
    this._roomLocks.set(roomId, lockPromise);
    try {
      return await fn();
    } finally {
      this._roomLocks.delete(roomId);
      resolve();
    }
  }

  /**
   * Salvar snapshot periodico (fire-and-forget, nao-bloqueante)
   * Chamado a cada 10 mensagens, mudanca de rodada, fim de combate, ou fim de sessao
   * @param {string} roomId - ID da sala
   * @param {Object} sessao - Sessao Redis atual
   * @param {boolean} force - Forcar snapshot independente do contador
   */
  _tentarSnapshot(roomId, sessao, force = false) {
    if (!force) {
      const count = (this._snapshotCounters.get(roomId) || 0) + 1;
      this._snapshotCounters.set(roomId, count);
      if (count < 10) return; // Salvar a cada 10 mensagens
    }
    this._snapshotCounters.set(roomId, 0);
    sessaoSnapshotService.salvarSnapshot(roomId, sessao).catch(err =>
      console.error(`❌ Erro ao salvar snapshot para ${roomId}:`, err.message)
    );
  }

  /**
   * Inicializar o servidor WebSocket
   * @param {Object} server - Servidor HTTP
   */
  async initialize(server) {
    console.log('🔌 Inicializando WebSocket...');
    
    // Criar servidor Socket.IO
    const isProduction = process.env.NODE_ENV === 'production';
    this.io = new Server(server, {
      cors: {
        origin: isProduction ? (process.env.FRONTEND_URL || false) : "*",
        methods: ["GET", "POST"],
        credentials: isProduction
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

    // Timer para limpar cache de mestres a cada 10 minutos (store reference for cleanup)
    this._cacheCleaner = setInterval(() => {
      this.limparCacheMestres();
    }, 600000);

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

      // Evento de solicitar rolagem de dados
      socket.on('solicitar_dados', async (data) => {
        this.log('INFO', 'SOLICITAR_DADOS_RECEIVED', socket.id, socket.userId, {
          roomId: data?.roomId || socket.currentRoom,
          motivo: data?.motivo,
          tipoTeste: data?.tipoTeste
        });
        try {
          await this.handleSolicitarDados(socket, data);
        } catch (error) {
          this.log('ERROR', 'SOLICITAR_DADOS_FAILED', socket.id, socket.userId, {
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

      // ===== VALIDAÇÃO 3: userId deve coincidir com socket autenticado =====
      if (String(rawUserId) !== String(socket.userId)) {
        this.log('ERROR', 'JOIN_ROOM_USER_MISMATCH', socket.id, socket.userId, {
          authenticatedUserId: socket.userId,
          requestedUserId: rawUserId
        });
        socket.emit('error', {
          message: 'userId não corresponde ao usuário autenticado.',
          code: 'USER_MISMATCH'
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

      // ✅ Declarar sessao fora do bloco para uso posterior
      let sessao = null;
      
      // Verificar se é uma sala de história
      if (roomId.startsWith('historia_')) {
        this.log('INFO', 'JOIN_ROOM_HISTORIA_TYPE', socket.id, userId, {
          roomId: roomId,
          extractedHistoriaId: historiaId
        });

        // Obter ou criar sessão da história (isso também valida se a história existe)
        sessao = await this.obterSessaoHistoria(roomId);
        
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

        // ✅ VALIDAR ENTRADA BASEADO EM statusJogo
        if (sessao.statusJogo === 'iniciado') {
          // Verificar se o usuário está no mapa de jogadores (participou do início)
          const estaNoMapaJogadores = sessao.jogadores && sessao.jogadores[String(userId)];
          
          this.log('INFO', 'JOIN_ROOM_AVENTURA_INICIADA_CHECK', socket.id, userId, {
            sessaoStatus: sessao.status,
            statusJogo: sessao.statusJogo,
            userId: userId,
            userIdTipo: typeof userId,
            estaNoMapaJogadores: !!estaNoMapaJogadores,
            mapaJogadores: sessao.jogadores ? Object.keys(sessao.jogadores) : [],
            jogadoresConectados: sessao.jogadoresConectados || []
          });
          
          if (!estaNoMapaJogadores) {
            this.log('ERROR', 'JOIN_ROOM_JOGO_INICIADO_BLOCKED', socket.id, userId, {
              roomId: roomId,
              sessaoStatus: sessao.status,
              statusJogo: sessao.statusJogo,
              motivo: 'O jogo já iniciou - usuário não está no mapa de jogadores'
            });
            socket.emit('error', { 
              message: 'O jogo já foi iniciado. Não é possível entrar agora.',
              code: 'JOGO_INICIADO'
            });
            return;
          } else {
            console.log('✅ Permitindo reconexão de jogador existente no jogo iniciado:', {
              userId,
              username: socket.username,
              personagem: estaNoMapaJogadores.personagemNome
            });
            this.log('INFO', 'JOIN_ROOM_RECONNECTION_ALLOWED', socket.id, userId, {
              username: username,
              sessaoStatus: sessao.status,
              statusJogo: sessao.statusJogo,
              personagem: estaNoMapaJogadores.personagemNome
            });
          }
        }
        
        // ✅ VALIDAÇÃO EXTRA: Bloquear entrada se status antigo 'iniciada' mas sem statusJogo
        if (sessao.status === 'iniciada' && !sessao.statusJogo) {
          // Sessão antiga sem statusJogo - tratar como iniciado
          const estaNoMapaJogadores = sessao.jogadores && sessao.jogadores[String(userId)];
          
          if (!estaNoMapaJogadores) {
            this.log('WARN', 'JOIN_ROOM_SESSAO_ANTIGA_BLOCKED', socket.id, userId, {
              roomId: roomId,
              motivo: 'Sessão antiga (sem statusJogo) mas status=iniciada'
            });
            socket.emit('error', { 
              message: 'A aventura já foi iniciada. Não é possível entrar agora.',
              code: 'AVENTURA_INICIADA'
            });
            return;
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
        // ✅ USAR SESSÃO JÁ OBTIDA ao invés de buscar novamente (prevenir loop)
        const sessaoParaDeteccao = sessao; // Reusar sessão da linha 563
        if (sessaoParaDeteccao) {
          isOwner = sessaoParaDeteccao.donoId === userId;
          isGuest = !isOwner && !wasAlreadyInRoom;
          
          // ✅ Log do status atual para debugging
          console.log(`📊 Status da sala: ${sessaoParaDeteccao.statusJogo || 'null'} | Status sessão: ${sessaoParaDeteccao.status}`);
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

      // Validar userId corresponde ao autenticado
      if (String(rawUserId) !== String(socket.userId)) {
        this.log('ERROR', 'CHAT_USER_MISMATCH', socket.id, socket.userId, {
          authenticatedUserId: socket.userId,
          requestedUserId: rawUserId
        });
        socket.emit('error', { message: 'userId não corresponde ao usuário autenticado.', code: 'USER_MISMATCH' });
        return;
      }

      // Validar tamanho da mensagem
      const MAX_MESSAGE_LENGTH = 5000;
      if (rawMessage && String(rawMessage).length > MAX_MESSAGE_LENGTH) {
        socket.emit('erro_mensagem', { message: `Mensagem excede o limite de ${MAX_MESSAGE_LENGTH} caracteres` });
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

      // Validar userId corresponde ao autenticado
      if (String(rawUserId) !== String(socket.userId)) {
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
    const startTime = Date.now();
    
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

      const sessao = await this.obterSessaoHistoria(roomId);
      if (!sessao) {
        return socket.emit('error', { message: 'Sessão não encontrada' });
      }

      const rollData = {
        id: Date.now().toString(),
        userId,
        username,
        dice,
        result,
        description,
        roomId,
        timestamp: Date.now()
      };

      // 1. Salvar rolagem na sessão unificada
      if (roomId.startsWith('historia_')) {
        await this.gerenciadorSessoes.adicionarRolagem(roomId, rollData);
      }

      // ✅ 1.5. SALVAR MENSAGEM DE DADO NO REDIS
      const mensagemDado = {
        tipo: 'dado',
        userId,
        username,
        dice,
        result,
        description,
        timestamp: Date.now()
      };

      if (!sessao.mensagens) {
        sessao.mensagens = [];
      }
      sessao.mensagens.push(mensagemDado);
      await this.gerenciadorSessoes.atualizarSessao(roomId, sessao);

      console.log(`💬 Mensagem de dado salva no Redis: ${username} rolou ${dice} = ${result}`);

      // 3. ✅ VERIFICAR SE MESTRE SOLICITOU DADOS (só processar se solicitou)
      const estadoJogo = sessao.estadoJogo || {};
      const testeInfo = estadoJogo.testeInfo || {};

      // Verificar se dados foram solicitados E se é o jogador correto
      let dadosSolicitados = estadoJogo.dadosSolicitados || false;
      if (dadosSolicitados && testeInfo.jogadorAlvo && testeInfo.jogadorAlvo !== userId) {
        console.log(`⚠️ Jogador ${userId} rolou, mas teste é para ${testeInfo.jogadorAlvo}. Tratando como rolagem comum.`);
        dadosSolicitados = false; // Tratar como rolagem normal para este jogador
      }

      // 2. Broadcast do resultado do dado para todos
      // Inclui flag dadosSolicitados para frontend saber se resultado_teste vai seguir
      this.io.to(roomId).emit('dice_roll', { ...rollData, dadosSolicitados });

      console.log(`🎲 ${username} rolou ${dice}: ${result} (sala ${roomId})`);

      if (dadosSolicitados) {
        console.log('✅ Dados foram solicitados pelo Mestre, processando com IA...');

        // RESOLVER TESTE MECANICAMENTE + ENVIAR PARA IA NARRAR
        try {
          const jogadorInfo = sessao.jogadores?.[userId];
          const personagemNome = jogadorInfo?.personagemNome || username;

          // Buscar personagem completo para aplicar modificadores
          const personagemId = jogadorInfo?.personagemId;
          const personagemCompleto = personagemId
            ? sessao.personagensCompletos?.[String(personagemId)]
            : null;

          // Resolver teste mecanicamente
          let resultadoTeste = null;
          let descricaoParaIA = `Rolou ${dice} e obteve ${result}${description ? ` para ${description}` : ''}`;

          try {
            const { resolverTeste } = await import('../helpers/testeHelper.js');
            resultadoTeste = resolverTeste(
              personagemCompleto,
              testeInfo.teste || description,
              parseInt(result),
              testeInfo.dificuldade
            );

            // Construir descrição enriquecida para IA
            if (resultadoTeste.atributo) {
              descricaoParaIA = `Rolou ${dice} e obteve ${resultadoTeste.rolagemBruta} + ${resultadoTeste.totalModificador} (${resultadoTeste.atributoNome}) = ${resultadoTeste.total} vs DC ${resultadoTeste.dc} (${resultadoTeste.dificuldadeNome}) → ${resultadoTeste.descricaoResultado}`;
            } else {
              descricaoParaIA = `Rolou ${dice} e obteve ${resultadoTeste.rolagemBruta} (teste de Sorte) vs DC ${resultadoTeste.dc} → ${resultadoTeste.descricaoResultado}`;
            }

            console.log(`🎯 Teste resolvido: ${descricaoParaIA}`);

            // Emitir resultado enriquecido do dado (substitui o dice_roll básico anterior)
            this.io.to(roomId).emit('resultado_teste', {
              ...resultadoTeste,
              username,
              personagemNome,
              dice,
              timestamp: Date.now()
            });
          } catch (testeError) {
            console.warn('⚠️ Erro ao resolver teste mecanicamente, usando resultado bruto:', testeError.message);
            // Fallback: emitir resultado_teste com dados básicos para frontend não ficar sem mensagem
            this.io.to(roomId).emit('resultado_teste', {
              rolagemBruta: parseInt(result) || 1,
              total: parseInt(result) || 1,
              totalModificador: 0,
              atributoNome: null,
              dc: null,
              sucesso: null,
              descricaoResultado: null,
              username,
              personagemNome,
              dice,
              timestamp: Date.now()
            });
          }

          const mestre = await this.obterMestre(roomId, sessao.historiaTemas || [], sessao);

          const interpretacao = await mestre.narrarAcao({
            jogador: username,
            personagem: personagemNome,
            acao: descricaoParaIA,
            chatHistory: sessao.mensagens || []
          });

          // Salvar interpretação do Mestre
          if (!sessao.mensagens) {
            sessao.mensagens = [];
          }

          sessao.mensagens.push({
            tipo: 'mestre',
            userId: 'mestre',
            username: 'Mestre',
            mensagem: interpretacao.narracao,
            timestamp: Date.now()
          });

          // ✅ Limpar flag de dados solicitados + testeInfo
          estadoJogo.dadosSolicitados = false;
          estadoJogo.testeInfo = null;
          sessao.estadoJogo = estadoJogo;

          await this.gerenciadorSessoes.atualizarSessao(roomId, sessao);

          // Enviar interpretação do Mestre
          this.io.to(roomId).emit('mensagem_mestre', {
            id: (Date.now() + 1).toString(),
            userId: 'mestre',
            username: 'Mestre',
            message: interpretacao.narracao,
            tipo: 'mestre',
            timestamp: Date.now()
          });

          console.log(`✅ Resultado do dado processado pelo Mestre`);
        } catch (errorIA) {
          console.error('❌ Erro ao processar dado com Mestre IA:', errorIA);

          // ✅ FALLBACK: Mensagem simples sem IA
          const jogadorInfo = sessao.jogadores?.[userId];
          const personagemNome = jogadorInfo?.personagemNome || username;

          const mensagemFallback = {
            tipo: 'mestre',
            userId: 'mestre',
            username: 'Mestre',
            mensagem: `${personagemNome} rolou ${dice} e obteve **${result}**${description ? ` para ${description}` : ''}. Continue a aventura!`,
            timestamp: Date.now()
          };

          if (!sessao.mensagens) {
            sessao.mensagens = [];
          }
          sessao.mensagens.push(mensagemFallback);

          // ✅ Limpar flag mesmo com erro
          estadoJogo.dadosSolicitados = false;
          estadoJogo.testeInfo = null;
          sessao.estadoJogo = estadoJogo;

          await this.gerenciadorSessoes.atualizarSessao(roomId, sessao);

          this.io.to(roomId).emit('mensagem_mestre', {
            id: (Date.now() + 1).toString(),
            userId: 'mestre',
            username: 'Mestre',
            message: mensagemFallback.mensagem,
            tipo: 'mestre',
            timestamp: Date.now()
          });

          console.log(`✅ Resultado do dado processado com mensagem fallback (IA falhou)`);
        }
      } else {
        console.log('ℹ️ Dados rolados sem solicitação do Mestre - apenas broadcast do resultado');
        // Apenas salvar mensagem de dado (sem processar com IA)
        // Mensagem já foi salva acima (linha ~1220)
      }

    } catch (error) {
      console.error('❌ Erro ao processar dice_roll:', error);
      socket.emit('error', { message: 'Erro ao processar rolagem' });

      // Limpar flags para não travar o sistema
      try {
        const roomId = String(data?.roomId || '');
        if (roomId) {
          const sessao = await this.gerenciadorSessoes.obterSessao(roomId);
          if (sessao?.estadoJogo?.dadosSolicitados) {
            sessao.estadoJogo.dadosSolicitados = false;
            sessao.estadoJogo.testeInfo = null;
            await this.gerenciadorSessoes.atualizarSessao(roomId, sessao);
            console.log('🔄 Flags de teste limpas no outer catch');
          }
        }
      } catch (cleanupErr) {
        console.warn('⚠️ Erro ao limpar flags no outer catch:', cleanupErr.message);
      }
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

      // ✅ SALVAR MENSAGEM DE DADO ROLADO NO REDIS
      const sessaoParaDado = await this.obterSessaoHistoria(roomId);
      const mensagemDado = {
        tipo: 'dado',
        userId: resultadoData.userId,
        username: resultadoData.username,
        personagemNome: resultadoData.personagemNome,
        mensagem: `🎲 Rolou ${resultadoData.valor}`,
        valorDado: resultadoData.valor,
        timestamp: Date.now()
      };
      
      if (!sessaoParaDado.mensagens) {
        sessaoParaDado.mensagens = [];
      }
      sessaoParaDado.mensagens.push(mensagemDado);
      await this.gerenciadorSessoes.atualizarSessao(roomId, sessaoParaDado);
      
      console.log(`💬 Mensagem de dado salva no Redis: ${resultadoData.username} rolou ${resultadoData.valor}`);

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

        // ✅ SALVAR MENSAGEM DE ORDEM DEFINIDA NO REDIS
        const mensagemOrdem = {
          tipo: 'sistema',
          userId: 'sistema',
          username: 'Sistema',
          mensagem: `Ordem de jogadores definida: ${ordemJogadores.map(j => j.username).join(', ')}`,
          timestamp: Date.now()
        };
        
        if (!sessaoComOrdem.mensagens) {
          sessaoComOrdem.mensagens = [];
        }
        sessaoComOrdem.mensagens.push(mensagemOrdem);
        await this.gerenciadorSessoes.atualizarSessao(roomId, sessaoComOrdem);
        
        console.log(`💬 Mensagem de ordem definida salva no Redis`);

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

      // Validar tamanho da mensagem
      const MAX_MESSAGE_LENGTH = 5000;
      if (rawMensagem && String(rawMensagem).length > MAX_MESSAGE_LENGTH) {
        socket.emit('erro_mensagem', { message: `Mensagem excede o limite de ${MAX_MESSAGE_LENGTH} caracteres` });
        return;
      }

      // Parsing dos dados
      const roomId = String(rawRoomId);
      const userId = String(rawUserId);
      const username = rawUsername ? String(rawUsername) : 'Jogador';
      const mensagem = String(rawMensagem);
      const personagem = rawPersonagem;

      // ✅ MUTEX: Garantir que apenas uma operação por vez na sala
      return await this.withRoomLock(roomId, async () => {

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

      // ✅ GUARD: Rejeitar mensagem se dados já foram solicitados (evita solicitação duplicada)
      const estadoJogoGuard = sessao.estadoJogo || {};
      if (estadoJogoGuard.dadosSolicitados) {
        this.log('WARN', 'MENSAGEM_PARA_MESTRE_DADOS_PENDENTES', socket.id, userId, {
          roomId,
          mensagem: mensagem.substring(0, 50)
        });
        socket.emit('erro_mensagem', {
          message: 'Aguarde a rolagem de dados antes de enviar uma nova mensagem.'
        });
        return;
      }

      this.log('INFO', 'MENSAGEM_PARA_MESTRE_SESSAO_FOUND', socket.id, userId, {
        sessaoStatus: sessao.status,
        historiaNome: sessao.historiaNome,
        totalMensagens: sessao.mensagens?.length || 0
      });

      // 2. VERIFICAR SISTEMA DE TURNOS
      const estadoJogo = sessao.estadoJogo || {};
      const fase = estadoJogo.fase;
      const combateAtualAtivo = estadoJogo.combate?.ativo || false;

      // Se o jogo está em fase de rodadas, verificar turnos
      // EXCEÇÃO: durante combate ativo, qualquer jogador vivo pode agir (combate tem seu próprio tracking via jogadoresQueAgiram)
      if (fase === 'rodada_em_andamento' && !combateAtualAtivo) {
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

      // ✅ Obter último resumo se disponível
      const resumoMaisRecente = await this.gerenciadorSessoes.obterUltimoResumo(roomId);

      // 3. Criar instância do Mestre com temas e personagens da história
      this.log('INFO', 'MENSAGEM_PARA_MESTRE_CREATING_MESTRE', socket.id, userId, {
        temas: sessao.historiaTemas,
        jogadoresCount: sessao.jogadoresConectados?.length || 0,
        temResumo: !!resumoMaisRecente
      });

      // Obter Mestre (com cache)
      const mestre = await this.obterMestre(
        roomId,
        sessao.historiaTemas || [],
        sessao
      );

      // 4. Injetar contexto de combate na ação (se combate ativo)
      let acaoComContexto = mensagem;
      const combateAtivo = estadoJogo.combate?.ativo;
      if (combateAtivo) {
        const contextoCombate = formatarContextoCombate(estadoJogo.combate, userId);
        acaoComContexto = `${contextoCombate}\nAção do jogador: "${mensagem}"`;
        this.log('INFO', 'MENSAGEM_PARA_MESTRE_COMBATE_CONTEXTO', socket.id, userId, {
          roomId,
          monstrosVivos: estadoJogo.combate.monstros.filter(m => m.status === 'vivo').length
        });
      }

      // 5. Narrar ação do jogador (COM FALLBACK SE IA FALHAR)
      this.log('INFO', 'MENSAGEM_PARA_MESTRE_INVOKING_IA', socket.id, userId, {
        jogador: username,
        personagem: personagem.nome,
        historicoLength: historico.length,
        usandoResumo: !!resumoMaisRecente,
        combateAtivo: !!combateAtivo
      });

      let resposta;
      try {
        resposta = await mestre.narrarAcao({
          jogador: username,
          personagem: personagem.nome,
          acao: acaoComContexto,
          chatHistory: historico,
          resumo: resumoMaisRecente?.resumo || null
        });

        this.log('SUCCESS', 'MENSAGEM_PARA_MESTRE_IA_RESPONDED', socket.id, userId, {
          narracaoLength: resposta.narracao?.length || 0
        });
      } catch (errorIA) {
        console.error('❌ Erro na IA ao narrar ação:', errorIA);
        
        this.log('ERROR', 'MENSAGEM_PARA_MESTRE_IA_FAILED', socket.id, userId, {
          error: errorIA.message,
          stack: errorIA.stack
        });
        
        // ✅ FALLBACK: Resposta simples — auto-avançar turno se já houve 2+ mensagens
        const estadoJogoFallback = sessao.estadoJogo || {};
        const contadorFallback = estadoJogoFallback.contadorMensagensTurno || 0;
        resposta = {
          narracao: `**${personagem.nome}** ${mensagem}.\n\n*O Mestre faz uma pausa...* O que acontece a seguir?`,
          fimDeTurno: contadorFallback >= 2,
          solicitaDados: { solicita: false },
          acaoCompleta: contadorFallback >= 2
        };
        
        this.log('INFO', 'MENSAGEM_PARA_MESTRE_USANDO_FALLBACK', socket.id, userId, {
          mensagemFallback: resposta.narracao
        });
      }

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

      // Snapshot periodico (a cada 10 mensagens)
      this._tentarSnapshot(roomId, sessao);

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

      // ✅ DETECTAR INICIO DE COMBATE (VIA JSON da IA)
      if (resposta.combate?.iniciado && !combateAtivo) {
        this.log('INFO', 'COMBATE_DETECTADO_PELA_IA', socket.id, userId, {
          roomId,
          monstros: resposta.combate.monstros,
          motivo: resposta.combate.motivo,
          dificuldade: resposta.combate.dificuldade
        });
        await this.iniciarCombate(roomId, resposta.combate, sessao, userId);
      }

      // ✅ PROCESSAR AÇÃO DE COMBATE (se combate já ativo)
      if (combateAtivo) {
        await this.processarAcaoCombate(roomId, userId, username, personagem, mensagem, resposta, sessao);
      }

      // ✅ DETECTAR FUGA DE COMBATE
      if (combateAtivo && resposta.combate?.fuga) {
        await this.finalizarCombate(roomId, 'fuga');
      }

      // ✅ PROCESSAR AÇÕES MECÂNICAS DO MESTRE (dar_item, curar, dano, status)
      if (resposta.acoes && Array.isArray(resposta.acoes) && resposta.acoes.length > 0) {
        try {
          const { processarAcoes } = await import('../helpers/acoesProcessor.js');
          await processarAcoes(resposta.acoes, sessao, roomId, this.io);
          // Salvar sessão atualizada (ações podem modificar HP, inventário, etc.)
          await this.gerenciadorSessoes.atualizarSessao(roomId, sessao);
        } catch (acoesError) {
          console.error('⚠️ Erro ao processar ações do Mestre:', acoesError.message);
        }
      }

      // ✅ DETECTAR SE MESTRE SOLICITOU ROLAGEM DE DADOS (VIA JSON)
      const solicitouDados = resposta.solicitaDados?.solicita || false;

      if (solicitouDados) {
        this.log('INFO', 'MENSAGEM_PARA_MESTRE_DADOS_SOLICITADOS_JSON', socket.id, userId, {
          roomId,
          teste: resposta.solicitaDados.teste,
          tipo: resposta.solicitaDados.tipo,
          dificuldade: resposta.solicitaDados.dificuldade
        });
        console.log('🎲 Mestre solicitou dados (JSON):', resposta.solicitaDados);
        
        // ✅ MARCAR QUE DADOS FORAM SOLICITADOS (para handleDiceRoll saber)
        const estadoJogoAtual = sessao.estadoJogo || {};
        estadoJogoAtual.dadosSolicitados = true;
        estadoJogoAtual.testeInfo = {
          teste: resposta.solicitaDados.teste || null,
          dificuldade: resposta.solicitaDados.dificuldade || 'Média',
          jogadorAlvo: userId
        };
        sessao.estadoJogo = estadoJogoAtual;
        
        // ✅ SALVAR MENSAGEM DE AGUARDANDO DADOS NO REDIS
        const mensagemAguardando = {
          tipo: 'aguardando_dados',
          userId: 'sistema',
          username: 'Sistema',
          mensagem: `⏳ Aguardando ${username} rolar ${resposta.solicitaDados.tipo} para ${resposta.solicitaDados.teste}`,
          jogadorAguardando: username,
          dadoSolicitado: resposta.solicitaDados.tipo,
          teste: resposta.solicitaDados.teste,
          timestamp: Date.now()
        };
        
        sessao.mensagens.push(mensagemAguardando);
        await this.gerenciadorSessoes.atualizarSessao(roomId, sessao);
        
        console.log(`💬 Mensagem de aguardando dados salva no Redis + flag dadosSolicitados = true`);
        
        // Calcular modificador antecipado para mostrar no banner
        let modificadorPreview = 0;
        let atributoPreview = null;
        try {
          const { calcularModificadorTeste } = await import('../helpers/testeHelper.js');
          const jogadorInfo = sessao.jogadores?.[userId];
          const pId = jogadorInfo?.personagemId;
          const pCompleto = pId ? sessao.personagensCompletos?.[String(pId)] : null;
          if (pCompleto && resposta.solicitaDados.teste) {
            const modInfo = calcularModificadorTeste(pCompleto, resposta.solicitaDados.teste);
            modificadorPreview = modInfo.totalModificador;
            atributoPreview = modInfo.atributoNome;
          }
        } catch (e) {
          console.warn('⚠️ Erro ao calcular modificador preview:', e.message);
        }

        // Emitir evento com mais informações
        this.io.to(roomId).emit('mestre_solicita_dados', {
          narrativa: resposta.narracao,
          tipoDado: resposta.solicitaDados.tipo,
          teste: resposta.solicitaDados.teste,
          dificuldade: resposta.solicitaDados.dificuldade,
          modificador: modificadorPreview,
          atributo: atributoPreview,
          timestamp: Date.now()
        });
      } else {
        // ✅ GARANTIR QUE FLAG É LIMPA quando Mestre NÃO solicita dados
        const estadoJogoAtual = sessao.estadoJogo || {};
        if (estadoJogoAtual.dadosSolicitados) {
          estadoJogoAtual.dadosSolicitados = false;
          estadoJogoAtual.testeInfo = null;
          sessao.estadoJogo = estadoJogoAtual;
          await this.gerenciadorSessoes.atualizarSessao(roomId, sessao);
          console.log(`🔄 Flag dadosSolicitados limpa (Mestre não solicitou)`);
        }
      }

      // 10. CONTROLE DE TURNOS: Incrementar contador e verificar se deve avançar
      // SKIP durante combate (combate tem próprio sistema de rodadas via jogadoresQueAgiram)
      if (fase === 'rodada_em_andamento' && !combateAtivo) {
        const contador = await this.gerenciadorSessoes.incrementarContadorMensagensTurno(roomId);
        
        this.log('INFO', 'MENSAGEM_PARA_MESTRE_CONTADOR_INCREMENTADO', socket.id, userId, {
          roomId,
          contadorAtual: contador
        });
        
        // ✅ Detectar se Mestre sinalizou fim de turno (VIA JSON)
        const mestreSinalizouFim = resposta.fimDeTurno || false;
        
        if (mestreSinalizouFim) {
          console.log(`🎭 Mestre sinalizou fim de turno via JSON (fimDeTurno: true)`);
          
          // ✅ Aguardar 500ms antes de emitir evento (dar tempo para mensagem chegar no front)
          setTimeout(() => {
            this.io.to(roomId).emit('mestre_finalizou_turno', {
              jogador: username,
              contador: contador,
              timestamp: Date.now()
            });
            console.log('✅ Evento mestre_finalizou_turno emitido após 500ms');
          }, 500);
        }
        
        // ✅ Avançar se: Mestre sinalizou OU atingiu limite flexível (4 mensagens)
        if (mestreSinalizouFim || contador >= 4) {
          const motivo = mestreSinalizouFim ? 'mestre_sinalizou' : 'limite_atingido';
          
          this.log('INFO', 'MENSAGEM_PARA_MESTRE_FIM_TURNO', socket.id, userId, {
            roomId,
            contador,
            motivo,
            jogador: username
          });
          
          console.log(`🏁 Fim de turno detectado (${motivo}) - Aguardando 500ms para avançar`);
          
          // ✅ Aguardar 500ms antes de avançar turno
          setTimeout(async () => {
            try {
              await this.avancarProximoTurno(roomId);
              console.log('✅ Turno avançado após 500ms');
            } catch (error) {
              console.error('❌ Erro ao avançar turno:', error);
              this.io.to(roomId).emit('erro_sistema', { message: 'Erro ao avançar turno. Tente novamente.' });
            }
          }, 500);
        }
      }

      const processingTime = Date.now() - startTime;
      this.log('SUCCESS', 'MENSAGEM_PARA_MESTRE_COMPLETED', socket.id, userId, {
        roomId,
        jogador: username,
        personagem: personagem.nome,
        processingTimeMs: processingTime
      });

      }); // fecha withRoomLock

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

      // Validar userId corresponde ao autenticado
      if (String(rawUserId) !== String(socket.userId)) {
        socket.emit('error', { message: 'userId não corresponde ao usuário autenticado.', code: 'USER_MISMATCH' });
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

      // Guard: turno já foi iniciado (evitar duplicatas por cliques rápidos)
      if (estadoJogo.turnoIniciado) {
        this.log('WARN', 'INICIAR_TURNO_JA_INICIADO', socket.id, userId, { roomId });
        return;
      }

      this.log('INFO', 'INICIAR_TURNO_VALIDADO', socket.id, userId, {
        roomId,
        turnoAtual,
        jogador: username
      });

      // Obter Mestre (com cache)
      const mestre = await this.obterMestre(
        roomId,
        sessao.historiaTemas || [],
        sessao
      );

      this.log('INFO', 'INICIAR_TURNO_GERANDO_MENSAGEM_MESTRE', socket.id, userId, {
        jogador: username,
        personagem: jogadorDaVez.personagemNome
      });

      // Gerar mensagem inicial do Mestre para o jogador (COM FALLBACK)
      let mensagemInicial;
      try {
        mensagemInicial = await mestre.narrarTurnoJogador({
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
      } catch (errorIA) {
        console.error('❌ Erro na IA ao iniciar turno:', errorIA);
        
        this.log('ERROR', 'INICIAR_TURNO_IA_FAILED', socket.id, userId, {
          error: errorIA.message,
          stack: errorIA.stack
        });
        
        // ✅ FALLBACK: Mensagem simples
        mensagemInicial = {
          resposta: `E agora, **${jogadorDaVez.personagemNome || username}**, o que você faz?`
        };
        
        this.log('INFO', 'INICIAR_TURNO_USANDO_FALLBACK', socket.id, userId, {
          mensagemFallback: mensagemInicial.resposta
        });
      }

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

      // Processar ações mecânicas do Mestre (dar_item, curar, etc.)
      if (mensagemInicial.acoes && Array.isArray(mensagemInicial.acoes) && mensagemInicial.acoes.length > 0) {
        try {
          const { processarAcoes } = await import('../helpers/acoesProcessor.js');
          await processarAcoes(mensagemInicial.acoes, sessao, roomId, this.io);
        } catch (acoesError) {
          console.error('⚠️ Erro ao processar ações no inicio de turno:', acoesError.message);
        }
      }

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
   * Handler para Mestre solicitar rolagem de dados
   */
  async handleSolicitarDados(socket, data) {
    const startTime = Date.now();
    this.log('INFO', 'SOLICITAR_DADOS_PROCESSING_START', socket.id, socket.userId, {
      receivedData: data
    });

    try {
      const { roomId, motivo, tipoTeste, dificuldade, jogadores } = data || {};

      if (!roomId || !motivo) {
        this.log('ERROR', 'SOLICITAR_DADOS_VALIDATION_FAILED', socket.id, socket.userId, {
          missingFields: {
            roomId: !roomId,
            motivo: !motivo
          }
        });
        return socket.emit('error', { message: 'roomId e motivo são obrigatórios' });
      }

      const sessao = await this.obterSessaoHistoria(roomId);
      if (!sessao) {
        this.log('ERROR', 'SOLICITAR_DADOS_SESSAO_NOT_FOUND', socket.id, socket.userId, {
          roomId
        });
        return socket.emit('error', { message: 'Sessão não encontrada' });
      }

      this.log('INFO', 'SOLICITAR_DADOS_OBTENDO_MESTRE', socket.id, socket.userId, {
        roomId
      });

      // Obter mestre com cache
      const mestre = await this.obterMestre(
        roomId,
        sessao.historiaTemas || [],
        sessao
      );

      this.log('INFO', 'SOLICITAR_DADOS_GERANDO_NARRATIVA', socket.id, socket.userId, {
        motivo,
        tipoTeste: tipoTeste || 'd20'
      });

      const solicitacao = await mestre.solicitarRolagemDados({
        motivo,
        tipoTeste: tipoTeste || 'd20',
        dificuldade: dificuldade || 'Média',
        jogadores: jogadores || [],
        chatHistory: sessao.mensagens || []
      });

      this.log('SUCCESS', 'SOLICITAR_DADOS_NARRATIVA_GERADA', socket.id, socket.userId, {
        narrativaLength: solicitacao.narrativa?.length || 0
      });

      // Salvar mensagem do Mestre no Redis
      if (!sessao.mensagens) {
        sessao.mensagens = [];
      }

      sessao.mensagens.push({
        tipo: 'solicitacao_dados',
        userId: 'mestre',
        username: 'Mestre',
        mensagem: solicitacao.narrativa,
        tipoTeste: solicitacao.tipoTeste,
        dificuldade: solicitacao.dificuldade,
        timestamp: Date.now()
      });

      await this.gerenciadorSessoes.atualizarSessao(roomId, sessao);

      this.log('SUCCESS', 'SOLICITAR_DADOS_SESSAO_UPDATED', socket.id, socket.userId, {
        roomId
      });

      // Emitir para todos na sala
      this.io.to(roomId).emit('solicitacao_dados', {
        narrativa: solicitacao.narrativa,
        tipoTeste: solicitacao.tipoTeste,
        dificuldade: solicitacao.dificuldade,
        jogadores: solicitacao.jogadores,
        timestamp: Date.now()
      });

      const processingTime = Date.now() - startTime;
      this.log('SUCCESS', 'SOLICITAR_DADOS_COMPLETED', socket.id, socket.userId, {
        roomId,
        processingTimeMs: processingTime
      });

      console.log(`🎲 Solicitação de dados enviada para sala ${roomId}`);
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.log('ERROR', 'SOLICITAR_DADOS_ERROR', socket.id, socket.userId, {
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime
      });
      socket.emit('error', { message: 'Erro ao solicitar dados' });
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

      // Validar userId corresponde ao autenticado
      if (String(rawUserId) !== String(socket.userId)) {
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

      // Check if the user already reconnected with a different socket
      const currentSocket = this.connectedUsers.get(socket.userId);
      if (currentSocket && currentSocket.id !== socket.id) {
        // User already reconnected with a new socket, skip cleanup
        this.log('INFO', 'DISCONNECT_SKIPPED_USER_RECONNECTED', socket.id, socket.userId, {
          newSocketId: currentSocket.id
        });
        return;
      }

      // Remover usuario da lista de conectados
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
          
          // Forçar snapshot quando último jogador desconecta de uma história
          if (shouldDeleteRoom && roomId.startsWith('historia_')) {
            try {
              const sessaoParaSnapshot = await this.gerenciadorSessoes.obterSessao(roomId);
              if (sessaoParaSnapshot) {
                this._tentarSnapshot(roomId, sessaoParaSnapshot, true);
                this.log('INFO', 'DISCONNECT_FORCED_SNAPSHOT', socket.id, socket.userId, { roomId });
              }
            } catch (snapErr) {
              this.log('ERROR', 'DISCONNECT_SNAPSHOT_ERROR', socket.id, socket.userId, {
                roomId, error: snapErr.message
              });
            }
          }

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

      // Tentar restaurar do PostgreSQL (snapshot salvo)
      try {
        const sessaoRestaurada = await sessaoSnapshotService.restaurarSessao(salaId);
        if (sessaoRestaurada) {
          console.log(`♻️ Sessão restaurada do PostgreSQL para história ${historiaId}`);
          return sessaoRestaurada;
        }
      } catch (restoreErr) {
        console.warn(`⚠️ Falha ao restaurar sessão do PostgreSQL: ${restoreErr.message}`);
      }

      // Se não existe nem no snapshot, buscar dados da história no banco e criar sessão
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

      // Buscar temas completos antes de criar sessão
      const temasCompletos = await buscarTemasCompletos(historia.temas || []);
      console.log(`🎨 Temas completos para sessão:`, temasCompletos);
      
      // Montar mestreConfig a partir do mestre atribuido (se existir)
      const mestreConfig = historia.mestres ? {
        nome: historia.mestres.nome,
        personalidade: historia.mestres.personalidade,
        tom_narrativo: historia.mestres.tom_narrativo,
        regras_especiais: historia.mestres.regras_especiais,
        modelo: historia.mestres.modelo,
        temperatura: historia.mestres.temperatura,
        max_tokens: historia.mestres.max_tokens
      } : null;

      // Criar dados da sessão
      const dadosSessao = {
        historiaId: historia.id,
        historiaNome: historia.nome,
        historiaTemas: temasCompletos, // Salvar temas completos (id + nome)
        historiaPrologo: historia.prologo || '',
        donoId: historia.id_usuario ? String(historia.id_usuario) : null,
        donoNome: donoNome,
        maxJogadores: historia.maximo_de_participantes || 5,
        mestreConfig, // Config do mestre atribuido a historia
        status: 'aberta', // Status inicial (sessão criada mas ninguém entrou)
        statusJogo: null, // ✅ NOVO: null = ninguém entrou ainda
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
            
            // ✅ ATUALIZAR statusJogo baseado na quantidade de jogadores
            const statusAnterior = sessao.statusJogo;
            if (jogadoresAtuais.length === 1) {
              sessao.statusJogo = 'esperando'; // Primeiro jogador entrou
              console.log(`🎮 Primeiro jogador entrou, status: esperando`);
            } else if (jogadoresAtuais.length > 1) {
              sessao.statusJogo = 'esperando'; // Mais jogadores, ainda esperando
              console.log(`🎮 ${jogadoresAtuais.length} jogadores esperando`);
            }
            
            sessao.atualizadaEm = new Date().toISOString();
            
            await this.gerenciadorSessoes.atualizarSessao(salaId, sessao);
            console.log(`👤 Jogador ${dadosJogador.username} adicionado à sessão ${salaId}`);
            
            // ✅ EMITIR EVENTO DE MUDANÇA DE STATUS
            if (statusAnterior !== sessao.statusJogo && this.io) {
              this.io.to(salaId).emit('status_jogo_alterado', {
                statusJogo: sessao.statusJogo,
                totalJogadores: jogadoresAtuais.length,
                timestamp: Date.now()
              });
              console.log(`📢 Evento status_jogo_alterado emitido: ${statusAnterior} → ${sessao.statusJogo}`);
            }
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

      // ✅ JOGO SOLO: Se só 1 jogador, apenas resetar contador
      if (ordemJogadores.length === 1) {
        console.log(`🔄 Jogo solo detectado: resetando contador para continuar`);
        estadoJogo.contadorMensagensTurno = 0;
        estadoJogo.turnoIniciado = false;
        // Tick down status effects fora de combate (solo)
        if (!estadoJogo.combate?.ativo) {
          for (const [pId, pCompleto] of Object.entries(sessao.personagensCompletos || {})) {
            if (!pCompleto.status_efeitos || pCompleto.status_efeitos.length === 0) continue;
            pCompleto.status_efeitos = pCompleto.status_efeitos.filter(e => {
              e.duracao = (e.duracao || 1) - 1;
              if (e.duracao <= 0) {
                this.io.to(roomId).emit('acao_mestre', {
                  tipo: 'status_removido',
                  personagem: pCompleto.nome,
                  status: e.nome,
                  timestamp: Date.now()
                });
                console.log(`✨ Status expirado (solo): ${pCompleto.nome} ← ${e.nome}`);
                return false;
              }
              return true;
            });
          }
        }
        await this.gerenciadorSessoes.atualizarSessao(roomId, sessao);
        return;
      }

      // Resetar flag de turno iniciado ao avançar
      estadoJogo.turnoIniciado = false;
      estadoJogo.contadorMensagensTurno = 0; // Resetar contador

      const proximoTurno = turnoAtual + 1;

      // Verificar se acabou a rodada
      if (proximoTurno >= ordemJogadores.length) {
        console.log(`🏁 Rodada finalizada na sala ${roomId}`);
        await this.finalizarRodada(roomId);
        return;
      }

      const proximoJogador = ordemJogadores[proximoTurno];
      const jogadorAnterior = ordemJogadores[turnoAtual];
      
      console.log(`⏭️ Avançando para turno ${proximoTurno} - ${proximoJogador.username} na sala ${roomId}`);

      // ✅ 0.5. TICK DOWN STATUS EFFECTS fora de combate (a cada troca de turno)
      if (!estadoJogo.combate?.ativo) {
        for (const [pId, pCompleto] of Object.entries(sessao.personagensCompletos || {})) {
          if (!pCompleto.status_efeitos || pCompleto.status_efeitos.length === 0) continue;
          pCompleto.status_efeitos = pCompleto.status_efeitos.filter(e => {
            e.duracao = (e.duracao || 1) - 1;
            if (e.duracao <= 0) {
              this.io.to(roomId).emit('acao_mestre', {
                tipo: 'status_removido',
                personagem: pCompleto.nome,
                status: e.nome,
                timestamp: Date.now()
              });
              console.log(`✨ Status expirado fora de combate: ${pCompleto.nome} ← ${e.nome}`);
              return false;
            }
            return true;
          });
        }
      }

      // ✅ 1. SALVAR MENSAGEM DE TRANSIÇÃO PRIMEIRO (antes de avançar turno)
      if (!sessao.mensagens) {
        sessao.mensagens = [];
      }
      
      sessao.mensagens.push({
        tipo: 'transicao_turno',
        userId: 'sistema',
        username: 'Sistema',
        mensagem: `🏁 Turno de ${jogadorAnterior?.username || 'jogador'} finalizado. Vez de ${proximoJogador.username}!`,
        timestamp: Date.now()
      });

      // ✅ 2. ATUALIZAR ESTADO DO JOGO (avançar turno)
      estadoJogo.turnoAtual = proximoTurno;
      sessao.estadoJogo = estadoJogo;
      
      // ✅ 3. SALVAR TUDO DE UMA VEZ NO REDIS
      await this.gerenciadorSessoes.atualizarSessao(roomId, sessao);

      console.log(`💾 Turno ${proximoTurno} e mensagem de transição salvos no Redis`);

      // ✅ 3.5. EMITIR MENSAGEM DE TRANSIÇÃO EM TEMPO REAL
      this.io.to(roomId).emit('chat_message', {
        id: `transicao_${Date.now()}`,
        tipo: 'transicao_turno',
        userId: 'sistema',
        username: 'Sistema',
        message: `🏁 Turno de ${jogadorAnterior?.username || 'jogador'} finalizado. Vez de ${proximoJogador.username}!`,
        timestamp: Date.now()
      });

      // ✅ 4. EMITIR EVENTO DE MUDANÇA DE TURNO
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
      const proximaRodada = rodadaAtual + 1;

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

      // Coletar resumo das ações da rodada
      const historicoTurnos = estadoJogo.historicoTurnos || [];
      const acoesRodada = historicoTurnos
        .filter(t => t.rodada === rodadaAtual)
        .map(t => `${t.personagem || t.username}: ${t.acao || t.resumo || 'Ação realizada'}`);

      console.log(`📝 Coletadas ${acoesRodada.length} ações da rodada ${rodadaAtual}`);

      // Gerar narrativa do Mestre entre rodadas
      try {
        console.log(`🎭 Gerando narrativa entre rodadas ${rodadaAtual} → ${proximaRodada}...`);
        
        // Obter Mestre (com cache)
        const mestre = await this.obterMestre(
          roomId,
          sessao.historiaTemas || [],
          sessao
        );

        const narrativa = await mestre.narrarEntreRodadas({
          rodadaAnterior: rodadaAtual,
          proximaRodada: proximaRodada,
          resumoAcoes: acoesRodada,
          chatHistory: sessao.mensagens || []
        });

        console.log(`✅ Narrativa entre rodadas gerada com sucesso`);

        // ✅ VERIFICAR SE PRECISA GERAR RESUMO
        const precisaResumir = await this.gerenciadorSessoes.precisaResumir(roomId);

        if (precisaResumir) {
          console.log(`📝 Gerando resumo automático da aventura...`);
          
          try {
            const resumoAgent = (await import('../agents/Resumo/index.js')).default;
            const sessaoParaResumo = await this.obterSessaoHistoria(roomId);
            
            const resumo = await resumoAgent.resumirAventura({
              mensagens: sessaoParaResumo.mensagens || [],
              temas: extrairNomesTemas(sessaoParaResumo.historiaTemas || []),
              personagens: Object.values(sessaoParaResumo.jogadores || {}),
              rodadasJogadas: rodadaAtual
            });

            await this.gerenciadorSessoes.salvarResumo(roomId, resumo);
            
            console.log(`✅ Resumo gerado e salvo (${resumo.mensagensResumiadas} msgs resumidas)`);
            
            // ✅ INVALIDAR CACHE DO MESTRE APÓS RESUMO
            this.invalidarMestreSeNecessario(roomId, proximaRodada);
          } catch (error) {
            console.error(`❌ Erro ao gerar resumo:`, error);
          }
        }

        // Processar ações mecânicas do Mestre entre rodadas (dar_item, curar, etc.)
        if (narrativa.acoes && Array.isArray(narrativa.acoes) && narrativa.acoes.length > 0) {
          try {
            const { processarAcoes } = await import('../helpers/acoesProcessor.js');
            const sessaoParaAcoes = await this.obterSessaoHistoria(roomId);
            await processarAcoes(narrativa.acoes, sessaoParaAcoes, roomId, this.io);
            await this.gerenciadorSessoes.atualizarSessao(roomId, sessaoParaAcoes);
          } catch (acoesError) {
            console.error('⚠️ Erro ao processar ações entre rodadas:', acoesError.message);
          }
        }

        // Detectar combate entre rodadas
        if (narrativa.combate?.iniciado) {
          const sessaoParaCombate = await this.obterSessaoHistoria(roomId);
          await this.iniciarCombate(roomId, narrativa.combate, sessaoParaCombate, null);
        }

        // Salvar narrativa do Mestre no Redis
        const sessaoAtualizada = await this.obterSessaoHistoria(roomId);
        const mensagemMestre = {
          tipo: 'entre_rodadas',
          userId: 'mestre',
          username: 'Mestre',
          mensagem: narrativa.narrativa || narrativa.novoDesafio,
          rodadaAnterior: rodadaAtual,
          proximaRodada: proximaRodada,
          timestamp: Date.now()
        };

        if (!sessaoAtualizada.mensagens) {
          sessaoAtualizada.mensagens = [];
        }
        sessaoAtualizada.mensagens.push(mensagemMestre);
        await this.gerenciadorSessoes.atualizarSessao(roomId, sessaoAtualizada);

        console.log(`💬 Narrativa entre rodadas salva no Redis (será carregada via HTTP pelo frontend)`);
      } catch (error) {
        console.error(`❌ Erro ao gerar narrativa entre rodadas:`, error);
        
        // Fallback: mensagem simples se a IA falhar
        const sessaoAtualizada = await this.obterSessaoHistoria(roomId);
        const mensagemFallback = {
          tipo: 'entre_rodadas',
          userId: 'sistema',
          username: 'Sistema',
          mensagem: `A rodada ${rodadaAtual} foi concluída. Preparando rodada ${proximaRodada}...`,
          timestamp: Date.now()
        };
        
        if (!sessaoAtualizada.mensagens) {
          sessaoAtualizada.mensagens = [];
        }
        sessaoAtualizada.mensagens.push(mensagemFallback);
        await this.gerenciadorSessoes.atualizarSessao(roomId, sessaoAtualizada);
      }

      // Aguardar 5 segundos antes de iniciar nova rodada
      setTimeout(async () => {
        try {
          await this.iniciarNovaRodada(roomId);
        } catch (error) {
          console.error('❌ Erro ao iniciar nova rodada:', error);
          this.io.to(roomId).emit('erro_sistema', { message: 'Erro ao iniciar nova rodada. Tente novamente.' });
        }
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

      // Snapshot forçado na mudança de rodada
      this._tentarSnapshot(roomId, sessaoAtualizada, true);

      console.log(`✅ Rodada ${novaRodada} iniciada`);
    } catch (error) {
      console.error(`❌ Erro ao iniciar nova rodada:`, error);
    }
  }

  /**
   * Obter ou criar Mestre para uma sessão (com cache)
   */
  // ============================================================
  // SISTEMA DE COMBATE
  // ============================================================

  /**
   * Iniciar combate baseado na sinalização da IA
   * @param {string} roomId - ID da sala
   * @param {Object} combateData - Dados de combate da IA { monstros, motivo, dificuldade }
   * @param {Object} sessao - Sessão atual
   * @param {string} userId - ID do jogador que provocou o combate
   */
  async iniciarCombate(roomId, combateData, sessao, userId) {
    try {
      console.log(`⚔️ Iniciando combate na sala ${roomId}: ${combateData.motivo}`);

      const monstrosIA = combateData.monstros || [];
      const dificuldade = combateData.dificuldade || 'media';

      // Calcular nível médio dos jogadores
      const jogadores = Array.isArray(sessao.jogadoresConectados)
        ? sessao.jogadoresConectados
        : Object.values(sessao.jogadores || {});
      const personagensCompletos = sessao.personagensCompletos || {};

      let somaLevels = 0;
      let countLevels = 0;
      for (const jogador of jogadores) {
        const pId = String(jogador.personagemId || jogador.personagem_id);
        const p = personagensCompletos[pId];
        if (p?.nivel) {
          somaLevels += p.nivel;
          countLevels++;
        }
      }
      const nivelMedio = countLevels > 0 ? Math.round(somaLevels / countLevels) : 1;

      // Buscar monstros no banco
      const monstrosBanco = [];
      for (const sugestao of monstrosIA) {
        const encontrado = await db.Monstro.buscarPorNomeSimilar(sugestao.nome);
        if (encontrado) {
          monstrosBanco.push(encontrado);
        }
      }

      console.log(`📦 ${monstrosBanco.length}/${monstrosIA.length} monstros encontrados no banco`);

      // Gerar instâncias de combate
      const instancias = gerarInstanciasCombate(monstrosBanco, monstrosIA, nivelMedio);

      // Calcular HP/Esquiva/Armadura dos jogadores
      const jogadoresCombate = {};
      for (const jogador of jogadores) {
        const jUserId = String(jogador.userId || jogador.id);
        const pId = String(jogador.personagemId || jogador.personagem_id);
        const p = personagensCompletos[pId];

        if (p) {
          const attrs = p.atributos || {}; // já inclui bonus de raça/classe
          const bonusEquip = p.bonusEquip || {};
          const personagemStats = {
            constituicao: attrs.constituicao || 10,
            destreza: attrs.destreza || 10,
            agilidade: attrs.agilidade || 10,
            nivel: p.nivel || 1
          };
          const hpMax = calcularHP(personagemStats);
          // Preservar HP da narrativa (dano de armadilhas, aplicar_dano, etc.)
          // Se p.hp_atual existe e é menor que hpMax, manter o dano sofrido
          const hpAtual = (p.hp_atual != null && p.hp_atual < hpMax) ? Math.max(1, p.hp_atual) : hpMax;
          jogadoresCombate[jUserId] = {
            personagemId: parseInt(pId),
            hp_max: hpMax,
            hp_atual: hpAtual,
            esquiva: calcularEsquiva(personagemStats, bonusEquip),
            armadura: calcularArmadura(bonusEquip),
            bonusAtaque: bonusEquip.ataque || 0,
            bonusDano: bonusEquip.dano || 0,
            dano_base: p.melhorArma || null,
            elemento: p.elementoArma || null,
            status: 'vivo',
            personagemNome: p.nome || jogador.username
          };
        } else {
          jogadoresCombate[jUserId] = {
            personagemId: parseInt(pId) || null,
            hp_max: 15,
            hp_atual: 15,
            esquiva: 5,
            armadura: 0,
            bonusAtaque: 0,
            bonusDano: 0,
            dano_base: null,
            status: 'vivo',
            personagemNome: jogador.username || 'Jogador'
          };
        }
      }

      // Montar estado de combate
      const combateState = {
        ativo: true,
        rodadaCombate: 1,
        motivo: combateData.motivo,
        dificuldade,
        monstros: instancias,
        jogadores: jogadoresCombate,
        jogadoresQueAgiram: [],
        log: [],
        resultado: null
      };

      // Salvar no estadoJogo
      const estadoJogo = sessao.estadoJogo || {};
      estadoJogo.combate = combateState;
      sessao.estadoJogo = estadoJogo;
      await this.gerenciadorSessoes.atualizarSessao(roomId, sessao);

      console.log(`✅ Combate iniciado: ${instancias.length} monstros vs ${Object.keys(jogadoresCombate).length} jogadores`);

      // Snapshot forçado ao iniciar combate (garante estado persistido)
      this._tentarSnapshot(roomId, sessao, true);

      // Emitir evento de combate iniciado
      this.io.to(roomId).emit(COMBAT_EVENTS.COMBATE_INICIADO, {
        monstros: instancias,
        jogadores: jogadoresCombate,
        rodada: 1,
        motivo: combateData.motivo,
        dificuldade,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('❌ Erro ao iniciar combate:', error);
    }
  }

  /**
   * Processar ação de combate de um jogador
   */
  async processarAcaoCombate(roomId, userId, username, personagem, mensagem, respostaIA, sessao) {
    try {
      const estadoJogo = sessao.estadoJogo || {};
      const combate = estadoJogo.combate;
      if (!combate?.ativo) return;

      const jogadorStats = combate.jogadores[userId];
      if (!jogadorStats) return;

      // Etapa 1.4: Bloquear jogador derrotado de agir
      if (jogadorStats.status === 'derrotado') {
        this.io.to(roomId).emit('server_message', {
          userId,
          mensagem: `💀 ${personagem.nome} foi derrotado e não pode agir neste combate.`
        });
        return;
      }

      // --- PROCESSAR STATUS EFFECTS DO JOGADOR ---
      const personagemCompleto_status = sessao.personagensCompletos?.[String(personagem.id)] || {};
      const statusEfeitos = personagemCompleto_status.status_efeitos || [];
      // Sync status_efeitos para combate.jogadores (para formatarContextoCombate ter visibilidade)
      jogadorStats.status_efeitos = statusEfeitos;
      let impedidoDeAgir = false;

      for (const efeito of statusEfeitos) {
        switch (efeito.nome) {
          case 'atordoado':
          case 'paralizado':
          case 'congelado':
            impedidoDeAgir = true;
            this.io.to(roomId).emit(COMBAT_EVENTS.COMBATE_RESULTADO_ACAO, {
              tipo: 'status_efeito',
              personagem: personagem.nome,
              userId,
              status: efeito.nome,
              mensagem: `${personagem.nome} está ${efeito.nome} e não pode agir!`,
              timestamp: Date.now()
            });
            break;
          case 'envenenado':
          case 'queimando': {
            // Dano por turno: 1d4 para veneno, 1d6 para queimadura
            const danoPorTurno = efeito.nome === 'envenenado' ? rolarDado('1d4') : rolarDado('1d6');
            jogadorStats.hp_atual = Math.max(0, jogadorStats.hp_atual - danoPorTurno);
            if (jogadorStats.hp_atual <= 0) jogadorStats.status = 'derrotado';
            this.io.to(roomId).emit(COMBAT_EVENTS.COMBATE_RESULTADO_ACAO, {
              tipo: 'status_dano',
              alvo: { userId, nome: personagem.nome },
              status: efeito.nome,
              dano: danoPorTurno,
              hpRestante: jogadorStats.hp_atual,
              hpMax: jogadorStats.hp_max,
              timestamp: Date.now()
            });
            // Emitir atualização de HP para o frontend refletir imediatamente
            this.io.to(roomId).emit(COMBAT_EVENTS.COMBATE_JOGADOR_FERIDO, {
              userId,
              nome: personagem.nome,
              hp_atual: jogadorStats.hp_atual,
              hp_max: jogadorStats.hp_max,
              derrotado: jogadorStats.status === 'derrotado',
              fonte: efeito.nome,
              timestamp: Date.now()
            });
            // Persistir HP no clone da sessão (DOT damage)
            if (jogadorStats.personagemId) {
              await persistirEstadoClone(roomId, jogadorStats.personagemId, { hp_atual: jogadorStats.hp_atual });
            }
            if (jogadorStats.status === 'derrotado') {
              impedidoDeAgir = true;
              this.io.to(roomId).emit(COMBAT_EVENTS.COMBATE_JOGADOR_FERIDO, {
                userId,
                nome: personagem.nome,
                hp_atual: 0,
                hp_max: jogadorStats.hp_max,
                derrotado: true,
                timestamp: Date.now()
              });
            }
            break;
          }
          case 'cego':
            // Cego: penalidade de -5 no ataque (aplicado abaixo)
            break;
        }
      }

      if (impedidoDeAgir) {
        // Mesmo impedido, conta como ação do turno e monstros contra-atacam
        // (skip para seção de contra-ataque abaixo)
      }

      // --- ATAQUE DO JOGADOR (só se não impedido por status) ---
      if (!impedidoDeAgir) {
        // Determinar alvo (primeiro monstro vivo)
        const monstroAlvo = combate.monstros.find(m => m.status === 'vivo');
        if (monstroAlvo) {
        // Bloco de ataque — indentado dentro do guard

        // Rolar ataque do jogador (d20)
        const rolagemAtaque = Math.floor(Math.random() * 20) + 1;
        const personagemCompleto = sessao.personagensCompletos?.[String(personagem.id)] || {};
        const attrs = personagemCompleto.atributos || {};
        const modForca = Math.floor(((attrs.forca || 10) - 10) / 2);
        const bonusAtaqueEquip = jogadorStats.bonusAtaque || 0;
        // Penalidade de cego: -5 no ataque
        const penalidadeCego = statusEfeitos.some(e => e.nome === 'cego') ? 5 : 0;
        const bonusAtaque = modForca + Math.floor((personagemCompleto.nivel || 1) * 0.7) + bonusAtaqueEquip - penalidadeCego;

        let { acertou, critico } = verificarAcerto(rolagemAtaque);
        // Cego: rolagem + bonus precisa superar DC 10 para acertar (além de nat 1/20)
        if (acertou && !critico && penalidadeCego > 0 && (rolagemAtaque + bonusAtaque) < 10) {
          acertou = false;
        }

        let danoTotal = 0;
        let esquivou = false;
        if (acertou) {
          // Critico ignora esquiva
          if (!critico && verificarEsquiva(monstroAlvo.esquiva || 0)) {
            esquivou = true;
          } else {
            const danoBase = jogadorStats.dano_base || (personagemCompleto.nivel >= 5 ? '1d8' : '1d6');
            const bonusDanoEquip = jogadorStats.bonusDano || 0;
            const armaduraMonstro = monstroAlvo.armadura || 0;
            danoTotal = calcularDano(danoBase, modForca + bonusDanoEquip, critico, armaduraMonstro);
            // Aplicar resistencias/imunidades do monstro
            const elementoAtaque = jogadorStats.elemento || null;
            if (elementoAtaque) {
              danoTotal = aplicarResistencias(danoTotal, elementoAtaque, monstroAlvo.resistencias || {}, monstroAlvo.imunidades || []);
            }
            monstroAlvo.hp_atual = Math.max(0, monstroAlvo.hp_atual - danoTotal);

            if (monstroAlvo.hp_atual <= 0) {
              monstroAlvo.status = 'derrotado';
            }
          }
        }

        // Log do ataque do jogador
        const logAtaque = {
          tipo: 'ataque_jogador',
          atacante: personagem.nome,
          alvo: monstroAlvo.nome,
          rolagem: rolagemAtaque,
          bonus: bonusAtaque,
          acertou: acertou && !esquivou,
          esquivou,
          critico,
          dano: danoTotal,
          armaduraAlvo: monstroAlvo.armadura || 0,
          hpRestante: monstroAlvo.hp_atual,
          timestamp: Date.now()
        };
        combate.log.push(logAtaque);

        // Emitir resultado do ataque do jogador
        this.io.to(roomId).emit(COMBAT_EVENTS.COMBATE_RESULTADO_ACAO, {
          tipo: 'ataque_jogador',
          atacante: { userId, nome: personagem.nome },
          alvo: { id: monstroAlvo.id, nome: monstroAlvo.nome },
          rolagem: rolagemAtaque,
          bonus: bonusAtaque,
          acertou: acertou && !esquivou,
          esquivou,
          critico,
          dano: danoTotal,
          armaduraAlvo: monstroAlvo.armadura || 0,
          hpRestante: monstroAlvo.hp_atual,
          hpMax: monstroAlvo.hp_max,
          timestamp: Date.now()
        });

        // Se monstro derrotado
        if (monstroAlvo.status === 'derrotado') {
          this.io.to(roomId).emit(COMBAT_EVENTS.COMBATE_MONSTRO_DERROTADO, {
            monstro: { id: monstroAlvo.id, nome: monstroAlvo.nome },
            xp: monstroAlvo.xp || 0,
            timestamp: Date.now()
          });
        }
        } // fecha if (monstroAlvo)
      }

      // --- CONTRA-ATAQUE DOS MONSTROS ---
      // Etapa 1.2: Selecionar alvo aleatório entre jogadores vivos (multi-player)
      const monstrosVivos = combate.monstros.filter(m => m.status === 'vivo');
      for (const monstro of monstrosVivos) {
        // Selecionar alvo aleatório entre jogadores vivos
        const jogadoresVivos = Object.entries(combate.jogadores)
          .filter(([_, j]) => j.status !== 'derrotado');
        if (jogadoresVivos.length === 0) break;

        const [alvoId, alvoStats] = jogadoresVivos[Math.floor(Math.random() * jogadoresVivos.length)];

        // Selecionar habilidade ou ataque básico
        const habilidade = selecionarHabilidadeMonstro(monstro, combate.rodadaCombate);

        // Rolar ataque do monstro
        const rolagemMonstro = Math.floor(Math.random() * 20) + 1;
        const { acertou: monstroAcertou, critico: monstroCritico } = verificarAcerto(rolagemMonstro);

        let danoMonstro = 0;
        let monstroEsquivou = false;
        if (monstroAcertou) {
          // Critico ignora esquiva
          if (!monstroCritico && verificarEsquiva(alvoStats.esquiva || 0)) {
            monstroEsquivou = true;
          } else {
            const danoNotacao = habilidade?.dano || monstro.dano_base;
            const modForcaMonstro = Math.floor(((monstro.forca || 10) - 10) / 2);
            const armaduraJogador = alvoStats.armadura || 0;
            danoMonstro = calcularDano(danoNotacao, modForcaMonstro, monstroCritico, armaduraJogador);
            alvoStats.hp_atual = Math.max(0, alvoStats.hp_atual - danoMonstro);

            if (alvoStats.hp_atual <= 0) {
              alvoStats.status = 'derrotado';
            }

            // Persistir HP no clone da sessão (monster attack)
            if (alvoStats.personagemId) {
              await persistirEstadoClone(roomId, alvoStats.personagemId, { hp_atual: alvoStats.hp_atual });
            }
          }
        }

        // Atualizar cooldown da habilidade usada
        if (habilidade) {
          monstro.cooldowns[habilidade.nome] = combate.rodadaCombate;
        }

        // Log do ataque do monstro
        combate.log.push({
          tipo: 'ataque_monstro',
          atacante: monstro.nome,
          alvo: alvoStats.personagemNome,
          habilidade: habilidade?.nome || 'Ataque básico',
          rolagem: rolagemMonstro,
          acertou: monstroAcertou && !monstroEsquivou,
          esquivou: monstroEsquivou,
          critico: monstroCritico,
          dano: danoMonstro,
          armaduraAlvo: alvoStats.armadura || 0,
          hpRestante: alvoStats.hp_atual,
          timestamp: Date.now()
        });

        // Emitir resultado do ataque do monstro
        this.io.to(roomId).emit(COMBAT_EVENTS.COMBATE_RESULTADO_ACAO, {
          tipo: 'ataque_monstro',
          atacante: { id: monstro.id, nome: monstro.nome },
          alvo: { userId: alvoId, nome: alvoStats.personagemNome },
          habilidade: habilidade?.nome || 'Ataque básico',
          rolagem: rolagemMonstro,
          acertou: monstroAcertou && !monstroEsquivou,
          esquivou: monstroEsquivou,
          critico: monstroCritico,
          dano: danoMonstro,
          armaduraAlvo: alvoStats.armadura || 0,
          hpRestante: alvoStats.hp_atual,
          hpMax: alvoStats.hp_max,
          timestamp: Date.now()
        });

        if (alvoStats.status === 'derrotado') {
          this.io.to(roomId).emit(COMBAT_EVENTS.COMBATE_JOGADOR_FERIDO, {
            userId: alvoId,
            nome: alvoStats.personagemNome,
            hp_atual: 0,
            hp_max: alvoStats.hp_max,
            derrotado: true,
            timestamp: Date.now()
          });
        }
      }

      // Etapa 1.1: Rastrear jogadores que agiram e incrementar rodada
      if (!combate.jogadoresQueAgiram) {
        combate.jogadoresQueAgiram = [];
      }
      if (!combate.jogadoresQueAgiram.includes(userId)) {
        combate.jogadoresQueAgiram.push(userId);
      }
      const totalJogadoresVivos = Object.entries(combate.jogadores)
        .filter(([_, j]) => j.status !== 'derrotado').length;
      if (combate.jogadoresQueAgiram.length >= totalJogadoresVivos) {
        combate.rodadaCombate++;
        combate.jogadoresQueAgiram = [];

        // Tick down status effects de todos os jogadores no fim da rodada
        for (const [jId, jStats] of Object.entries(combate.jogadores)) {
          const pCompleto = Object.values(sessao.personagensCompletos || {}).find(
            p => p.nome === jStats.personagemNome
          );
          if (!pCompleto?.status_efeitos) continue;
          pCompleto.status_efeitos = pCompleto.status_efeitos.filter(e => {
            e.duracao = (e.duracao || 1) - 1;
            if (e.duracao <= 0) {
              this.io.to(roomId).emit('acao_mestre', {
                tipo: 'status_removido',
                personagem: jStats.personagemNome,
                userId: jId,
                status: e.nome,
                timestamp: Date.now()
              });
              return false;
            }
            return true;
          });
          // Persistir status_efeitos no clone da sessão
          if (jStats.personagemId) {
            await persistirEstadoClone(roomId, jStats.personagemId, {
              status_efeitos: pCompleto.status_efeitos
            });
          }
        }

        console.log(`🔄 Combate rodada ${combate.rodadaCombate} na sala ${roomId}`);
      }

      // Verificar fim de combate
      const { finalizado, resultado } = verificarFimCombate(combate);
      if (finalizado) {
        await this.finalizarCombate(roomId, resultado);
        return;
      }

      // Salvar estado atualizado no Redis
      sessao.estadoJogo = estadoJogo;
      await this.gerenciadorSessoes.atualizarSessao(roomId, sessao);

      // Emitir estado atualizado
      this.io.to(roomId).emit(COMBAT_EVENTS.COMBATE_ESTADO, {
        monstros: combate.monstros,
        jogadores: combate.jogadores,
        rodada: combate.rodadaCombate,
        log: combate.log.slice(-5),
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('❌ Erro ao processar ação de combate:', error);
    }
  }

  /**
   * Finalizar combate
   * @param {string} roomId - ID da sala
   * @param {string} resultado - 'vitoria' | 'derrota' | 'fuga'
   */
  async finalizarCombate(roomId, resultado) {
    try {
      console.log(`🏁 Finalizando combate na sala ${roomId}: ${resultado}`);

      const sessao = await this.obterSessaoHistoria(roomId);
      if (!sessao) return;

      const estadoJogo = sessao.estadoJogo || {};
      const combate = estadoJogo.combate;
      if (!combate) return;

      // Calcular XP total
      let xpTotal = 0;
      if (resultado === 'vitoria') {
        xpTotal = combate.monstros
          .filter(m => m.status === 'derrotado')
          .reduce((total, m) => total + (m.xp || 0), 0);
      }

      // Desativar combate
      combate.ativo = false;
      combate.resultado = resultado;

      sessao.estadoJogo = estadoJogo;
      await this.gerenciadorSessoes.atualizarSessao(roomId, sessao);

      console.log(`✅ Combate finalizado: ${resultado} | XP: ${xpTotal}`);

      // Persistir HP final de todos os jogadores no clone (vivos e derrotados)
      for (const [jId, jStats] of Object.entries(combate.jogadores)) {
        if (jStats.personagemId) {
          await persistirEstadoClone(roomId, jStats.personagemId, { hp_atual: jStats.hp_atual });
        }
      }

      // Persistir XP no clone da sessão (não no personagem original)
      const xpPorJogador = xpTotal > 0
        ? Math.floor(xpTotal / Math.max(1, Object.values(combate.jogadores).filter(j => j.status === 'vivo').length))
        : 0;

      if (xpTotal > 0) {
        try {
          const sessaoJogoRow = await db.SessaoJogo.findBySalaId(roomId);

          for (const [jUserId, jogadorCombate] of Object.entries(combate.jogadores)) {
            if (jogadorCombate.status !== 'vivo') continue;
            if (!jogadorCombate.personagemId) continue;

            // Tentar gravar no clone primeiro
            let gravouNoClone = false;
            if (sessaoJogoRow) {
              const clone = await db.PersonagemSessao.findBySessaoEPersonagem(
                sessaoJogoRow.id, jogadorCombate.personagemId
              );
              if (clone) {
                const xpTotalClone = (clone.xp_inicio + clone.xp_ganho) + xpPorJogador;
                let nivelAtual = clone.nivel_fim || clone.nivel_inicio;

                // Multi-level-up loop
                let xpRestante = xpTotalClone;
                let levelUp = verificarLevelUp(nivelAtual, xpRestante);
                while (levelUp.podeEvoluir) {
                  nivelAtual = levelUp.ganhos.novoNivel;
                  xpRestante = levelUp.ganhos.xpRestante;

                  this.io.to(roomId).emit('level_up', {
                    userId: jUserId,
                    personagemNome: jogadorCombate.personagemNome,
                    novoNivel: nivelAtual,
                    ganhos: levelUp.ganhos,
                    timestamp: Date.now()
                  });
                  console.log(`🎉 ${jogadorCombate.personagemNome} subiu para nivel ${nivelAtual}!`);

                  levelUp = verificarLevelUp(nivelAtual, xpRestante);
                }

                await db.PersonagemSessao.atualizarRuntime(clone.id, {
                  xp_ganho: clone.xp_ganho + xpPorJogador,
                  nivel_fim: nivelAtual
                });
                gravouNoClone = true;
              }
            }

            // Fallback: se não tem clone, gravar direto no personagem
            if (!gravouNoClone) {
              const personagem = await db.prisma.personagens.findUnique({
                where: { id: jogadorCombate.personagemId },
                select: { id: true, nivel: true, xp_atual: true, xp_proximo_nivel: true, pontos_atributo_pendentes: true }
              });
              if (!personagem) continue;

              let nivelAtual = personagem.nivel || 1;
              let xpRestante = (personagem.xp_atual || 0) + xpPorJogador;
              let pontosAtributoExtra = 0;
              let ultimoGanhos = null;

              let levelUp = verificarLevelUp(nivelAtual, xpRestante);
              while (levelUp.podeEvoluir) {
                pontosAtributoExtra += levelUp.ganhos.pontosAtributo;
                ultimoGanhos = levelUp.ganhos;
                nivelAtual = levelUp.ganhos.novoNivel;
                xpRestante = levelUp.ganhos.xpRestante;
                levelUp = verificarLevelUp(nivelAtual, xpRestante);
              }

              if (ultimoGanhos) {
                await db.prisma.personagens.update({
                  where: { id: jogadorCombate.personagemId },
                  data: {
                    xp_atual: xpRestante,
                    xp_proximo_nivel: xpParaNivel(nivelAtual),
                    nivel: nivelAtual,
                    pontos_atributo_pendentes: (personagem.pontos_atributo_pendentes || 0) + pontosAtributoExtra,
                    atualizado_em: new Date()
                  }
                });

                this.io.to(roomId).emit('level_up', {
                  userId: jUserId,
                  personagemNome: jogadorCombate.personagemNome,
                  novoNivel: nivelAtual,
                  ganhos: ultimoGanhos,
                  timestamp: Date.now()
                });
              } else {
                await db.prisma.personagens.update({
                  where: { id: jogadorCombate.personagemId },
                  data: { xp_atual: xpRestante, atualizado_em: new Date() }
                });
              }
            }
          }

          console.log(`💾 XP persistido: ${xpPorJogador} por jogador sobrevivente`);
        } catch (errXP) {
          console.error('❌ Erro ao persistir XP no banco:', errXP);
        }
      }

      // Loot automático (se vitória e monstros têm loot table)
      let lootResultado = null;
      if (resultado === 'vitoria') {
        try {
          const monstrosDerrotados = combate.monstros
            .filter(m => m.status === 'derrotado' && m.monstroId)
            .map(m => ({ monstroDbId: m.monstroId, nome: m.nome }));

          const jogadoresSobreviventes = Object.entries(combate.jogadores)
            .filter(([_, j]) => j.status === 'vivo')
            .map(([uid, j]) => ({ userId: uid, nome: j.personagemNome, personagemId: j.personagemId }));

          const nivelMedio = jogadoresSobreviventes.length > 0
            ? Math.round(Object.values(combate.jogadores)
                .filter(j => j.status === 'vivo')
                .reduce((sum, j) => sum + (j.nivel || 1), 0) / jogadoresSobreviventes.length)
            : 1;

          if (monstrosDerrotados.length > 0 && jogadoresSobreviventes.length > 0) {
            lootResultado = await rolarLootCombate(monstrosDerrotados, jogadoresSobreviventes, nivelMedio);

            if (lootResultado && lootResultado.todosItens.length > 0) {
              // Persistir loot nos clones
              const sessaoJogoRow = await db.SessaoJogo.findBySalaId(roomId);
              if (sessaoJogoRow) {
                for (const [uid, items] of Object.entries(lootResultado.lootPorJogador)) {
                  const jogadorCombate = combate.jogadores[uid];
                  if (!jogadorCombate?.personagemId) continue;
                  const clone = await db.PersonagemSessao.findBySessaoEPersonagem(
                    sessaoJogoRow.id, jogadorCombate.personagemId
                  );
                  if (clone) {
                    for (const item of items) {
                      await db.PersonagemSessao.registrarItemGanho(clone.id, {
                        equipamento_id: item.equipamento_id,
                        nome: item.nome,
                        origem: 'loot'
                      });
                    }
                  }
                }
              }

              this.io.to(roomId).emit('combate_loot', {
                lootPorJogador: lootResultado.lootPorJogador,
                todosItens: lootResultado.todosItens,
                timestamp: Date.now()
              });
            }
          }
        } catch (errLoot) {
          console.error('❌ Erro ao rolar loot:', errLoot);
        }
      }

      // Emitir evento de combate finalizado
      this.io.to(roomId).emit(COMBAT_EVENTS.COMBATE_FINALIZADO, {
        resultado,
        xpTotal,
        xpPorJogador,
        monstrosDerrotados: combate.monstros.filter(m => m.status === 'derrotado').map(m => m.nome),
        jogadoresSobreviventes: Object.entries(combate.jogadores)
          .filter(([, j]) => j.status === 'vivo')
          .map(([uid, j]) => ({ userId: uid, nome: j.personagemNome, hp_atual: j.hp_atual })),
        loot: lootResultado?.todosItens || [],
        timestamp: Date.now()
      });

      // Narrar desfecho via IA
      try {
        const mestre = await this.obterMestre(roomId, sessao.historiaTemas || [], sessao);
        const desfecho = resultado === 'vitoria'
          ? `Os monstros foram derrotados! Os jogadores ganham ${xpTotal} XP. Narre o desfecho da batalha de forma épica.`
          : resultado === 'derrota'
            ? `Os jogadores foram derrotados em combate. Narre a consequência dessa derrota de forma dramática, mas não mate os personagens.`
            : `Os jogadores fugiram do combate. Narre a fuga de forma tensa.`;

        const respostaDesfecho = await mestre.narrarAcao({
          jogador: 'Sistema',
          personagem: 'Narrador',
          acao: desfecho,
          chatHistory: sessao.mensagens || [],
          resumo: null
        });

        // Emitir narração do desfecho
        this.io.to(roomId).emit('mensagem_mestre', {
          id: Date.now().toString(),
          userId: 'mestre',
          username: 'Mestre',
          message: respostaDesfecho.narracao,
          tipo: 'mestre',
          timestamp: Date.now()
        });

        // Salvar no histórico
        sessao.mensagens = sessao.mensagens || [];
        sessao.mensagens.push({
          tipo: 'mestre',
          userId: 'mestre',
          username: 'Mestre',
          mensagem: respostaDesfecho.narracao,
          timestamp: Date.now()
        });
        await this.gerenciadorSessoes.atualizarSessao(roomId, sessao);

      } catch (errIA) {
        console.error('❌ Erro ao narrar desfecho do combate:', errIA);
      }

      // Snapshot forçado ao finalizar combate
      this._tentarSnapshot(roomId, sessao, true);

    } catch (error) {
      console.error('❌ Erro ao finalizar combate:', error);
    }
  }

  // ============================================================
  // FIM SISTEMA DE COMBATE
  // ============================================================

  async obterMestre(salaId, temas, sessao) {
    // Verificar se já existe no cache
    if (this.mestresCache.has(salaId)) {
      const cache = this.mestresCache.get(salaId);
      cache.ultimoUso = Date.now();
      console.log(`♻️ Mestre reutilizado do cache para sala ${salaId}`);
      return cache.mestre;
    }

    // Criar novo mestre
    console.log(`🆕 Criando novo Mestre para sala ${salaId}`);
    const nomesTemas = extrairNomesTemas(temas);
    
    // Formatar personagens com dados completos
    const jogadoresConectados = Array.isArray(sessao.jogadoresConectados) 
      ? sessao.jogadoresConectados 
      : Object.values(sessao.jogadores || {});
    
    const personagensFormatados = formatarPersonagensParaMestre(
      jogadoresConectados,
      sessao.personagensCompletos || {}
    );
    
    console.log(`🎭 Criando Mestre com ${personagensFormatados.length} personagens formatados`);
    
    // Construir catálogo de monstros/equipamentos/elementos para o Mestre
    let catalogo = '';
    try {
      const { buildCatalogo } = await import('../agents/Mestre/catalogo/catalogoMestre.js');
      catalogo = await buildCatalogo();
    } catch (error) {
      console.warn('⚠️ Erro ao construir catálogo para Mestre:', error.message);
    }

    const mestre = await criarMestreRPG(nomesTemas, personagensFormatados, sessao.mestreConfig || null, catalogo);

    // Limitar tamanho do cache (LRU eviction)
    const MAX_CACHE_SIZE = 30;
    if (this.mestresCache.size >= MAX_CACHE_SIZE) {
      let oldestKey = null, oldestTime = Number.POSITIVE_INFINITY;
      for (const [key, cache] of this.mestresCache.entries()) {
        if (cache.ultimoUso < oldestTime) {
          oldestTime = cache.ultimoUso;
          oldestKey = key;
        }
      }
      if (oldestKey) {
        this.mestresCache.delete(oldestKey);
        console.log(`🧹 Cache de mestre evicted (LRU): ${oldestKey}`);
      }
    }

    // Salvar no cache
    this.mestresCache.set(salaId, {
      mestre,
      criadoEm: Date.now(),
      ultimoUso: Date.now(),
      rodadaInicial: sessao?.estadoJogo?.rodadaAtual || 1
    });

    return mestre;
  }

  /**
   * Invalidar cache do Mestre (a cada 5 rodadas)
   */
  invalidarMestreSeNecessario(salaId, rodadaAtual) {
    if (!this.mestresCache.has(salaId)) return false;

    const cache = this.mestresCache.get(salaId);
    
    // Invalidar a cada 5 rodadas
    if (rodadaAtual - cache.rodadaInicial >= 5) {
      console.log(`♻️ Invalidando cache do Mestre (5 rodadas completas)`);
      this.mestresCache.delete(salaId);
      return true;
    }

    return false;
  }

  /**
   * Limpar cache de mestres antigos (> 1h sem uso)
   */
  limparCacheMestres() {
    const agora = Date.now();
    let removidos = 0;

    for (const [salaId, cache] of this.mestresCache.entries()) {
      if (agora - cache.ultimoUso > 3600000) { // 1 hora
        this.mestresCache.delete(salaId);
        removidos++;
      }
    }

    if (removidos > 0) {
      console.log(`🧹 Removidos ${removidos} mestres inativos do cache`);
    }
  }

  /**
   * Limpeza completa de uma sessao: mestresCache, roomUsers, snapshotCounters, sockets
   * Usado ao encerrar sessao via admin
   */
  limparSessaoCompleta(salaId, recapData = {}) {
    // 1. Limpar cache de mestres
    if (this.mestresCache) {
      this.mestresCache.delete(salaId);
    }

    // 2. Limpar contador de snapshots
    if (this._snapshotCounters) {
      this._snapshotCounters.delete(salaId);
    }

    // 3. Emitir evento e forcar todos os sockets a sairem da room
    if (this.io) {
      this.io.to(salaId).emit('sessao_encerrada', {
        salaId,
        motivo: 'Sessão encerrada pelo administrador',
        timestamp: Date.now(),
        resumo: recapData.resumo || null,
        historiaNome: recapData.historiaNome || null,
        xpGanho: recapData.xpGanho || 0,
        loot: recapData.loot || []
      });

      const room = this.io.sockets.adapter.rooms.get(salaId);
      if (room) {
        for (const socketId of room) {
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.leave(salaId);
          }
        }
      }
    }

    // 4. Limpar roomUsers
    if (this.roomUsers) {
      this.roomUsers.delete(salaId);
    }

    console.log(`🧹 Sessão ${salaId} limpa completamente (cache, room, sockets)`);
  }

  /**
   * Fechar conexões
   */
  async close() {
    // Clear interval timer
    if (this._cacheCleaner) {
      clearInterval(this._cacheCleaner);
      this._cacheCleaner = null;
    }

    // Clear all disconnect grace period timers
    for (const [userId, timer] of this._disconnectTimers.entries()) {
      clearTimeout(timer);
    }
    this._disconnectTimers.clear();

    // Clear in-memory caches
    this.connectedUsers.clear();
    this.roomUsers.clear();
    this.mestresCache.clear();

    // Close Redis connection
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch (error) {
        console.error('Erro ao fechar Redis do WebSocket:', error.message);
      }
    }

    // Close Socket.IO
    if (this.io) {
      this.io.close();
    }
  }
}

export default new SocketManager(); 