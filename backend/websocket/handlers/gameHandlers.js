import gerenciadorSessoes from '../../redis/sessoes.js';
import { EventEmitter } from '../events/EventEmitter.js';
import { EVENT_TYPES } from '../events/eventTypes.js';

/**
 * Handlers para eventos de jogo RPG
 * 🔧 ENHANCED: Logs detalhados para monitoramento completo
 */
export class GameHandlers {
  constructor(io) {
    this.io = io;
    this.eventEmitter = EventEmitter.getInstance();
  }

  // 🔧 NOVO: Sistema de logs detalhado para GameHandlers
  log(level, event, socketId, userId = null, data = {}) {
    const timestamp = new Date().toISOString();
    const prefix = {
      'INFO': '🎮',
      'WARN': '⚠️',
      'ERROR': '❌',
      'SUCCESS': '✅',
      'DEBUG': '🔍'
    }[level] || '🎮';
    
    const userInfo = userId ? `[User:${userId}]` : '';
    const socketInfo = `[Socket:${socketId?.substring(0, 8)}...]`;
    const handlerInfo = '[GameHandler]';
    
    console.log(`${prefix} ${timestamp} ${event} ${handlerInfo}${socketInfo}${userInfo}`, data);
  }

  /**
   * Handler para iniciar sessão de RPG
   */
  async handleStartSession(socket, data) {
    const startTime = Date.now();
    const socketId = socket.id;
    const userId = socket.userId;
    
    this.log('INFO', 'GAME_START_SESSION_REQUEST', socketId, userId, {
      sessionId: data?.sessionId,
      sessionName: data?.sessionData?.nome,
      maxPlayers: data?.sessionData?.maxJogadores,
      username: socket.username
    });

    try {
      const { sessionId, sessionData } = data;

      if (!socket.userId) {
        this.log('ERROR', 'GAME_START_SESSION_NO_AUTH', socketId, userId);
        socket.emit('error', { message: 'Usuário não autenticado' });
        return;
      }

      if (!sessionId) {
        this.log('ERROR', 'GAME_START_SESSION_NO_ID', socketId, userId);
        socket.emit('error', { message: 'SessionId é obrigatório' });
        return;
      }

      this.log('INFO', 'GAME_START_SESSION_PROCESSING', socketId, userId, {
        sessionId: sessionId,
        username: socket.username
      });

      // Criar sessão no Redis
      const session = await gerenciadorSessoes.criarSessao(sessionId, {
        nome: sessionData?.nome || `Sessão ${sessionId}`,
        mestreId: socket.userId,
        mestreNome: socket.username,
        jogadores: [],
        maxJogadores: sessionData?.maxJogadores || 6,
        configuracoes: sessionData?.configuracoes || {},
        estadoJogo: {
          fase: 'preparacao',
          turno: 0,
          jogadorAtivo: null,
          acoes: []
        },
        mensagens: []
      });

      this.log('SUCCESS', 'GAME_START_SESSION_CREATED', socketId, userId, {
        sessionId: sessionId,
        sessionName: session.nome,
        maxPlayers: session.maxJogadores
      });

      // Entrar na sala da sessão
      await socket.join(sessionId);
      this.log('SUCCESS', 'GAME_START_SESSION_JOINED_ROOM', socketId, userId, {
        sessionId: sessionId
      });

      // Emitir evento de sessão iniciada
      this.eventEmitter.emit(EVENT_TYPES.SESSION.STARTED, {
        sessionId,
        session,
        mestreId: socket.userId,
        timestamp: new Date().toISOString()
      });

      // Confirmar início da sessão
      socket.emit('session_started', {
        sessionId,
        session,
        role: 'mestre',
        timestamp: new Date().toISOString()
      });

      // Notificar outros usuários sobre nova sessão disponível
      socket.broadcast.emit('new_session_available', {
        sessionId,
        nome: session.nome,
        mestre: socket.username,
        maxJogadores: session.maxJogadores,
        timestamp: new Date().toISOString()
      });

      const processingTime = Date.now() - startTime;
      this.log('SUCCESS', 'GAME_START_SESSION_COMPLETED', socketId, userId, {
        sessionId: sessionId,
        processingTimeMs: processingTime,
        role: 'mestre'
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.log('ERROR', 'GAME_START_SESSION_ERROR', socketId, userId, {
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime
      });
      
      socket.emit('error', {
        message: 'Erro ao iniciar sessão',
        details: error.message
      });
    }
  }

  /**
   * Handler para finalizar sessão de RPG
   */
  async handleEndSession(socket, data) {
    const startTime = Date.now();
    const socketId = socket.id;
    const userId = socket.userId;
    
    this.log('INFO', 'GAME_END_SESSION_REQUEST', socketId, userId, {
      sessionId: data?.sessionId,
      reason: data?.reason,
      username: socket.username
    });

    try {
      const { sessionId, reason } = data;

      if (!sessionId) {
        this.log('ERROR', 'GAME_END_SESSION_NO_ID', socketId, userId);
        socket.emit('error', { message: 'SessionId é obrigatório' });
        return;
      }

      this.log('INFO', 'GAME_END_SESSION_PROCESSING', socketId, userId, {
        sessionId: sessionId,
        username: socket.username
      });

      // Obter sessão atual
      const session = await gerenciadorSessoes.obterSessao(sessionId);
      if (!session) {
        this.log('ERROR', 'GAME_END_SESSION_NOT_FOUND', socketId, userId, {
          sessionId: sessionId
        });
        socket.emit('error', { message: 'Sessão não encontrada' });
        return;
      }

      // Verificar se o usuário tem permissão (é o mestre)
      if (session.mestreId !== socket.userId) {
        this.log('ERROR', 'GAME_END_SESSION_NO_PERMISSION', socketId, userId, {
          sessionId: sessionId,
          sessionMasterId: session.mestreId,
          requestingUserId: socket.userId
        });
        socket.emit('error', { message: 'Apenas o mestre pode finalizar a sessão' });
        return;
      }

      // Contar usuários na sala antes de finalizar
      const socketsInRoom = await this.io.in(sessionId).fetchSockets();
      const usersInRoom = socketsInRoom.length;

      // Finalizar sessão no Redis
      await gerenciadorSessoes.finalizarSessao(sessionId);
      this.log('SUCCESS', 'GAME_END_SESSION_REDIS_UPDATED', socketId, userId, {
        sessionId: sessionId
      });

      // Emitir evento de sessão finalizada
      this.eventEmitter.emit(EVENT_TYPES.SESSION.ENDED, {
        sessionId,
        session,
        reason,
        finalizadaPor: socket.userId,
        timestamp: new Date().toISOString()
      });

      // Notificar todos na sala
      this.io.to(sessionId).emit('session_ended', {
        sessionId,
        reason: reason || 'Finalizada pelo mestre',
        timestamp: new Date().toISOString()
      });

      this.log('INFO', 'GAME_END_SESSION_USERS_NOTIFIED', socketId, userId, {
        sessionId: sessionId,
        usersNotified: usersInRoom
      });

      // Remover todos da sala
      for (const socketInRoom of socketsInRoom) {
        await socketInRoom.leave(sessionId);
      }

      const processingTime = Date.now() - startTime;
      this.log('SUCCESS', 'GAME_END_SESSION_COMPLETED', socketId, userId, {
        sessionId: sessionId,
        usersRemoved: usersInRoom,
        processingTimeMs: processingTime,
        reason: reason || 'Finalizada pelo mestre'
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.log('ERROR', 'GAME_END_SESSION_ERROR', socketId, userId, {
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime
      });
      
      socket.emit('error', {
        message: 'Erro ao finalizar sessão',
        details: error.message
      });
    }
  }

  /**
   * Handler para ações de jogador
   */
  async handlePlayerAction(socket, data) {
    const startTime = Date.now();
    const socketId = socket.id;
    const userId = socket.userId;
    
    this.log('INFO', 'GAME_PLAYER_ACTION_REQUEST', socketId, userId, {
      sessionId: data?.sessionId,
      action: data?.action,
      username: socket.username,
      actionDataPresent: !!data?.actionData
    });

    try {
      const { sessionId, action, actionData } = data;

      if (!socket.userId) {
        this.log('ERROR', 'GAME_PLAYER_ACTION_NO_AUTH', socketId, userId);
        socket.emit('error', { message: 'Usuário não autenticado' });
        return;
      }

      if (!sessionId || !action) {
        this.log('ERROR', 'GAME_PLAYER_ACTION_MISSING_DATA', socketId, userId, {
          hasSessionId: !!sessionId,
          hasAction: !!action
        });
        socket.emit('error', { message: 'SessionId e action são obrigatórios' });
        return;
      }

      this.log('INFO', 'GAME_PLAYER_ACTION_PROCESSING', socketId, userId, {
        sessionId: sessionId,
        action: action,
        username: socket.username
      });

      // Obter sessão atual
      const session = await gerenciadorSessoes.obterSessao(sessionId);
      if (!session) {
        this.log('ERROR', 'GAME_PLAYER_ACTION_SESSION_NOT_FOUND', socketId, userId, {
          sessionId: sessionId
        });
        socket.emit('error', { message: 'Sessão não encontrada' });
        return;
      }

      this.log('INFO', 'GAME_PLAYER_ACTION_SESSION_FOUND', socketId, userId, {
        sessionId: sessionId,
        sessionPhase: session.estadoJogo?.fase,
        sessionMaster: session.mestreNome
      });

      // Processar ação baseada no tipo
      const actionResult = await this.processPlayerAction(session, socket, action, actionData);

      this.log('SUCCESS', 'GAME_PLAYER_ACTION_PROCESSED', socketId, userId, {
        sessionId: sessionId,
        action: action,
        success: actionResult.success,
        updateGameState: actionResult.updateGameState
      });

      // Atualizar estado do jogo na sessão
      if (actionResult.updateGameState) {
        await gerenciadorSessoes.atualizarEstadoJogo(sessionId, actionResult.gameState);
        this.log('SUCCESS', 'GAME_PLAYER_ACTION_STATE_UPDATED', socketId, userId, {
          sessionId: sessionId,
          action: action
        });
      }

      // Emitir evento de ação
      this.eventEmitter.emit(EVENT_TYPES.GAME.PLAYER_ACTION, {
        sessionId,
        userId: socket.userId,
        username: socket.username,
        action,
        actionData,
        result: actionResult,
        timestamp: new Date().toISOString()
      });

      // Contar usuários na sala
      const socketsInRoom = await this.io.in(sessionId).fetchSockets();
      const usersInRoom = socketsInRoom.length;

      // Notificar sala sobre a ação
      this.io.to(sessionId).emit('player_action', {
        userId: socket.userId,
        username: socket.username,
        action,
        actionData,
        result: actionResult.publicResult,
        timestamp: new Date().toISOString()
      });

      // Resposta privada para o jogador
      socket.emit('action_result', {
        action,
        result: actionResult.privateResult || actionResult.publicResult,
        timestamp: new Date().toISOString()
      });

      const processingTime = Date.now() - startTime;
      this.log('SUCCESS', 'GAME_PLAYER_ACTION_COMPLETED', socketId, userId, {
        sessionId: sessionId,
        action: action,
        success: actionResult.success,
        usersNotified: usersInRoom,
        processingTimeMs: processingTime
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.log('ERROR', 'GAME_PLAYER_ACTION_ERROR', socketId, userId, {
        sessionId: data?.sessionId,
        action: data?.action,
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime
      });
      
      socket.emit('error', {
        message: 'Erro ao processar ação',
        details: error.message
      });
    }
  }

  /**
   * Processar diferentes tipos de ações de jogador
   */
  async processPlayerAction(session, socket, action, actionData) {
    const socketId = socket.id;
    const userId = socket.userId;
    
    this.log('INFO', 'GAME_PROCESS_ACTION_START', socketId, userId, {
      action: action,
      actionType: typeof actionData
    });

    let result;
    
    switch (action) {
      case 'roll_dice':
        result = await this.handleDiceRoll(session, socket, actionData);
        break;
      
      case 'use_skill':
        result = await this.handleSkillUse(session, socket, actionData);
        break;
      
      case 'attack':
        // Combate real e processado pelo socketManager.processarAcaoCombate
        result = {
          success: false,
          publicResult: { message: 'Ataques são processados automaticamente durante combate ativo.' },
          updateGameState: false
        };
        break;
      
      case 'move':
        result = await this.handleMove(session, socket, actionData);
        break;
      
      case 'cast_spell':
        result = await this.handleSpellCast(session, socket, actionData);
        break;
      
      case 'use_item':
        result = await this.handleItemUse(session, socket, actionData);
        break;
      
      default:
        this.log('WARN', 'GAME_PROCESS_ACTION_UNKNOWN', socketId, userId, {
          action: action
        });
        result = {
          success: false,
          publicResult: { message: `Ação desconhecida: ${action}` },
          privateResult: { message: `Ação desconhecida: ${action}` },
          updateGameState: false
        };
    }

    this.log('SUCCESS', 'GAME_PROCESS_ACTION_COMPLETED', socketId, userId, {
      action: action,
      success: result.success,
      updateGameState: result.updateGameState
    });

    return result;
  }

  /**
   * Handler para rolagem de dados
   */
  async handleDiceRoll(session, socket, actionData) {
    const socketId = socket.id;
    const userId = socket.userId;
    
    this.log('INFO', 'GAME_DICE_ROLL_START', socketId, userId, {
      dice: actionData?.dice,
      modifier: actionData?.modifier,
      reason: actionData?.reason
    });

    const { dice, modifier = 0, reason } = actionData;
    
    if (!dice) {
      this.log('ERROR', 'GAME_DICE_ROLL_NO_DICE', socketId, userId);
      throw new Error('Especificação de dados é obrigatória');
    }

    // Simular rolagem de dados (ex: "2d6+3")
    const diceResult = this.rollDice(dice);
    const total = diceResult.total + modifier;

    this.log('SUCCESS', 'GAME_DICE_ROLL_COMPLETED', socketId, userId, {
      dice: dice,
      rolls: diceResult.rolls,
      total: diceResult.total,
      modifier: modifier,
      finalTotal: total,
      reason: reason
    });

    return {
      success: true,
      publicResult: {
        type: 'dice_roll',
        dice,
        rolls: diceResult.rolls,
        total: diceResult.total,
        modifier,
        finalTotal: total,
        reason
      },
      updateGameState: false
    };
  }

  /**
   * Handler para uso de habilidade
   */
  async handleSkillUse(session, socket, actionData) {
    const socketId = socket.id;
    const userId = socket.userId;
    
    this.log('INFO', 'GAME_SKILL_USE_START', socketId, userId, {
      skillId: actionData?.skillId,
      target: actionData?.target
    });

    const { skillId, target, parameters } = actionData;

    // Aqui você implementaria a lógica específica da habilidade
    // Por exemplo, consultar banco de dados para obter detalhes da habilidade

    this.log('SUCCESS', 'GAME_SKILL_USE_COMPLETED', socketId, userId, {
      skillId: skillId,
      target: target,
      user: socket.username
    });

    return {
      success: true,
      publicResult: {
        type: 'skill_use',
        skillId,
        user: socket.username,
        target,
        effect: `${socket.username} usou a habilidade ${skillId}`
      },
      updateGameState: true,
      gameState: {
        ...session.estadoJogo,
        ultimaAcao: {
          tipo: 'skill_use',
          jogador: socket.userId,
          skillId,
          timestamp: new Date().toISOString()
        }
      }
    };
  }

  /**
   * Handler para movimento
   */
  async handleMove(session, socket, actionData) {
    const socketId = socket.id;
    const userId = socket.userId;
    
    this.log('INFO', 'GAME_MOVE_START', socketId, userId, {
      from: actionData?.fromPosition,
      to: actionData?.toPosition,
      movementType: actionData?.movementType
    });

    const { fromPosition, toPosition, movementType } = actionData;

    this.log('SUCCESS', 'GAME_MOVE_COMPLETED', socketId, userId, {
      player: socket.username,
      from: fromPosition,
      to: toPosition,
      movementType: movementType
    });

    return {
      success: true,
      publicResult: {
        type: 'move',
        player: socket.username,
        from: fromPosition,
        to: toPosition,
        movementType
      },
      updateGameState: true,
      gameState: {
        ...session.estadoJogo,
        posicoes: {
          ...session.estadoJogo.posicoes,
          [socket.userId]: toPosition
        }
      }
    };
  }

  /**
   * Handler para conjuração de magia
   */
  async handleSpellCast(session, socket, actionData) {
    const socketId = socket.id;
    const userId = socket.userId;
    
    this.log('INFO', 'GAME_SPELL_CAST_START', socketId, userId, {
      spellId: actionData?.spellId,
      target: actionData?.target,
      level: actionData?.level
    });

    const { spellId, target, level } = actionData;

    this.log('SUCCESS', 'GAME_SPELL_CAST_COMPLETED', socketId, userId, {
      caster: socket.username,
      spellId: spellId,
      target: target,
      level: level
    });

    return {
      success: true,
      publicResult: {
        type: 'spell_cast',
        caster: socket.username,
        spellId,
        target,
        level,
        effect: `${socket.username} conjurou ${spellId}`
      },
      updateGameState: true,
      gameState: {
        ...session.estadoJogo,
        ultimaAcao: {
          tipo: 'spell_cast',
          jogador: socket.userId,
          spellId,
          timestamp: new Date().toISOString()
        }
      }
    };
  }

  /**
   * Handler para uso de item
   */
  async handleItemUse(session, socket, actionData) {
    const socketId = socket.id;
    const userId = socket.userId;
    
    this.log('INFO', 'GAME_ITEM_USE_START', socketId, userId, {
      itemId: actionData?.itemId,
      target: actionData?.target
    });

    const { itemId, target } = actionData;

    this.log('SUCCESS', 'GAME_ITEM_USE_COMPLETED', socketId, userId, {
      user: socket.username,
      itemId: itemId,
      target: target
    });

    return {
      success: true,
      publicResult: {
        type: 'item_use',
        user: socket.username,
        itemId,
        target,
        effect: `${socket.username} usou ${itemId}`
      },
      updateGameState: false
    };
  }

  /**
   * Função para simular rolagem de dados
   */
  rollDice(diceNotation) {
    // Parse da notação de dados (ex: "2d6", "1d20+3")
    const match = diceNotation.match(/(\d+)d(\d+)(?:\+(\d+))?/);
    if (!match) {
      throw new Error('Notação de dados inválida');
    }

    const numDice = parseInt(match[1]);
    const diceSides = parseInt(match[2]);
    const rolls = [];
    let total = 0;

    for (let i = 0; i < numDice; i++) {
      const roll = Math.floor(Math.random() * diceSides) + 1;
      rolls.push(roll);
      total += roll;
    }

    return { rolls, total };
  }

  /**
   * Obter estatísticas de sessões ativas
   */
  async getSessionStats() {
    this.log('INFO', 'GAME_GET_SESSION_STATS_START', 'system', null);
    
    try {
      const sessions = await gerenciadorSessoes.listarSessoesAtivas();
      
      const stats = {
        totalSessions: sessions.length,
        sessions: sessions.map(session => ({
          id: session.id,
          nome: session.nome,
          mestre: session.mestreNome,
          jogadores: session.jogadores?.length || 0,
          maxJogadores: session.maxJogadores,
          fase: session.estadoJogo?.fase,
          criadaEm: session.criadaEm
        }))
      };

      this.log('SUCCESS', 'GAME_GET_SESSION_STATS_COMPLETED', 'system', null, {
        totalSessions: stats.totalSessions,
        activePhases: sessions.map(s => s.estadoJogo?.fase).filter(Boolean)
      });

      return stats;
    } catch (error) {
      this.log('ERROR', 'GAME_GET_SESSION_STATS_ERROR', 'system', null, {
        error: error.message,
        stack: error.stack
      });
      
      return { totalSessions: 0, sessions: [] };
    }
  }
} 