import { Server } from 'socket.io';
import { createClient } from 'redis';
import gerenciadorSessoes from '../redis/sessoes.js';
import criarMestreRPG from '../agents/Mestre/index.js';
import { buscarTemasCompletos, extrairNomesTemas } from '../helpers/temasHelper.js';
import { formatarPersonagensParaMestre } from '../helpers/personagensHelper.js';
import db from '../Model/index.js';
import sessaoSnapshotService from '../services/sessaoSnapshot.js';
import analyticsService from '../services/analyticsService.js';
import { MESTRE_CONFIG } from '../agents/Mestre/config.js';
import ttsCacheService from '../services/ttsCacheService.js';
import { getDefaultProviderName } from '../services/ttsService.js';
import { aggregateNarrationFromSegments, resolveNarrationSegments } from '../services/narrationSegmentsService.js';
import {
  applyMetadadosToSessao,
  applyResumoToSessao,
  buildMestreContext,
  getCompactacaoState,
  prepareMestrePayload
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
  }

  /**
   * Expõe buildMestreMensagem como método da instância para uso nos engines
   */
  buildMestreMensagem(conteudo, mestreConfig = null, options = {}) {
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
   * Finalizar rodada atual e preparar próxima
   */
  async finalizarRodada(roomId) {
    return this.turnEngine.finalizarRodada(roomId);
  }

  async obterMestre(salaId, temas, sessao, userId = null) {
    // Verificar se já existe no cache
    if (this.mestresCache.has(salaId)) {
      const cache = this.mestresCache.get(salaId);
      if (this.isMestreCacheStale(cache, sessao)) {
        this.mestresCache.delete(salaId);
        console.log(`Mestre invalidado por roteiro mais recente na sessao ${salaId}`);
      } else {
        cache.ultimoUso = Date.now();
        if (userId) cache.mestre.userId = userId;
      console.log(`♻️ Mestre reutilizado do cache para sala ${salaId}`);
        return cache.mestre;
      }
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
      rodadaInicial: sessao?.estadoJogo?.rodadaAtual || 1,
      historiaRoteiroAtualizadoEm: sessao?.estadoJogo?.historiaRoteiroAtualizadoEm || null
    });

    return mestre;
  }

  getHistoriaRoteiroAtualizadoEmMs(sessao) {
    const raw = sessao?.estadoJogo?.historiaRoteiroAtualizadoEm;
    if (!raw) return null;

    const timestamp = new Date(raw).getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  getCacheHistoriaRoteiroAtualizadoEmMs(cache) {
    if (!cache) return null;

    if (cache.historiaRoteiroAtualizadoEm) {
      const timestamp = new Date(cache.historiaRoteiroAtualizadoEm).getTime();
      if (Number.isFinite(timestamp)) {
        return timestamp;
      }
    }

    return Number.isFinite(cache.criadoEm) ? cache.criadoEm : null;
  }

  isMestreCacheStale(cache, sessao) {
    const sessionTimestamp = this.getHistoriaRoteiroAtualizadoEmMs(sessao);
    if (!sessionTimestamp) {
      return false;
    }

    const cacheTimestamp = this.getCacheHistoriaRoteiroAtualizadoEmMs(cache);
    if (!cacheTimestamp) {
      return true;
    }

    return sessionTimestamp > cacheTimestamp;
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
