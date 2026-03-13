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
  gerarInstanciasCombate,
  formatarContextoCombate,
  calcularMana,
  resolverMecanicaCombate,
  formatarResultadoMecanico
} from '../helpers/combateHelper.js';
import { COMBAT_EVENTS } from './events/eventTypes.js';
import sessaoSnapshotService from '../services/sessaoSnapshot.js';
import { verificarLevelUp, xpParaNivel } from '../helpers/evolucaoHelper.js';
import { rolarLootCombate } from '../helpers/lootHelper.js';
import { persistirEstadoClone } from '../helpers/acoesProcessor.js';
import analyticsService from '../services/analyticsService.js';
import { MESTRE_CONFIG } from '../agents/Mestre/config.js';
import ttsCacheService from '../services/ttsCacheService.js';
import { getDefaultProviderName } from '../services/ttsService.js';
import { aggregateNarrationFromSegments, resolveNarrationSegments } from '../services/narrationSegmentsService.js';
import { buildTurnState, formatTurnStateText } from '../helpers/turnStateBuilder.js';
import { isEnabled } from '../config/featureFlags.js';
import { decrementCooldowns } from '../helpers/cooldownManager.js';
import { decrementConcentracao } from '../helpers/concentrationManager.js';
import { decrementEfeitos, aplicarEfeitosPorTurno } from '../helpers/effectManager.js';
import {
  applyMetadadosToSessao,
  applyResumoToSessao,
  buildMestreContext,
  getCompactacaoState,
  prepareMestrePayload
} from '../agents/Mestre/contexto/mestreContextBuilder.js';
import {
  buildTurnEventPayload,
  getTurnState,
  resetTurnInteractions,
  transitionTurnState,
  TURN_STATUS
} from './utils/turnStateMachine.js';
import {
  compactarTestesPendentes,
  criarTestesPendentes,
  emitirSolicitacaoTeste,
  getTestesPendentes,
  hasPendingTests,
  getTestePendente,
  limparTestePendente,
  resolverTestePendente
} from './utils/testePipeline.js';
import {
  buildDiceResolutionContext,
  buildNarracaoContext,
  buildTurnStartContext
} from '../agents/Mestre/contexto/mestreInvocationContext.js';
import {
  appendMensagemSessao,
  buildDadoMensagem,
  buildEntreRodadasMensagem,
  buildJogadorMensagem,
  buildMestreMensagem as buildMestreMensagemHistorico,
  buildOrdemDefinidaMensagem,
  buildResultadoDadoInicialMensagem,
  buildResultadoTesteMensagem,
  buildRoleplayMensagem,
  buildSolicitacaoDadosMensagem,
  buildTransicaoTurnoMensagem,
  buildAcaoMestreMensagem,
  createMessageId
} from './utils/sessionMessages.js';
import SessionEventBus from './sessionEventBus.js';
import RoomGateway from './gateways/roomGateway.js';
import TurnEngine from './engines/turnEngine.js';
import TestEngine from './engines/testEngine.js';

const DEFAULT_TTS_PROVIDER = getDefaultProviderName();

/**
 * Cria objeto de mensagem do mestre com campos de áudio vinculados
 */
function buildMestreMensagem(conteudo, mestreConfig = null, options = {}) {
  const narrativaBase = String(conteudo || '').trim();
  const segmentos = resolveNarrationSegments({
    narrativa: narrativaBase,
    segmentos: options.segmentos || [],
    mestreConfig,
    roteiro: options.roteiro || options.sessao?.historiaRoteiro || null,
    historiaId: options.historiaId || options.sessao?.historiaId || null
  });
  const narrativaFinal = narrativaBase || aggregateNarrationFromSegments(segmentos);
  const voiceId = mestreConfig?.voice_id || null;
  const voiceProvider = mestreConfig?.voice_provider || null;

  return buildMestreMensagemHistorico(narrativaFinal, mestreConfig, {
    ...options,
    segmentos,
    audioCacheKey: voiceId ? ttsCacheService.generateCacheKey(narrativaFinal, voiceId, voiceProvider || DEFAULT_TTS_PROVIDER) : null
  });
}

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
    this._roundTimers = new Map(); // roomId -> setTimeout ID (timer entre rodadas)
    this.eventBus = new SessionEventBus(this);
    this.roomGateway = new RoomGateway(this);
    this.turnEngine = new TurnEngine(this);
    this.testEngine = new TestEngine(this);
  }

  /**
   * Mutex por sala - garante que apenas uma operação por vez modifique a sessão
   * Previne race conditions quando múltiplos jogadores agem simultaneamente
   */
  async withRoomLock(roomId, fn) {
    // Esperar lock anterior terminar (max 15s para evitar deadlock)
    const maxWait = Date.now() + 15000;
    while (this._roomLocks.has(roomId)) {
      if (Date.now() > maxWait) {
        console.error(`❌ withRoomLock: timeout esperando lock da sala ${roomId}. Rejeitando operação.`);
        throw new Error('Operação em andamento na sala. Tente novamente em alguns segundos.');
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
      resolve();
      this._roomLocks.delete(roomId);
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

  emitirEstadoTurno(roomId, sessao) {
    if (!this.io || !roomId || !sessao) return;
    this.io.to(roomId).emit('turno_estado_atualizado', {
      roomId,
      ...buildTurnEventPayload(sessao),
      timestamp: Date.now()
    });
  }

  emitirAcaoMestrePersistida(roomId, sessao, payload) {
    const mensagem = buildAcaoMestreMensagem(payload);
    appendMensagemSessao(sessao, mensagem);
    this.io.to(roomId).emit('acao_mestre', {
      ...payload,
      id: mensagem.id,
      message: mensagem.message,
      mensagem: mensagem.message,
      payload: mensagem.payload
    });
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
        if (![
          'authenticate',
          'join_room',
          'leave_room',
          'chat_message',
          'mensagem_para_mestre',
          'mensagem_roleplay',
          'rpg_action',
          'dice_roll',
          'rolar_dado_inicial',
          'iniciar_turno',
          'solicitar_dados',
          'status_update',
          'disconnect'
        ].includes(eventName)) {
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
    return this.roomGateway.handleJoinRoom(socket, data);
  }
  /**
   * Handler para sair da sala
   */
  async handleLeaveRoom(socket, data) {
    return this.roomGateway.handleLeaveRoom(socket, data);
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
    return this.testEngine.handleDiceRoll(socket, data);
  }
  /**
   * Handler para rolagem de dado inicial (d20) para definir ordem de jogadores
   */
  async handleRolarDadoInicial(socket, data) {
    return this.testEngine.handleRolarDadoInicial(socket, data);
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
      if (getTestePendente(sessao)) {
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

        transitionTurnState(sessao, TURN_STATUS.ACTIVE, {
          jogadorAtual: String(userId),
          rodadaAtual: estadoJogo.rodadaAtual || 1,
          lockReason: null
        });
      }

      // 3. Obter histórico de mensagens
      const invocationContext = buildNarracaoContext(sessao);
      const historico = invocationContext.chatHistory;
      const resumoMaisRecente = invocationContext.resumo ? { resumo: invocationContext.resumo } : null;

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
        sessao,
        userId
      );

      // 4. Início de turno: decrementar cooldowns, efeitos, concentração
      if (isEnabled('EXPANDED_STATE')) {
        decrementCooldowns(sessao, userId);
        const pcId = String(personagem.id || personagem.personagemId);
        const efeitosExpirados = decrementEfeitos(sessao, pcId);
        const efeitosTurno = aplicarEfeitosPorTurno(sessao, pcId);
        const concExpirada = decrementConcentracao(sessao, userId);

        if (efeitosExpirados.length > 0) {
          this.emitirAcaoMestrePersistida(roomId, sessao, {
            tipo: 'efeitos_expirados', personagem: personagem.nome,
            efeitos: efeitosExpirados.map(e => e.nome), timestamp: Date.now()
          });
        }
        if (concExpirada) {
          this.emitirAcaoMestrePersistida(roomId, sessao, {
            tipo: 'concentracao_quebrada', personagem: personagem.nome,
            magia: concExpirada.nome, motivo: 'expirou', timestamp: Date.now()
          });
        }
      }

      // Injetar contexto dinâmico do personagem + combate na ação
      let acaoComContexto = '';

      // Estado dinâmico do personagem (via turnStateBuilder)
      const turnState = buildTurnState(sessao, userId, personagem);
      acaoComContexto = formatTurnStateText(turnState) + '\n';

      const combateAtivo = estadoJogo.combate?.ativo;
      let resultadosCombatePreResolvido = null;
      if (combateAtivo) {
        // Contexto ANTES da resolução (estado atual dos monstros/jogadores)
        const contextoCombate = formatarContextoCombate(estadoJogo.combate, userId);
        acaoComContexto += `${contextoCombate}\n`;

        // ✅ Resolver mecânica ANTES da IA para que ela narre baseada em fatos
        resultadosCombatePreResolvido = resolverMecanicaCombate(estadoJogo.combate, userId, sessao, personagem);
        const resumoMecanico = formatarResultadoMecanico(resultadosCombatePreResolvido, personagem.nome);
        acaoComContexto += resumoMecanico + '\n';

        // Guardar para o processarAcaoCombate usar (sem re-rolar)
        sessao._combatePreResolvido = resultadosCombatePreResolvido;

        this.log('INFO', 'MENSAGEM_PARA_MESTRE_COMBATE_CONTEXTO', socket.id, userId, {
          roomId,
          monstrosVivos: estadoJogo.combate.monstros.filter(m => m.status === 'vivo').length,
          preResolvido: true
        });
      }

      const contextoRoleplayLateral = invocationContext.contextoLateralRoleplay;
      if (contextoRoleplayLateral) {
        acaoComContexto += `${contextoRoleplayLateral}\n`;
      }

      acaoComContexto += `Ação do jogador: "${mensagem}"`;

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
      const mensagemJogador = buildJogadorMensagem({
        userId,
        username,
        personagem: personagem.nome,
        message: mensagem,
        origem: combateAtivo ? 'combate' : 'turno'
      });
      appendMensagemSessao(sessao, mensagemJogador);

      // 6. Salvar resposta do mestre na sessão
      const mensagemMestre = buildMestreMensagem(resposta.narracao, sessao.mestreConfig, {
        sessao,
        segmentos: resposta.segmentos || []
      });
      appendMensagemSessao(sessao, mensagemMestre);
      await this.aplicarMetadadosNarrativos(roomId, sessao, resposta.metadados || {});

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
        ...mensagemJogador,
        message: mensagemJogador.message
      });

      // 9. Enviar resposta do mestre para todos na sala
      this.io.to(roomId).emit('mensagem_mestre', {
        ...mensagemMestre,
        message: resposta.narracao
      });

      // ✅ DESPACHAR RESPOSTA DA IA (combate, ações, dados, turnos)
      const { despacharResposta } = await import('./utils/respostaDispatcher.js');
      await despacharResposta(resposta, {
        roomId, userId, username, personagem, mensagem, sessao,
        socket, io: this.io, sm: this, fase, combateAtivo
      });
      this.emitirEstadoTurno(roomId, sessao);

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

      await this.withRoomLock(roomId, async () => {
        const sessao = await this.obterSessaoHistoria(roomId);
        if (!sessao) {
          this.log('ERROR', 'MENSAGEM_ROLEPLAY_SESSAO_NOT_FOUND', socket.id, userId, {
            roomId
          });
          socket.emit('error', { message: 'Sessão não encontrada' });
          return;
        }

        const estadoJogo = sessao.estadoJogo || {};
        const cooldownRoleplay = estadoJogo.cooldownRoleplay || {};
        const ultimoEnvio = cooldownRoleplay[userId];
        const agora = Date.now();
        const cooldownSegundos = 12;
        const restante = ultimoEnvio
          ? Math.max(0, cooldownSegundos - Math.floor((agora - new Date(ultimoEnvio).getTime()) / 1000))
          : 0;

        if (restante > 0) {
          this.log('WARN', 'MENSAGEM_ROLEPLAY_COOLDOWN_ATIVO', socket.id, userId, {
            roomId,
            cooldownRestante: restante
          });
          socket.emit('erro_cooldown_roleplay', {
            message: `Aguarde ${restante} segundos antes de enviar outra mensagem roleplay`,
            segundosRestantes: restante
          });
          return;
        }

        cooldownRoleplay[userId] = new Date(agora).toISOString();
        estadoJogo.cooldownRoleplay = cooldownRoleplay;
        sessao.estadoJogo = estadoJogo;

        const mensagemRoleplay = buildRoleplayMensagem({
          userId,
          username,
          message: mensagem,
          payload: {
            cena: estadoJogo.turno?.rodadaAtual || estadoJogo.rodadaAtual || 1
          }
        });

        appendMensagemSessao(sessao, mensagemRoleplay);
        sessao.roleplayRecente = [...(sessao.roleplayRecente || []), mensagemRoleplay].slice(-20);

        await this.gerenciadorSessoes.atualizarSessao(roomId, sessao);

        this.log('SUCCESS', 'MENSAGEM_ROLEPLAY_SALVA', socket.id, userId, {
          roomId,
          totalMensagens: sessao.mensagens.length
        });

        this.io.to(roomId).emit('mensagem_roleplay', {
          ...mensagemRoleplay,
          message: mensagemRoleplay.message
        });
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
    return this.turnEngine.handleIniciarTurno(socket, data);
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

      await this.withRoomLock(String(roomId), async () => {
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
        sessao,
        socket.userId
      );

      this.log('INFO', 'SOLICITAR_DADOS_GERANDO_NARRATIVA', socket.id, socket.userId, {
        motivo,
        tipoTeste: tipoTeste || 'd20'
      });

      const invocationContext = buildNarracaoContext(sessao);
      const solicitacao = await mestre.solicitarRolagemDados({
        motivo,
        tipoTeste: tipoTeste || 'd20',
        dificuldade: dificuldade || 'Média',
        jogadores: jogadores || [],
        chatHistory: invocationContext.chatHistory,
        resumo: invocationContext.resumo,
        contextoLateralRoleplay: invocationContext.contextoLateralRoleplay
      });

      this.log('SUCCESS', 'SOLICITAR_DADOS_NARRATIVA_GERADA', socket.id, socket.userId, {
        narrativaLength: solicitacao.narrativa?.length || 0
      });

      // Salvar mensagem do Mestre no Redis
      const mensagemSolicitacaoDetalhada = buildSolicitacaoDadosMensagem({
        narrativa: solicitacao.narrativa,
        origem: 'manual',
        payload: {
          motivo,
          tipoTeste: solicitacao.tipoTeste || tipoTeste || 'd20',
          dificuldade: solicitacao.dificuldade || dificuldade || 'Média'
        }
      });

      const turnoAtual = getTurnState(sessao);
      const jogadorPadrao = turnoAtual.jogadorAtual || socket.userId;
      const jogadoresAlvo = Array.isArray(jogadores) && jogadores.length > 0
        ? jogadores
        : [{ userId: jogadorPadrao, id: jogadorPadrao }];
      const testesCriados = criarTestesPendentes(
        sessao,
        jogadoresAlvo.map((jogador) => {
          const alvoUserId = String(jogador?.userId || jogador?.id || jogadorPadrao);
          const jogadorSessao = sessao.jogadores?.[alvoUserId] || {};
          return {
            origem: 'manual',
            jogadorAlvo: alvoUserId,
            personagemAlvo: jogador?.personagemId || jogadorSessao.personagemId || null,
            teste: motivo,
            dificuldade: solicitacao.dificuldade || dificuldade || 'Media',
            tipoDado: solicitacao.tipoTeste || tipoTeste || 'd20',
            contexto: motivo
          };
        }),
        socket.userId
      );

      mensagemSolicitacaoDetalhada.payload = {
        ...(mensagemSolicitacaoDetalhada.payload || {}),
        groupId: testesCriados[0]?.groupId || null,
        motivo,
        tipoTeste: solicitacao.tipoTeste || tipoTeste || 'd20',
        dificuldade: solicitacao.dificuldade || dificuldade || 'Media',
        testesPendentes: testesCriados
      };
      appendMensagemSessao(sessao, mensagemSolicitacaoDetalhada);

      await this.gerenciadorSessoes.atualizarSessao(roomId, sessao);
      this.emitirEstadoTurno(roomId, sessao);

      this.log('SUCCESS', 'SOLICITAR_DADOS_SESSAO_UPDATED', socket.id, socket.userId, {
        roomId
      });

      // Emitir para todos na sala
      emitirSolicitacaoTeste(this.io, roomId, sessao, {
        narrativa: solicitacao.narrativa,
        tipoDado: solicitacao.tipoTeste,
        teste: motivo,
        dificuldade: solicitacao.dificuldade,
        contexto: motivo,
        testesPendentes: testesCriados
      });
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
    this.eventBus.emitToRoom(roomId, event, data);
  }

  /**
   * Enviar mensagem para usuário específico
   */
  sendToUser(userId, event, data) {
    this.eventBus.emitToUser(userId, event, data);
  }

  async aplicarMetadadosNarrativos(roomId, sessao, metadados = {}) {
    if (!sessao || !metadados || Object.keys(metadados).length === 0) {
      return sessao;
    }

    let historia = null;
    if (sessao.historiaId) {
      try {
        historia = await db.Historia.findById(parseInt(sessao.historiaId));
      } catch (error) {
        console.warn(`⚠️ Erro ao buscar história ${sessao.historiaId} para metadados:`, error.message);
      }
    }

    return applyMetadadosToSessao(sessao, metadados, historia);
  }

  async executarCompactacaoSeNecessaria(roomId, sessao, options = {}) {
    if (!sessao) return sessao;

    const estadoJogo = sessao.estadoJogo || {};
    const compactacao = getCompactacaoState(estadoJogo, sessao.mensagens || []);
    const totalMensagens = (sessao.mensagens || []).length;
    const mensagensCanonicas = (sessao.mensagens || []).filter((mensagem) => {
      const canal = mensagem?.canal || 'formal';
      const tipo = mensagem?.tipo || mensagem?.type;
      return canal !== 'roleplay' && tipo !== 'roleplay';
    });
    const totalMensagensCanonicas = mensagensCanonicas.length;
    const rodadaAtual = estadoJogo.rodadaAtual || 0;
    const deveCompactarPorMensagens = totalMensagensCanonicas - compactacao.ultimoIndiceCanonicoCompactado >= 30;
    const deveCompactarPorRodada = !!options.forceRound && rodadaAtual > compactacao.ultimaRodadaCompactada;

    if (!deveCompactarPorMensagens && !deveCompactarPorRodada && !options.force) {
      return sessao;
    }

    try {
      let mensagensParaResumo = [];
      if (compactacao.ultimaMensagemCompactadaId) {
        const indiceUltima = mensagensCanonicas.findIndex(
          (mensagem) => String(mensagem?.id) === String(compactacao.ultimaMensagemCompactadaId)
        );
        if (indiceUltima >= 0) {
          mensagensParaResumo = mensagensCanonicas.slice(indiceUltima + 1);
        }
      }
      if (!mensagensParaResumo.length && compactacao.ultimoIndiceCanonicoCompactado > 0) {
        mensagensParaResumo = mensagensCanonicas.slice(
          Math.min(compactacao.ultimoIndiceCanonicoCompactado, mensagensCanonicas.length)
        );
      }
      if (!mensagensParaResumo.length && (options.force || deveCompactarPorRodada)) {
        mensagensParaResumo = mensagensCanonicas.slice(-50);
      }
      if (!mensagensParaResumo.length) {
        return sessao;
      }

      const resumoAgent = (await import('../agents/Resumo/index.js')).default;
      const resumoAnteriorObj = await this.gerenciadorSessoes.obterUltimoResumo(roomId);
      const resumo = await resumoAgent.resumirAventura({
        mensagens: mensagensParaResumo,
        temas: extrairNomesTemas(sessao.historiaTemas || []),
        personagens: Object.values(sessao.jogadores || {}),
        rodadasJogadas: rodadaAtual,
        resumoAnterior: resumoAnteriorObj?.resumo || null,
        userId: options.userId || null
      });

      let novaProgressao = estadoJogo.progressao || null;
      if (sessao.historiaRoteiro) {
        try {
          const { atualizarProgressao } = await import('../agents/Mestre/prompts/roteiroCondenser.js');
          novaProgressao = await atualizarProgressao(
            sessao.historiaRoteiro,
            resumo.resumo,
            estadoJogo.progressao || null,
            options.userId || null
          );
        } catch (error) {
          console.warn('⚠️ Erro ao atualizar progressão na compactação:', error.message);
        }
      }

      let historia = null;
      if (sessao.historiaId) {
        try {
          historia = await db.Historia.findById(parseInt(sessao.historiaId));
        } catch (error) {
          console.warn(`⚠️ Erro ao carregar história ${sessao.historiaId} para compactação:`, error.message);
        }
      }

      const sessaoComResumo = applyResumoToSessao(sessao, resumo, historia, novaProgressao);
      sessaoComResumo.estadoJogo = sessaoComResumo.estadoJogo || {};
      const ultimaMensagemCanonica = mensagensCanonicas[mensagensCanonicas.length - 1] || null;
      sessaoComResumo.estadoJogo.compactacao = {
        ultimaMensagemIndex: totalMensagens,
        ultimaMensagemCompactadaId: ultimaMensagemCanonica?.id || compactacao.ultimaMensagemCompactadaId || null,
        ultimoIndiceCanonicoCompactado: totalMensagensCanonicas,
        totalMensagensCanonicas,
        ultimaRodadaCompactada: deveCompactarPorRodada ? rodadaAtual : compactacao.ultimaRodadaCompactada,
        ultimaCompactacaoEm: new Date().toISOString()
      };
      if (novaProgressao) {
        sessaoComResumo.estadoJogo.progressao = novaProgressao;
      }
      sessaoComResumo.resumos = [...(sessao.resumos || []), resumo].slice(-2);
      sessaoComResumo.ultimoResumoRodada = rodadaAtual;
      sessaoComResumo.ultimoResumoMensagens = totalMensagens;
      if ((sessaoComResumo.mensagens || []).length > 200) {
        sessaoComResumo.mensagens = sessaoComResumo.mensagens.slice(-200);
      }
      await this.gerenciadorSessoes.atualizarSessao(roomId, sessaoComResumo);

      this.mestresCache.delete(roomId);
      this._tentarSnapshot(roomId, sessaoComResumo, true);

      return sessaoComResumo;
    } catch (error) {
      console.error(`❌ Erro ao compactar contexto da sala ${roomId}:`, error);
      return sessao;
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
        max_tokens: historia.mestres.max_tokens,
        voice_id: historia.mestres.voice_id || null,
        voice_provider: historia.mestres.voice_provider || null
      } : null;

      // Criar dados da sessão
      const dadosSessao = {
        historiaId: historia.id,
        historiaNome: historia.nome,
        historiaTemas: temasCompletos, // Salvar temas completos (id + nome)
        historiaPrologo: historia.prologo || '',
        historiaRoteiro: historia.roteiro || null,
        donoId: historia.id_usuario ? String(historia.id_usuario) : null,
        donoNome: donoNome,
        maxJogadores: historia.maximo_de_participantes || 5,
        mestreConfig, // Config do mestre atribuido a historia
        status: 'aberta', // Status inicial (sessão criada mas ninguém entrou)
        statusJogo: null, // ✅ NOVO: null = ninguém entrou ainda
        jogadoresConectados: [], // Lista vazia inicialmente
        estadoJogo: {
          fase: 'aguardando_inicio',
          cenaAtual: 'Aguardando início',
          mensagemMestre: `Bem-vindos à história "${historia.nome}"!`,
          npcs: [],
          ambiente: 'Sala de espera',
          turno: {
            status: 'idle',
            jogadorAtual: null,
            rodadaAtual: 1,
            contadorInteracoes: 0,
            iniciadoEm: null,
            lockReason: null
          },
          testePendente: null,
          compactacao: {
            ultimaMensagemIndex: 0,
            ultimaRodadaCompactada: 0,
            ultimaCompactacaoEm: null
          }
        },
        mensagens: [],
        acoes: []
      };

      // Criar sessão no Redis
      dadosSessao.mestreContexto = buildMestreContext(dadosSessao, historia);
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
      analyticsService.track('sessao_inicio', { salaId, totalJogadores: dados.totalJogadores });
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

      // Emitir prólogo pendente (gerado no /jogo/start, adiado até após rolagem de dados)
      const prologoPendente = estadoJogo.prologoPendente;
      if (prologoPendente) {
        const prologoTimestamp = Date.now();

        // Salvar na sessao.mensagens
        const msgPrologo = buildMestreMensagem(prologoPendente, sessao.mestreConfig, { sessao });
        msgPrologo.timestamp = prologoTimestamp;
        appendMensagemSessao(sessao, msgPrologo);

        // Limpar flag
        delete estadoJogo.prologoPendente;
        sessao.estadoJogo = estadoJogo;
        await this.gerenciadorSessoes.atualizarSessao(roomId, sessao);

        // Emitir para todos os jogadores
        this.io.to(roomId).emit('mensagem_mestre', {
          id: prologoTimestamp.toString(),
          ...msgPrologo,
          message: prologoPendente
        });
        console.log(`📜 Prólogo emitido após rolagem de dados para sala ${roomId}`);
      }

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

      console.log(`✅ Primeiro turno iniciado com ${primeiroJogador.username}`);

      // Snapshot forçado após transição de fase (evita perda se Redis expirar)
      const sessaoFinal = await this.obterSessaoHistoria(roomId);
      if (sessaoFinal) this._tentarSnapshot(roomId, sessaoFinal, true);
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
        resetTurnInteractions(sessao);
        transitionTurnState(sessao, TURN_STATUS.IDLE, {
          jogadorAtual: null,
          lockReason: null
        });
        // Tick down status effects fora de combate (solo)
        if (!estadoJogo.combate?.ativo) {
          for (const [pId, pCompleto] of Object.entries(sessao.personagensCompletos || {})) {
            if (!pCompleto.status_efeitos || pCompleto.status_efeitos.length === 0) continue;
            pCompleto.status_efeitos = pCompleto.status_efeitos.filter(e => {
              e.duracao = (e.duracao || 1) - 1;
              if (e.duracao <= 0) {
                this.emitirAcaoMestrePersistida(roomId, sessao, {
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
        this.emitirEstadoTurno(roomId, sessao);
        return;
      }

      resetTurnInteractions(sessao);
      transitionTurnState(sessao, TURN_STATUS.IDLE, {
        jogadorAtual: null,
        lockReason: null
      });

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
              this.emitirAcaoMestrePersistida(roomId, sessao, {
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
      const mensagemTransicao = buildTransicaoTurnoMensagem(
        `🏁 Turno de ${jogadorAnterior?.username || 'jogador'} finalizado. Vez de ${proximoJogador.username}!`,
        {
          jogadorAnterior: jogadorAnterior?.userId || null,
          proximoJogador: proximoJogador?.userId || null,
          rodadaAtual: estadoJogo.rodadaAtual || 1
        }
      );
      appendMensagemSessao(sessao, mensagemTransicao);

      // ✅ 2. ATUALIZAR ESTADO DO JOGO (avançar turno)
      estadoJogo.turnoAtual = proximoTurno;
      transitionTurnState(sessao, TURN_STATUS.IDLE, {
        jogadorAtual: null,
        rodadaAtual: estadoJogo.rodadaAtual || 1,
        contadorInteracoes: 0,
        lockReason: null
      });
      sessao.estadoJogo = estadoJogo;
      
      // ✅ 3. SALVAR TUDO DE UMA VEZ NO REDIS
      await this.gerenciadorSessoes.atualizarSessao(roomId, sessao);
      this.emitirEstadoTurno(roomId, sessao);

      console.log(`💾 Turno ${proximoTurno} e mensagem de transição salvos no Redis`);

      // ✅ 3.5. EMITIR MENSAGEM DE TRANSIÇÃO EM TEMPO REAL
      this.io.to(roomId).emit('chat_message', {
        ...mensagemTransicao,
        message: mensagemTransicao.message
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
    return this.turnEngine.finalizarRodada(roomId);
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
          const manaMax = calcularMana({ inteligencia: attrs.inteligencia || 10, nivel: p.nivel || 1 });
          jogadoresCombate[jUserId] = {
            personagemId: parseInt(pId),
            hp_max: hpMax,
            hp_atual: hpAtual,
            mana_max: manaMax,
            mana_atual: (p.mana_atual != null && p.mana_atual < manaMax) ? p.mana_atual : manaMax,
            esquiva: calcularEsquiva(personagemStats, bonusEquip),
            armadura: calcularArmadura(bonusEquip),
            bonusAtaque: bonusEquip.ataque || 0,
            bonusDano: bonusEquip.dano || 0,
            dano_base: p.melhorArma || null,
            elemento: p.elementoArma || null,
            status: 'vivo',
            personagemNome: p.nome || jogador.username,
            cooldowns: {}
          };
        } else {
          jogadoresCombate[jUserId] = {
            personagemId: parseInt(pId) || null,
            hp_max: 15,
            hp_atual: 15,
            mana_max: 10,
            mana_atual: 10,
            esquiva: 5,
            armadura: 0,
            bonusAtaque: 0,
            bonusDano: 0,
            dano_base: null,
            status: 'vivo',
            personagemNome: jogador.username || 'Jogador',
            cooldowns: {}
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

      // ✅ Usar resultados pré-resolvidos (mecânica já foi computada ANTES da IA narrar)
      const r = sessao._combatePreResolvido;
      if (!r) {
        console.warn('⚠️ processarAcaoCombate: sem resultados pré-resolvidos, pulando');
        return;
      }
      delete sessao._combatePreResolvido;

      // Jogador derrotado
      if (r.jogadorDerrotado) {
        this.io.to(roomId).emit('server_message', {
          userId,
          mensagem: `💀 ${personagem.nome} foi derrotado e não pode agir neste combate.`
        });
        return;
      }

      // --- EMITIR EVENTOS DE STATUS EFFECTS ---
      for (const se of r.statusEfeitos) {
        if (se.tipo === 'impedido') {
          this.io.to(roomId).emit(COMBAT_EVENTS.COMBATE_RESULTADO_ACAO, {
            tipo: 'status_efeito', personagem: se.personagem, userId: se.userId,
            status: se.efeito, mensagem: `${se.personagem} está ${se.efeito} e não pode agir!`,
            timestamp: Date.now()
          });
        } else if (se.tipo === 'dano') {
          this.io.to(roomId).emit(COMBAT_EVENTS.COMBATE_RESULTADO_ACAO, {
            tipo: 'status_dano', alvo: { userId: se.userId, nome: se.personagem },
            status: se.efeito, dano: se.dano, hpRestante: se.hpRestante, hpMax: se.hpMax,
            timestamp: Date.now()
          });
          this.io.to(roomId).emit(COMBAT_EVENTS.COMBATE_JOGADOR_FERIDO, {
            userId: se.userId, nome: se.personagem,
            hp_atual: se.hpRestante, hp_max: se.hpMax,
            derrotado: se.derrotado, fonte: se.efeito, timestamp: Date.now()
          });
          if (se.personagemId) {
            await persistirEstadoClone(roomId, se.personagemId, { hp_atual: se.hpRestante });
          }
        }
      }

      // --- EMITIR RESULTADO DO ATAQUE DO JOGADOR ---
      const atk = r.ataqueJogador;
      if (atk) {
        this.io.to(roomId).emit(COMBAT_EVENTS.COMBATE_RESULTADO_ACAO, {
          tipo: 'ataque_jogador',
          atacante: { userId: atk.userId, nome: atk.atacante },
          alvo: { id: atk.alvoId, nome: atk.alvo },
          rolagem: atk.rolagem, bonus: atk.bonus,
          acertou: atk.acertou, esquivou: atk.esquivou, critico: atk.critico,
          dano: atk.dano, armaduraAlvo: atk.armaduraAlvo,
          hpRestante: atk.hpRestante, hpMax: atk.hpMax,
          timestamp: Date.now()
        });

        if (atk.derrotado) {
          this.io.to(roomId).emit(COMBAT_EVENTS.COMBATE_MONSTRO_DERROTADO, {
            monstro: { id: atk.alvoId, nome: atk.alvo },
            xp: atk.xp, timestamp: Date.now()
          });
        }
      }

      // --- EMITIR CONTRA-ATAQUES DOS MONSTROS ---
      for (const ca of r.contraAtaques) {
        this.io.to(roomId).emit(COMBAT_EVENTS.COMBATE_RESULTADO_ACAO, {
          tipo: 'ataque_monstro',
          atacante: { id: ca.atacanteId, nome: ca.atacante },
          alvo: { userId: ca.alvoId, nome: ca.alvoNome },
          habilidade: ca.habilidade,
          rolagem: ca.rolagem,
          acertou: ca.acertou, esquivou: ca.esquivou, critico: ca.critico,
          dano: ca.dano, armaduraAlvo: ca.armaduraAlvo,
          hpRestante: ca.hpRestante, hpMax: ca.hpMax,
          timestamp: Date.now()
        });

        if (ca.acertou && ca.dano > 0) {
          this.io.to(roomId).emit(COMBAT_EVENTS.COMBATE_JOGADOR_FERIDO, {
            userId: ca.alvoId, nome: ca.alvoNome,
            hp_atual: ca.hpRestante, hp_max: ca.hpMax,
            derrotado: ca.inconsciente || false,
            timestamp: Date.now()
          });
        }

        // Persistir HP no clone
        if (ca.personagemId && ca.dano > 0) {
          await persistirEstadoClone(roomId, ca.personagemId, { hp_atual: ca.hpRestante });
        }
      }

      // --- EMITIR STATUS REMOVIDOS ---
      for (const sr of r.statusRemovidos) {
        this.emitirAcaoMestrePersistida(roomId, sessao, {
          tipo: 'status_removido', personagem: sr.personagem,
          userId: sr.userId, status: sr.status, timestamp: Date.now()
        });
        if (sr.personagemId) {
          const pCompleto = Object.values(sessao.personagensCompletos || {}).find(p => p.nome === sr.personagem);
          if (pCompleto) {
            await persistirEstadoClone(roomId, sr.personagemId, { status_efeitos: pCompleto.status_efeitos });
          }
        }
      }

      if (r.rodadaAvancou) {
        console.log(`🔄 Combate rodada ${combate.rodadaCombate} na sala ${roomId}`);
      }

      // Verificar fim de combate
      if (r.combateFinalizado) {
        await this.finalizarCombate(roomId, r.resultadoCombate);
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

                  // Post automático no feed
                  db.FeedPost.createAutoEvent(parseInt(jUserId), 'level_up', { personagem: jogadorCombate.personagemNome, nivel: nivelAtual }, 'personagem', jogadorCombate.personagemId).catch(() => {});

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

                // Post automático no feed
                db.FeedPost.createAutoEvent(parseInt(jUserId), 'level_up', { personagem: jogadorCombate.personagemNome, nivel: nivelAtual }, 'personagem', jogadorCombate.personagemId).catch(() => {});
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
      const monstrosDerrotados = combate.monstros.filter(m => m.status === 'derrotado').map(m => m.nome);
      this.io.to(roomId).emit(COMBAT_EVENTS.COMBATE_FINALIZADO, {
        resultado,
        xpTotal,
        xpPorJogador,
        monstrosDerrotados,
        jogadoresSobreviventes: Object.entries(combate.jogadores)
          .filter(([, j]) => j.status === 'vivo')
          .map(([uid, j]) => ({ userId: uid, nome: j.personagemNome, hp_atual: j.hp_atual })),
        loot: lootResultado?.todosItens || [],
        timestamp: Date.now()
      });

      // Posts automáticos no feed para sobreviventes
      if (resultado === 'vitoria') {
        for (const [uid, j] of Object.entries(combate.jogadores)) {
          if (j.status === 'vivo') {
            db.FeedPost.createAutoEvent(parseInt(uid), 'combate_finalizado', { resultado, monstros: monstrosDerrotados, xpGanho: xpPorJogador }, 'personagem', j.personagemId).catch(() => {});
          }
        }
      }

      // Narrar desfecho via IA
      try {
        const mestre = await this.obterMestre(roomId, sessao.historiaTemas || [], sessao, null);
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

        // Emitir e salvar narração do desfecho
        const msgDesfecho = buildMestreMensagem(respostaDesfecho.narracao, sessao.mestreConfig, {
          sessao,
          segmentos: respostaDesfecho.segmentos || []
        });
        appendMensagemSessao(sessao, msgDesfecho);
        await this.aplicarMetadadosNarrativos(roomId, sessao, respostaDesfecho.metadados || {});

        this.io.to(roomId).emit('mensagem_mestre', {
          id: Date.now().toString(),
          ...msgDesfecho,
          message: respostaDesfecho.narracao
        });
        await this.gerenciadorSessoes.atualizarSessao(roomId, sessao);
        await this.executarCompactacaoSeNecessaria(roomId, sessao, {});

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

  async obterMestre(salaId, temas, sessao, userId = null) {
    // Verificar se já existe no cache
    if (this.mestresCache.has(salaId)) {
      const cache = this.mestresCache.get(salaId);
      cache.ultimoUso = Date.now();
      if (userId) cache.mestre.userId = userId;
      console.log(`♻️ Mestre reutilizado do cache para sala ${salaId}`);
      return cache.mestre;
    }

    // Criar novo mestre
    console.log(`🆕 Criando novo Mestre para sala ${salaId}`);
    const payloadMestre = await prepareMestrePayload(sessao);
    
    // Formatar personagens com dados completos
    const jogadoresConectados = Array.isArray(sessao.jogadoresConectados) 
      ? sessao.jogadoresConectados 
      : Object.values(sessao.jogadores || {});
    
    const personagensFormatados = formatarPersonagensParaMestre(
      jogadoresConectados,
      sessao.personagensCompletos || {}
    );
    
    console.log(`🎭 Criando Mestre com ${personagensFormatados.length} personagens formatados`);
    
    // Construir catálogo filtrado por nível dos jogadores
    let catalogo = '';
    try {
      const { buildCatalogo } = await import('../agents/Mestre/catalogo/catalogoMestre.js');
      const niveisJogadores = jogadoresConectados
        .map(j => {
          const pc = (sessao.personagensCompletos || {})[j.personagemId || j.id];
          return pc?.nivel || j.nivel || 1;
        })
        .filter(n => typeof n === 'number');
      catalogo = await buildCatalogo({ niveisJogadores });
    } catch (error) {
      console.warn('⚠️ Erro ao construir catálogo para Mestre:', error.message);
    }

    // Condensar roteiro se disponível
    let roteiroCondensado = '';
    if (sessao.historiaRoteiro) {
      try {
        const { condensarRoteiro } = await import('../agents/Mestre/prompts/roteiroCondenser.js');
        roteiroCondensado = condensarRoteiro(sessao.historiaRoteiro, sessao.estadoJogo || null);
        if (roteiroCondensado) {
          console.log(`📜 Roteiro condensado para sala ${salaId} (${roteiroCondensado.length} chars)`);
        }
      } catch (error) {
        console.warn('⚠️ Erro ao condensar roteiro:', error.message);
      }
    }

    const mestre = await criarMestreRPG(
      payloadMestre.nomesTemas.length > 0 ? payloadMestre.nomesTemas : extrairNomesTemas(temas),
      payloadMestre.personagensFormatados,
      sessao.mestreConfig || null,
      payloadMestre.catalogo,
      payloadMestre.roteiroCondensado,
      payloadMestre.contextoPersistenteFormatado,
      payloadMestre.mestreContexto
    );
    if (userId) mestre.userId = userId;

    // Limitar tamanho do cache (LRU eviction)
    const MAX_CACHE_SIZE = MESTRE_CONFIG.cache.maxSize;
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
      if (agora - cache.ultimoUso > MESTRE_CONFIG.cache.ttl * 1000) {
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

    // 2b. Cancelar timer de próxima rodada (evita setTimeout orphan)
    if (this._roundTimers?.has(salaId)) {
      clearTimeout(this._roundTimers.get(salaId));
      this._roundTimers.delete(salaId);
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
      analyticsService.track('sessao_fim', { salaId, xpGanho: recapData.xpGanho || 0 });

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
  // Facade overrides for extracted websocket modules.
  // Keeping these at the end guarantees the delegated versions win while
  // older inline implementations are phased out safely.
  notificarInicioAventura(salaId, dados) {
    this.eventBus.emitAdventureStart(salaId, dados);
  }

  notificarMudancaFase(salaId, fase, dadosAdicionais = {}) {
    this.eventBus.emitPhaseUpdate(salaId, fase, dadosAdicionais);
  }

  async handleSolicitarDados(socket, data) {
    return this.testEngine.handleSolicitarDados(socket, data);
  }

  async handleDisconnect(socket, reason = 'unknown') {
    return this.roomGateway.handleDisconnect(socket, reason);
  }

  async iniciarPrimeiroTurno(roomId) {
    return this.turnEngine.iniciarPrimeiroTurno(roomId);
  }

  async avancarProximoTurno(roomId) {
    return this.turnEngine.avancarProximoTurno(roomId);
  }

  async iniciarNovaRodada(roomId) {
    return this.turnEngine.iniciarNovaRodada(roomId);
  }

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
