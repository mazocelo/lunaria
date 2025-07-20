import gerenciadorSessoes from '../../redis/sessoes.js';
import { EventEmitter } from '../events/EventEmitter.js';
import { EVENT_TYPES } from '../events/eventTypes.js';

/**
 * Handlers para eventos de jogo RPG
 */
export class GameHandlers {
  constructor(io) {
    this.io = io;
    this.eventEmitter = EventEmitter.getInstance();
  }

  /**
   * Handler para iniciar sessão de RPG
   */
  async handleStartSession(socket, data) {
    try {
      const { sessionId, sessionData } = data;

      if (!socket.userId) {
        socket.emit('error', { message: 'Usuário não autenticado' });
        return;
      }

      if (!sessionId) {
        socket.emit('error', { message: 'SessionId é obrigatório' });
        return;
      }

      console.log(`🎮 Iniciando sessão: ${sessionId} por ${socket.username}`);

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

      // Entrar na sala da sessão
      await socket.join(sessionId);

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

    } catch (error) {
      console.error('❌ Erro ao iniciar sessão:', error);
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
    try {
      const { sessionId, reason } = data;

      if (!sessionId) {
        socket.emit('error', { message: 'SessionId é obrigatório' });
        return;
      }

      console.log(`🛑 Finalizando sessão: ${sessionId} por ${socket.username}`);

      // Obter sessão atual
      const session = await gerenciadorSessoes.obterSessao(sessionId);
      if (!session) {
        socket.emit('error', { message: 'Sessão não encontrada' });
        return;
      }

      // Verificar se o usuário tem permissão (é o mestre)
      if (session.mestreId !== socket.userId) {
        socket.emit('error', { message: 'Apenas o mestre pode finalizar a sessão' });
        return;
      }

      // Finalizar sessão no Redis
      await gerenciadorSessoes.finalizarSessao(sessionId);

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

      // Remover todos da sala
      const socketsInRoom = await this.io.in(sessionId).fetchSockets();
      for (const socketInRoom of socketsInRoom) {
        await socketInRoom.leave(sessionId);
      }

    } catch (error) {
      console.error('❌ Erro ao finalizar sessão:', error);
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
    try {
      const { sessionId, action, actionData } = data;

      if (!socket.userId) {
        socket.emit('error', { message: 'Usuário não autenticado' });
        return;
      }

      if (!sessionId || !action) {
        socket.emit('error', { message: 'SessionId e action são obrigatórios' });
        return;
      }

      console.log(`⚡ Ação de jogador: ${action} por ${socket.username} na sessão ${sessionId}`);

      // Obter sessão atual
      const session = await gerenciadorSessoes.obterSessao(sessionId);
      if (!session) {
        socket.emit('error', { message: 'Sessão não encontrada' });
        return;
      }

      // Processar ação baseada no tipo
      const actionResult = await this.processPlayerAction(session, socket, action, actionData);

      // Atualizar estado do jogo na sessão
      if (actionResult.updateGameState) {
        await gerenciadorSessoes.atualizarEstadoJogo(sessionId, actionResult.gameState);
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

    } catch (error) {
      console.error('❌ Erro ao processar ação:', error);
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
    switch (action) {
      case 'roll_dice':
        return await this.handleDiceRoll(session, socket, actionData);
      
      case 'use_skill':
        return await this.handleSkillUse(session, socket, actionData);
      
      case 'attack':
        return await this.handleAttack(session, socket, actionData);
      
      case 'move':
        return await this.handleMove(session, socket, actionData);
      
      case 'cast_spell':
        return await this.handleSpellCast(session, socket, actionData);
      
      case 'use_item':
        return await this.handleItemUse(session, socket, actionData);
      
      default:
        return {
          success: false,
          publicResult: { message: `Ação desconhecida: ${action}` },
          privateResult: { message: `Ação desconhecida: ${action}` },
          updateGameState: false
        };
    }
  }

  /**
   * Handler para rolagem de dados
   */
  async handleDiceRoll(session, socket, actionData) {
    const { dice, modifier = 0, reason } = actionData;
    
    if (!dice) {
      throw new Error('Especificação de dados é obrigatória');
    }

    // Simular rolagem de dados (ex: "2d6+3")
    const diceResult = this.rollDice(dice);
    const total = diceResult.total + modifier;

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
    const { skillId, target, parameters } = actionData;

    // Aqui você implementaria a lógica específica da habilidade
    // Por exemplo, consultar banco de dados para obter detalhes da habilidade

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
   * Handler para ataque
   */
  async handleAttack(session, socket, actionData) {
    const { target, weapon, attackType } = actionData;

    // Simular ataque
    const attackRoll = this.rollDice('1d20');
    const damageRoll = this.rollDice('1d8');

    return {
      success: true,
      publicResult: {
        type: 'attack',
        attacker: socket.username,
        target,
        weapon,
        attackType,
        attackRoll: attackRoll.total,
        damage: damageRoll.total,
        hit: attackRoll.total >= 12 // AC exemplo
      },
      updateGameState: true,
      gameState: {
        ...session.estadoJogo,
        ultimaAcao: {
          tipo: 'attack',
          jogador: socket.userId,
          target,
          timestamp: new Date().toISOString()
        }
      }
    };
  }

  /**
   * Handler para movimento
   */
  async handleMove(session, socket, actionData) {
    const { fromPosition, toPosition, movementType } = actionData;

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
    const { spellId, target, level } = actionData;

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
    const { itemId, target } = actionData;

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
    try {
      const sessions = await gerenciadorSessoes.listarSessoesAtivas();
      return {
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
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de sessões:', error);
      return { totalSessions: 0, sessions: [] };
    }
  }
} 