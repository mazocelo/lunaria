import { Server } from 'socket.io';
import { createClient } from 'redis';
import gerenciadorSessoes from '../redis/sessoes.js';
import db from '../Model/index.js';
import sessaoSnapshotService from '../services/sessaoSnapshot.js';
import ttsCacheService from '../services/ttsCacheService.js';
import { getDefaultProviderName } from '../services/ttsService.js';
import { aggregateNarrationFromSegments, resolveNarrationSegments } from '../services/narrationSegmentsService.js';
import {
  applyMetadadosToSessao
} from '../agents/Mestre/contexto/mestreContextBuilder.js';
import {
  buildTurnEventPayload,
  getTurnState
} from './utils/turnStateMachine.js';
import {
  appendMensagemSessao,
  buildMestreMensagem as buildMestreMensagemHistorico,
  buildAcaoMestreMensagem
} from './utils/sessionMessages.js';
import SessionEventBus from './sessionEventBus.js';
import RoomGateway from './gateways/roomGateway.js';
import TurnEngine from './engines/turnEngine.js';
import TestEngine from './engines/testEngine.js';
import CombatEngine from './engines/combatEngine.js';
import MasterNarrationEngine from './engines/masterNarrationEngine.js';
import AuthHandler from './handlers/authHandler.js';
import ChatHandler from './handlers/chatHandler.js';
import MasterCacheManager from './utils/masterCacheManager.js';
import SessionEngine from './engines/sessionEngine.js';
import logger from '../helpers/logger.js';

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
    this.mestresCache = new Map(); // salaId -> { mestre, criadoEm, ultimoUso, rodadaInicial, historiaRoteiroAtualizadoEm }
    this._cacheCleaner = null; // interval reference for cleanup
    this._disconnectTimers = new Map(); // userId -> timeout for grace period
    this._snapshotCounters = new Map(); // roomId -> mensagens count since last snapshot
    this._roomLocks = new Map(); // roomId -> Promise (mutex por sala)
    this._roundTimers = new Map(); // roomId -> setTimeout ID (timer entre rodadas)
    this.eventBus = new SessionEventBus(this);
    this.roomGateway = new RoomGateway(this);
    this.turnEngine = new TurnEngine(this);
    this.testEngine = new TestEngine(this);
    this.combatEngine = new CombatEngine(this);
    this.masterNarrationEngine = new MasterNarrationEngine(this);
    this.authHandler = new AuthHandler(this);
    this.chatHandler = new ChatHandler(this);
    this.masterCacheManager = new MasterCacheManager(this.mestresCache);
    this.sessionEngine = new SessionEngine(this);
  }

  /**
   * Expõe buildMestreMensagem como método da instância para uso nos engines
   */
  buildMestreMensagem(conteudo, mestreConfig = null, options = {}) {
    return buildMestreMensagem(conteudo, mestreConfig, options);
  }

  /**
   * Alias para buildMestreMensagem — usado por turnEngine e testEngine
   */
  criarMensagemMestre(conteudo, mestreConfig = null, options = {}) {
    return buildMestreMensagem(conteudo, mestreConfig, options);
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
        this.log('ERROR', 'ROOM_LOCK_TIMEOUT', null, null, { roomId });
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
      this.log('ERROR', 'SNAPSHOT_ERROR', null, null, { roomId, error: err.message })
    );
  }

  emitirEstadoTurno(roomId, sessao) {
    if (!this.io || !roomId || !sessao) return;
    this.sendToRoom(roomId, 'turno_estado_atualizado', {
      roomId,
      ...buildTurnEventPayload(sessao),
      timestamp: Date.now()
    });
  }

  emitirAcaoMestrePersistida(roomId, sessao, payload) {
    const mensagem = buildAcaoMestreMensagem(payload);
    appendMensagemSessao(sessao, mensagem);
    this.sendToRoom(roomId, 'acao_mestre', {
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
    logger.info('Inicializando WebSocket...');
    
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
      logger.info('Gerenciador de sessoes inicializado');
    } catch (error) {
      this.log('ERROR', 'SESSION_MANAGER_INIT_ERROR', null, null, { error: error.message });
    }

    // Configurar eventos
    this.setupEventHandlers();

    // Timer para limpar cache de mestres a cada 10 minutos (store reference for cleanup)
    this._cacheCleaner = setInterval(() => {
      this.masterCacheManager.limparCacheMestres();
    }, 600000);

    logger.info('WebSocket inicializado com sucesso');
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
      logger.info('Conectado ao Redis para WebSocket');
    } catch (error) {
      this.log('ERROR', 'REDIS_CONNECTION_ERROR', null, null, { error: error.message });
      // Continuar sem Redis se não estiver disponível
    }
  }

  /**
   * Log estruturado para eventos WebSocket (via pino)
   */
  log(level, event, socketId, userId = null, data = {}) {
    const pinoLevel = { 'INFO': 'info', 'WARN': 'warn', 'ERROR': 'error', 'SUCCESS': 'info', 'DEBUG': 'debug' }[level] || 'info';
    const logData = { event, socketId: socketId?.substring(0, 8), userId, ...data };
    logger[pinoLevel](logData, event);
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

      // @listen authenticate → authHandler | autentica conexao websocket via JWT
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

      // @listen join_room → roomGateway | jogador entra na sala de jogo
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

      // @listen leave_room → roomGateway | jogador sai da sala
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

      // @listen chat_message → chatHandler | mensagem de chat entre jogadores
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

      // @listen mensagem_para_mestre → masterNarrationEngine | jogador envia acao para mestre IA
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

      // @listen mensagem_roleplay → masterNarrationEngine | roleplay livre fora do turno
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

      // @listen dice_roll → testEngine | jogador rola dados em teste de habilidade
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

      // @listen rolar_dado_inicial → testEngine | d20 para definir ordem de jogadores
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

      // @listen iniciar_turno → turnEngine | jogador inicia seu turno com o mestre
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

      // @listen solicitar_dados → testEngine | mestre solicita teste de habilidade
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

      // @listen disconnect → roomGateway | cliente desconecta (grace period antes de remover)
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
          'dice_roll',
          'rolar_dado_inicial',
          'iniciar_turno',
          'solicitar_dados',
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
    return this.authHandler.handleAuthentication(socket, data);
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
    return this.chatHandler.handleChatMessage(socket, data);
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
  async handleMensagemParaMestre(socket, data) {
    return this.masterNarrationEngine.handleMensagemParaMestre(socket, data);
  }
  async handleMensagemRoleplay(socket, data) {
    return this.masterNarrationEngine.handleMensagemRoleplay(socket, data);
  }

  /**
   * Handler para iniciar turno do jogador
   * Gera mensagem inicial do Mestre direcionada ao jogador
   */
  async handleIniciarTurno(socket, data) {
    return this.turnEngine.handleIniciarTurno(socket, data);
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
        this.log('WARN', 'METADATA_APPLY_ERROR', null, null, { historiaId: sessao.historiaId, error: error.message });
      }
    }

    return applyMetadadosToSessao(sessao, metadados, historia);
  }

  // Delegate → sessionEngine
  executarCompactacaoSeNecessaria(roomId, sessao, options = {}) {
    return this.sessionEngine.executarCompactacaoSeNecessaria(roomId, sessao, options);
  }

  /**
   * Obter estatísticas do servidor
   */
  getStats() {
    const rooms = {};
    for (const [roomId, users] of this.roomUsers.entries()) {
      rooms[roomId] = { playerCount: users.size, players: [...users] };
    }

    return {
      connectedUsers: this.connectedUsers.size,
      activeRooms: this.roomUsers.size,
      totalRooms: this.io ? this.io.sockets.adapter.rooms.size : 0,
      rooms,
      mestresCache: this.mestresCache.size,
      lockedRooms: this._roomLocks.size,
      disconnectGracePeriods: this._disconnectTimers.size,
      uptime: Math.floor(process.uptime())
    };
  }

  // Delegate → sessionEngine
  obterSessaoHistoria(salaId) {
    return this.sessionEngine.obterSessaoHistoria(salaId);
  }

  /**
   * Finalizar rodada atual e preparar próxima
   */
  async finalizarRodada(roomId) {
    return this.turnEngine.finalizarRodada(roomId);
  }

  // Delegate → sessionEngine
  obterMestre(salaId, temas, sessao, userId = null) {
    return this.sessionEngine.obterMestre(salaId, temas, sessao, userId);
  }

  // Delegates para masterCacheManager (usado por turnEngine via sm.invalidarMestreSeNecessario)
  invalidarMestreSeNecessario(salaId, rodadaAtual) {
    return this.masterCacheManager.invalidarMestreSeNecessario(salaId, rodadaAtual);
  }

  // Delegate → sessionEngine
  limparSessaoCompleta(salaId, recapData = {}) {
    return this.sessionEngine.limparSessaoCompleta(salaId, recapData);
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

  async iniciarCombate(roomId, combateData, sessao, userId) {
    return this.combatEngine.iniciarCombate(roomId, combateData, sessao, userId);
  }

  async processarAcaoCombate(roomId, userId, username, personagem, mensagem, respostaIA, sessao) {
    return this.combatEngine.processarAcaoCombate(roomId, userId, username, personagem, mensagem, respostaIA, sessao);
  }

  async finalizarCombate(roomId, resultado) {
    return this.combatEngine.finalizarCombate(roomId, resultado);
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
        this.log('ERROR', 'REDIS_CLOSE_ERROR', null, null, { error: error.message });
      }
    }

    // Close Socket.IO
    if (this.io) {
      this.io.close();
    }
  }
}

export default new SocketManager(); 
