/**
 * 🌐 SOCKET ACTIONS - Lógicas e ações da conexão WebSocket
 * 
 * Todas as funcionalidades do WebSocket integradas diretamente no Zustand store:
 * - Controle de conexão e socket.io
 * - Gerenciamento de autenticação
 * - Manipulação de room (conexão técnica)
 * - Sistema de listeners
 * - Métodos de envio (mensagens, ações, dados)
 * - Controle de rate limiting
 * - Sistema de logs
 * - Funções utilitárias
 */
import io from 'socket.io-client';
import { COMBAT } from '../../constants/game';

// Configuração de URLs via variáveis de ambiente
const WS_BASE_URL = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:3001';

export const createSocketActions = (set, get) => ({
  
  // ===== SISTEMA DE LOGS =====
  log: (event, data = {}, level = 'info') => {
    const { logLevel } = get();
    if (logLevel === 'error' && level !== 'error') return;
    
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌' : data.success ? '✅' : data.warning ? '⚠️' : '📡';
    
    if (level === 'error' || data.error) {
      console.error(`${prefix} ${timestamp} [Socket] ${event}`, data);
    } else if (logLevel === 'info') {
      // Log de info removido para performance
    }
  },

  // ===== SISTEMA DE LISTENERS =====
  // Usado por: Todas as views que precisam escutar eventos WebSocket
  on: (event, callback) => {
    const { socket, listeners } = get();
    
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event).add(callback);

    if (socket) {
      socket.on(event, callback);
    }
    
    set({ listeners: new Map(listeners) });
  },

  // Usado por: Todas as views para remover listeners ao desmontar
  off: (event, callback) => {
    const { socket, listeners } = get();
    
    if (listeners.has(event)) {
      listeners.get(event).delete(callback);
    }

    if (socket) {
      socket.off(event, callback);
    }
    
    set({ listeners: new Map(listeners) });
  },

  // Usado por: Views que precisam de listeners únicos
  once: (event, callback) => {
    const { socket } = get();
    if (socket) {
      socket.once(event, callback);
    }
  },

  // ===== VALIDAÇÃO DE TOKEN =====
  validateToken: (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp && payload.exp > currentTime;
    } catch (e) {
      return false;
    }
  },

  // ===== CONFIGURAÇÃO DE LISTENERS INTERNOS =====
  setupInternalListeners: () => {
    const { socket, log } = get();

    // Limpar listeners anteriores para evitar acumulação em reconnect
    socket.removeAllListeners();

    // Listeners de conexão
    socket.on('connect', () => {
      set({ isConnected: true, isConnecting: false });
      get().log('Connected successfully', { socketId: socket.id, success: true });
    });

    socket.on('disconnect', (reason) => {
      set({
        isConnected: false,
        isAuthenticated: false,
        inRoom: false,
        roomId: null
      });
      get().log('Disconnected', { reason });

      // Notificar o usuário via toast se disponível
      if (reason !== 'io client disconnect' && window.showGameNotification) {
        window.showGameNotification('Conexao perdida. Tentando reconectar...', 'warning');
      }
    });

    socket.on('connect_error', (error) => {
      set({
        isConnected: false,
        isConnecting: false,
        error: error.message
      });
      get().log('Connection error', { error: error.message }, 'error');
    });

    // Listeners de reconexão automática (Socket.IO built-in)
    socket.io.on('reconnect', (attempt) => {
      set({ isConnected: true, isReconnecting: false, error: null });
      if (window.showGameNotification) {
        window.showGameNotification('Reconectado com sucesso!', 'success');
      }

      // Re-autenticar após reconexão
      const { socketToken } = get();
      if (socketToken) {
        socket.emit('authenticate', { token: socketToken });
      }
    });

    socket.io.on('reconnect_attempt', (attempt) => {
      set({ isReconnecting: true, connectionAttempts: attempt });
    });

    socket.io.on('reconnect_failed', () => {
      console.error('❌ Reconexão falhou após todas as tentativas');
      set({ isReconnecting: false, error: 'Nao foi possivel reconectar. Recarregue a pagina.' });
      if (window.showGameNotification) {
        window.showGameNotification('Falha na reconexao. Recarregue a pagina.', 'error');
      }
    });

    // Listeners de autenticação
    socket.on('authenticated', (data) => {
      // Backend envia: { userId, username, socketId, sessionId }
      // NÃO envia objeto 'user', então precisamos criar
      const user = {
        id: data.userId,
        username: data.username,
        socketId: data.socketId,
        sessionId: data.sessionId
      };
      
      set({
        isAuthenticated: true,
        currentUser: user,
        userRole: null,
        error: null
      });
      get().log('Authenticated', { userId: user.id, username: user.username, success: true });
    });

    socket.on('authentication_error', (error) => {
      set({
        isAuthenticated: false,
        currentUser: null,
        userRole: null,
        error: error.message
      });
      get().log('Authentication failed', { error: error.message }, 'error');
    });

    // Listeners de room
    socket.on('room_joined', (data) => {
      
      // ✅ RECUPERAR ESTADO DO JOGO AO RECONECTAR
      const estadoJogo = data.sessao?.estadoJogo || data.session?.estadoJogo;
      
      if (estadoJogo) {
        
        const currentUser = get().currentUser;
        const updateData = {};
        
        // Restaurar fase
        if (estadoJogo.fase) {
          updateData.faseJogo = estadoJogo.fase;
        }
        
        // Restaurar rodada e turno
        if (estadoJogo.rodadaAtual !== undefined) {
          updateData.rodadaAtual = estadoJogo.rodadaAtual;
        }
        if (estadoJogo.turnoAtual !== undefined) {
          updateData.turnoAtual = estadoJogo.turnoAtual;
        }
        
        // Restaurar ordem de jogadores
        if (estadoJogo.ordemJogadores && estadoJogo.ordemJogadores.length > 0) {
          const ordemJogadores = estadoJogo.ordemJogadores;
          const turnoAtual = estadoJogo.turnoAtual || 0;
          const jogadorAtual = ordemJogadores[turnoAtual];
          const ehMeuTurno = currentUser && jogadorAtual && 
            String(jogadorAtual.userId) === String(currentUser.id);
          
          updateData.ordemJogadores = ordemJogadores;
          updateData.ordemDefinida = true;
          updateData.jogadorAtual = jogadorAtual;
          updateData.ehMeuTurno = ehMeuTurno;
          
        }
        
        // Restaurar turnoIniciado
        if (estadoJogo.turnoIniciado !== undefined) {
          updateData.turnoIniciado = estadoJogo.turnoIniciado;
        }
        
        // Restaurar resultados de dados iniciais
        if (estadoJogo.rolagemInicial) {
          updateData.resultadosDados = estadoJogo.rolagemInicial;
        }

        // Restaurar estado de combate
        if (estadoJogo.combate?.ativo) {
          updateData.combateAtivo = true;
          updateData.combateMonstros = estadoJogo.combate.monstros || [];
          updateData.combateJogadores = estadoJogo.combate.jogadores || {};
          updateData.combateRodada = estadoJogo.combate.rodadaCombate || 1;
          updateData.combateLog = (estadoJogo.combate.log || []).slice(-COMBAT.LOG_MAX_ENTRIES);
        }

        // Aplicar todas as atualizações
        set(updateData);
      }
      
      set({
        inRoom: true,
        roomId: data.roomId,
        session: data.sessao || data.session,  // Backend pode enviar 'sessao' ou 'session'
        roomUsers: data.users || [],
        error: null
      });
      get().log('Room joined', { 
        roomId: data.roomId, 
        users: data.users?.length,
        jogadores: (data.sessao?.jogadoresConectados || data.session?.jogadoresConectados)?.length || 0,
        success: true 
      });
    });

    socket.on('room_left', () => {
      set({
        inRoom: false,
        roomId: null,
        session: null,
        roomUsers: []
      });
      get().log('Room left', { success: true });
    });

    socket.on('room_users', (users) => {
      set({ roomUsers: users });
      get().log('Room users updated', { count: users.length });
    });

    socket.on('connection_error', (error) => {
      set({ error: error.message });
      get().log('Connection error', { error: error.message }, 'error');
    });

    // ===== LISTENERS DO SISTEMA DE TURNOS E RODADAS =====
    
    // Listener de fase atualizada
    socket.on('fase_atualizada', (data) => {
      set({ 
        faseJogo: data.fase,
        estadoJogo: data.estadoJogo || get().estadoJogo
      });
      get().log('Fase atualizada', { fase: data.fase, success: true });
    });

    // ✅ NOVO: Listener para aventura iniciada
    socket.on('aventura_iniciada', (data) => {
      set({
        faseJogo: 'rolagem_inicial',
        aventuraIniciada: true
      });
      get().log('Aventura iniciada', { 
        historiaId: data.historiaId,
        historiaNome: data.historiaNome,
        success: true 
      });
    });

    // Listener de resultado de dado inicial
    socket.on('resultado_dado_inicial', (data) => {
      
      // Atualizar resultados dos dados no estado
      const { resultadosDados = {} } = get();
      resultadosDados[data.userId] = {
        valor: data.valor,
        username: data.username,
        personagemNome: data.personagemNome,
        timestamp: data.timestamp
      };
      
      set({ resultadosDados: { ...resultadosDados } });
      
      get().log('Dado inicial rolado', { 
        userId: data.userId, 
        valor: data.valor,
        success: true 
      });
    });

    // Listener de ordem definida
    socket.on('ordem_definida', (data) => {
      set({ 
        ordemJogadores: data.ordemJogadores || [],
        ordemDefinida: true
      });
      get().log('Ordem de jogadores definida', { 
        totalJogadores: data.ordemJogadores?.length,
        success: true 
      });
    });

    // Listener de turno alterado
    socket.on('turno_alterado', (data) => {
      const currentUser = get().currentUser;
      const ehMeuTurno = currentUser && String(data.jogadorAtual?.userId) === String(currentUser.id);
      
      set({ 
        rodadaAtual: data.rodadaAtual,
        turnoAtual: data.turnoAtual,
        jogadorAtual: data.jogadorAtual,
        ordemJogadores: data.ordemCompleta || get().ordemJogadores,
        ehMeuTurno,
        turnoIniciado: false  // Resetar ao mudar turno
      });
      
      // ✅ Mostrar notificação
      if (typeof window !== 'undefined' && window.showGameNotification) {
        if (ehMeuTurno) {
          window.showGameNotification(`⚡ É SUA VEZ!`, 'success');
        }
      }
      
      get().log('Turno alterado', { 
        turno: data.turnoAtual,
        jogador: data.jogadorAtual?.username,
        ehMeuTurno,
        success: true 
      });
    });

    // Listener de mestre finalizou turno
    socket.on('mestre_finalizou_turno', (data) => {
      get().log('Mestre finalizou turno', { 
        jogador: data.jogador,
        contador: data.contador,
        success: true 
      });
    });

    // Listener de turno iniciado
    socket.on('turno_iniciado', (data) => {
      const currentUser = get().currentUser;
      const ehMeuTurno = currentUser && String(data.userId) === String(currentUser.id);
      
      if (ehMeuTurno) {
        set({ turnoIniciado: true });
      }
      
      get().log('Turno iniciado', { userId: data.userId, success: true });
    });

    // Listener de rodada finalizada
    socket.on('rodada_finalizada', (data) => {
      set({ 
        faseJogo: 'entre_rodadas',
        rodadaFinalizada: data.rodada
      });
      get().log('Rodada finalizada', { rodada: data.rodada, success: true });
    });

    // Listener de nova rodada iniciada
    socket.on('nova_rodada_iniciada', (data) => {
      set({ 
        faseJogo: 'rodada_em_andamento',
        rodadaAtual: data.rodada,
        turnoAtual: 0,
        rodadaFinalizada: null
      });
      get().log('Nova rodada iniciada', { rodada: data.rodada, success: true });
    });

    // Listener de erro de cooldown roleplay
    socket.on('erro_cooldown_roleplay', (data) => {
      set({ 
        cooldownRoleplay: data.segundosRestantes || 0,
        erroMensagem: data.message
      });
      get().log('Cooldown roleplay ativo', { segundos: data.segundosRestantes });
    });

    // Listener de erro de turno
    socket.on('erro_turno', (data) => {
      set({ erroMensagem: data.message });
      if (window.showGameNotification) {
        window.showGameNotification(data.message || 'Não é seu turno!', 'warning');
      }
      get().log('Erro ao enviar mensagem fora do turno', { message: data.message });
    });

    // Listener de server_message (ex: jogador derrotado tentando agir)
    socket.on('server_message', (data) => {
      if (window.showGameNotification) {
        window.showGameNotification(data.mensagem || data.message || 'Mensagem do servidor', 'warning');
      }
      get().log('Server message', { mensagem: data.mensagem });
    });

    // Listener de force_disconnect (outra aba abriu o jogo)
    socket.on('force_disconnect', (data) => {
      set({ isConnected: false });
      if (window.showGameNotification) {
        window.showGameNotification(data.reason || 'Conexão encerrada: você abriu o jogo em outra aba.', 'error');
      }
      get().log('Force disconnect', { reason: data.reason });
    });

    // Listener de solicitacao_dados (Mestre manual solicita dados)
    socket.on('solicitacao_dados', (data) => {
      if (window.showGameNotification) {
        window.showGameNotification(`🎲 O Mestre solicita rolagem de dados!`, 'info');
      }
      get().log('Solicitação de dados manual', { data });
    });

    // Listener de mensagem roleplay
    socket.on('mensagem_roleplay', (data) => {
      // Será tratado pela view que escuta mensagens
      get().log('Mensagem roleplay recebida', { userId: data.userId });
    });

    // Listener de sessão resetada
    socket.on('sessao_resetada', (data) => {
      
      // Resetar todos os estados de jogo
      set({
        faseJogo: 'aguardando_inicio',
        rodadaAtual: 1,
        turnoAtual: 0,
        jogadorAtual: null,
        ordemJogadores: [],
        ordemDefinida: false,
        resultadosDados: {},
        ehMeuTurno: false,
        turnoIniciado: false,
        cooldownRoleplay: 0,
        session: null,
        combateAtivo: false,
        combateMonstros: [],
        combateJogadores: {},
        combateRodada: 0,
        combateResultado: null,
        combateLog: [],
        combateXpGanho: 0
      });
      
      get().log('Sessão resetada', { historiaId: data.historiaId, success: true });

      if (window.showGameNotification) {
        window.showGameNotification(`Sessão resetada pelo dono da história: ${data.historiaNome || ''}`, 'warning');
      }
    });

    socket.on('sessao_encerrada', (data) => {

      set({
        faseJogo: 'aguardando_inicio',
        rodadaAtual: 1,
        turnoAtual: 0,
        jogadorAtual: null,
        ordemJogadores: [],
        ordemDefinida: false,
        resultadosDados: {},
        ehMeuTurno: false,
        turnoIniciado: false,
        cooldownRoleplay: 0,
        session: null,
        combateAtivo: false,
        combateMonstros: [],
        combateJogadores: {},
        combateRodada: 0,
        combateResultado: null,
        combateLog: [],
        combateXpGanho: 0,
        // Salvar dados do recap para exibir na tela antes de sair
        sessionRecap: {
          resumo: data.resumo || null,
          historiaNome: data.historiaNome || null,
          xpGanho: data.xpGanho || 0,
          loot: data.loot || []
        }
      });

      get().log('Sessão encerrada', { salaId: data.salaId, success: true });

      if (window.showGameNotification) {
        window.showGameNotification(`Sessão encerrada: ${data.motivo || 'Encerrada pelo administrador'}`, 'info');
      }
    });

    // ===== LISTENERS DE ERROS DO SISTEMA =====

    socket.on('erro_sistema', (data) => {
      set({ erroMensagem: data.message || 'Erro do sistema' });
      if (window.showGameNotification) {
        window.showGameNotification(data.message || 'Erro do sistema', 'error');
      }
    });

    socket.on('erro_mensagem', (data) => {
      set({ erroMensagem: data.message || 'Erro ao enviar mensagem' });
      if (window.showGameNotification) {
        window.showGameNotification(data.message || 'Erro ao enviar mensagem', 'error');
      }
    });

    socket.on('erro_dado_inicial', (data) => {
      if (window.showGameNotification) {
        window.showGameNotification(data.message || 'Erro ao rolar dado inicial', 'error');
      }
    });

    socket.on('rate_limit_exceeded', (data) => {
      set({ rateLimitExceeded: true });
      if (window.showGameNotification) {
        window.showGameNotification(data.message || 'Muitas mensagens! Aguarde um momento.', 'warning');
      }
      setTimeout(() => set({ rateLimitExceeded: false }), data.retryAfter || 5000);
    });

    // ===== LISTENERS DO SISTEMA DE COMBATE =====

    socket.on('combate_iniciado', (data) => {
      set({
        combateAtivo: true,
        combateMonstros: data.monstros || [],
        combateJogadores: data.jogadores || {},
        combateRodada: data.rodada || 1,
        combateResultado: null,
        combateLog: [],
        combateXpGanho: 0
      });
      get().log('Combate iniciado', { monstros: data.monstros?.length, success: true });
    });

    socket.on('combate_resultado_acao', (data) => {
      const { combateMonstros, combateJogadores, combateLog } = get();

      // Atualizar HP do alvo
      if (data.tipo === 'ataque_jogador' && data.alvo?.id) {
        const monstrosAtualizados = combateMonstros.map(m => {
          if (m.id === data.alvo.id) {
            return { ...m, hp_atual: data.hpRestante, status: data.hpRestante <= 0 ? 'derrotado' : m.status };
          }
          return m;
        });
        set({ combateMonstros: monstrosAtualizados });
      }

      if (data.tipo === 'ataque_monstro' && data.alvo?.userId) {
        const jogadoresAtualizados = { ...combateJogadores };
        if (jogadoresAtualizados[data.alvo.userId]) {
          jogadoresAtualizados[data.alvo.userId] = {
            ...jogadoresAtualizados[data.alvo.userId],
            hp_atual: data.hpRestante,
            status: data.hpRestante <= 0 ? 'derrotado' : 'vivo'
          };
        }
        set({ combateJogadores: jogadoresAtualizados });
      }

      // Adicionar ao log
      set({ combateLog: [...combateLog.slice(-(COMBAT.LOG_MAX_ENTRIES - 1)), data] });
      get().log('Ação combate processada', { tipo: data.tipo, acertou: data.acertou });
    });

    socket.on('combate_monstro_derrotado', (data) => {
      const { combateMonstros } = get();
      const monstrosAtualizados = combateMonstros.map(m => {
        if (m.id === data.monstro?.id) {
          return { ...m, status: 'derrotado', hp_atual: 0 };
        }
        return m;
      });
      set({ combateMonstros: monstrosAtualizados });
      get().log('Monstro derrotado', { nome: data.monstro?.nome, xp: data.xp });
    });

    socket.on('combate_jogador_ferido', (data) => {
      const { combateJogadores } = get();
      const jogadoresAtualizados = { ...combateJogadores };
      if (jogadoresAtualizados[data.userId]) {
        jogadoresAtualizados[data.userId] = {
          ...jogadoresAtualizados[data.userId],
          hp_atual: data.hp_atual,
          status: data.derrotado ? 'derrotado' : 'vivo'
        };
      }
      set({ combateJogadores: jogadoresAtualizados });
      get().log('Jogador ferido', { nome: data.nome, hp: data.hp_atual });
    });

    socket.on('combate_finalizado', (data) => {
      set({
        combateAtivo: false,
        combateResultado: data.resultado,
        combateXpGanho: data.xpTotal || 0
      });
      get().log('Combate finalizado', { resultado: data.resultado, xp: data.xpTotal, success: true });
    });

    socket.on('combate_estado', (data) => {
      set({
        combateMonstros: data.monstros || get().combateMonstros,
        combateJogadores: data.jogadores || get().combateJogadores,
        combateRodada: data.rodada || get().combateRodada,
        combateLog: data.log || get().combateLog
      });
    });

    // ===== LISTENER DE AÇÕES MECÂNICAS DO MESTRE =====
    socket.on('acao_mestre', (data) => {
      const { combateJogadores } = get();
      const jogador = data.userId && combateJogadores[data.userId];

      if (data.tipo === 'curado' && get().combateAtivo && jogador) {
        const updated = { ...combateJogadores };
        updated[data.userId] = { ...updated[data.userId], hp_atual: data.hp_atual, status: data.hp_atual > 0 ? 'vivo' : updated[data.userId].status };
        set({ combateJogadores: updated });
      }
      if (data.tipo === 'dano_recebido' && get().combateAtivo && jogador) {
        const updated = { ...combateJogadores };
        updated[data.userId] = { ...updated[data.userId], hp_atual: data.hp_atual, status: data.derrotado ? 'derrotado' : 'vivo' };
        set({ combateJogadores: updated });
      }
      if (data.tipo === 'status_aplicado' && get().combateAtivo && jogador) {
        const updated = { ...combateJogadores };
        const efeitos = [...(updated[data.userId].status_efeitos || [])];
        const existente = efeitos.findIndex(e => e.nome === data.status);
        if (existente >= 0) {
          efeitos[existente] = { nome: data.status, duracao: data.duracao || 3 };
        } else {
          efeitos.push({ nome: data.status, duracao: data.duracao || 3 });
        }
        updated[data.userId] = { ...updated[data.userId], status_efeitos: efeitos };
        set({ combateJogadores: updated });
      }
      if (data.tipo === 'status_removido' && get().combateAtivo && jogador) {
        const updated = { ...combateJogadores };
        const efeitos = (updated[data.userId].status_efeitos || []).filter(e => e.nome !== data.status);
        updated[data.userId] = { ...updated[data.userId], status_efeitos: efeitos };
        set({ combateJogadores: updated });
      }
      get().log('Ação do Mestre', { tipo: data.tipo, personagem: data.personagem });
    });

    // ===== LISTENER DE LEVEL UP (store-level para não perder evento) =====
    socket.on('level_up', (data) => {
      set({
        lastLevelUp: {
          userId: data.userId,
          username: data.personagemNome || data.username,
          novoNivel: data.novoNivel || data.nivel,
          ganhos: data.ganhos || {},
          timestamp: Date.now()
        }
      });
      get().log('Level Up', { userId: data.userId, nivel: data.novoNivel || data.nivel, success: true });
    });

    // ===== LISTENER DE LOOT PÓS-COMBATE =====
    socket.on('combate_loot', (data) => {
      set({ lastCombateLoot: data });
      get().log('Combate Loot', { totalItens: data.todosItens?.length || 0 });
    });

    // ✅ NOVO: Listener para usuário entrando na sala
    socket.on('user_joined', (data) => {
      
      // Atualizar lista de participantes
      const { participantes = [] } = get();
      
      // Verificar se já existe
      const jaExiste = participantes.find(p => String(p.userId) === String(data.userId));
      
      if (!jaExiste) {
        const novoParticipante = {
          userId: data.userId,
          username: data.username,
          personagemId: data.personagemId,
          personagemNome: data.personagemNome,
          status: data.status || 'selecionando',
          isReconnection: data.isReconnection
        };
        
        set({ participantes: [...participantes, novoParticipante] });
      } else {
      }
      
      get().log('Usuario entrou', { username: data.username, success: true });
    });

    // ✅ NOVO: Listener para usuário saindo da sala
    socket.on('user_left', (data) => {
      
      // Remover da lista de participantes
      const { participantes = [] } = get();
      const participantesAtualizados = participantes.filter(
        p => String(p.userId) !== String(data.userId)
      );
      
      set({ participantes: participantesAtualizados });
      
      get().log('Usuario saiu', { username: data.username, success: true });
    });
  },

  // ===== MONITOR DE CONEXÃO =====
  startConnectionMonitor: () => {
    const { configs } = get();
    
    const monitor = setInterval(() => {
      const { socket, isConnected } = get();
      if (socket && isConnected) {
        socket.emit('ping');
        set({ lastPingTime: Date.now() });
      }
    }, configs.MONITOR_INTERVAL);
    
    set({ connectionMonitor: monitor });
  },

  stopConnectionMonitor: () => {
    const { connectionMonitor } = get();
    if (connectionMonitor) {
      clearInterval(connectionMonitor);
      set({ connectionMonitor: null });
    }
  },

  // ===== CONEXÃO PRINCIPAL =====
  // Usado por: JogoView - quando entra na sala de espera
  connect: async (authData = null) => {
    const { isConnected, isConnecting, socket, socketToken, validateToken, log, setupInternalListeners, startConnectionMonitor, configs, connectionOptions } = get();

    return new Promise((resolve, reject) => {
      try {
        // Usar socketToken do estado se não for fornecido via parâmetro
        const token = authData?.token || socketToken;
        
        log('Connection starting', { hasAuth: !!token });

        // Validação de token
        if (token && !validateToken(token)) {
          // Token inválido ou expirado - fornecer informação detalhada
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiryDate = new Date(payload.exp * 1000);
            const now = new Date();
            
            log('Invalid or expired token provided', {
              expiresAt: expiryDate.toLocaleString(),
              currentTime: now.toLocaleString(),
              isExpired: expiryDate <= now,
              suggestion: 'Token deve ser renovado antes da conexão WebSocket'
            }, 'error');
          } catch (e) {
            log('Invalid token format', {}, 'error');
          }
          
          return reject(new Error('Token inválido ou expirado. Por favor, tente novamente.'));
        }

        if (isConnected && socket) {
          log('Already connected', { success: true });
          return resolve();
        }

        set({ 
          isConnecting: true, 
          error: null,
          connectionStartTime: Date.now() 
        });
        
        // Preparar opções de conexão com token
        const options = {
          ...connectionOptions,
          auth: token ? { token } : (authData || {})
        };

        const newSocket = io(WS_BASE_URL, options);
        set({ socket: newSocket });
        
        setupInternalListeners();
        
        const timeout = setTimeout(() => {
          log('Connection timeout', {}, 'error');
          reject(new Error(`Timeout de conexão após ${configs.CONNECTION_TIMEOUT}ms`));
        }, configs.CONNECTION_TIMEOUT);

        newSocket.once('connect', () => {
          clearTimeout(timeout);
          set({ 
            isConnected: true, 
            isConnecting: false,
            lastConnectionTime: Date.now()
          });
          log('Connected successfully', { 
            socketId: newSocket.id,
            duration: Date.now() - get().connectionStartTime,
            success: true 
          });
          startConnectionMonitor();
          resolve();
        });

        newSocket.once('connect_error', (error) => {
          clearTimeout(timeout);
          set({ isConnecting: false });
          log('Connection failed', { error: error.message }, 'error');
          reject(error);
        });

        newSocket.connect();

      } catch (error) {
        set({ isConnecting: false });
        log('Connection exception', { error: error.message }, 'error');
        reject(error);
      }
    });
  },

  // ===== AUTENTICAÇÃO =====
  // Usado por: JogoView - após conectar ao WebSocket
  authenticate: async (authData) => {
    const { socket, isAuthenticated, configs, log } = get();

    return new Promise((resolve, reject) => {
      if (!socket || !socket.connected) {
        return reject(new Error('WebSocket não conectado'));
      }

      if (isAuthenticated) {
        log('Already authenticated', { success: true });
        return resolve({ user: get().currentUser });
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Timeout de autenticação após ${configs.AUTH_TIMEOUT}ms`));
      }, configs.AUTH_TIMEOUT);

      const cleanup = () => {
        clearTimeout(timeout);
        socket.off('authenticated', onAuthenticated);
        socket.off('authentication_error', onAuthError);
      };

      const onAuthenticated = (data) => {
        cleanup();
        resolve(data);
      };

      const onAuthError = (error) => {
        cleanup();
        reject(new Error(error.message));
      };

      socket.once('authenticated', onAuthenticated);
      socket.once('authentication_error', onAuthError);
      socket.emit('authenticate', authData);
    });
  },

  // ===== GERENCIAMENTO DE SALAS =====
  // Usado por: EtapaSalaEspera - ao entrar na sala de espera
  joinRoom: async (roomData) => {
    const { socket, isConnected, isAuthenticated, configs, log, prepareRoomData } = get();

    return new Promise((resolve, reject) => {
      if (!socket || !isConnected) {
        return reject(new Error('WebSocket não conectado'));
      }

      if (!isAuthenticated) {
        return reject(new Error('Usuário não autenticado'));
      }

      const sessionId = Date.now().toString();
      const joinData = prepareRoomData(roomData, sessionId);

      log('Joining room', { roomId: joinData.roomId, username: joinData.username });

      const timeout = setTimeout(() => {
        reject(new Error(`Timeout ao entrar na sala após ${configs.ROOM_TIMEOUT}ms`));
      }, configs.ROOM_TIMEOUT);

      const cleanup = () => {
        clearTimeout(timeout);
        socket.off('room_joined', onJoined);
        socket.off('join_room_error', onError);
        socket.off('error', onGenericError);
      };

      const onJoined = (data) => {
        cleanup();
        log('Room joined', { roomId: data.roomId, users: data.users?.length, success: true });
        
        // ✅ ATUALIZAR PARTICIPANTES DA SESSÃO
        if (data.sessao?.jogadoresConectados) {
          
          const participantesFormatados = data.sessao.jogadoresConectados.map(j => ({
            userId: j.userId,
            username: j.username,
            personagemId: j.personagemId,
            personagemNome: j.personagemNome,
            status: j.status || 'selecionando'
          }));
          
          set({ participantes: participantesFormatados });
        }
        
        resolve(data);
      };

      const onError = (error) => {
        cleanup();
        log('Join room error', { error: error.message }, 'error');
        reject(new Error(error.message));
      };

      const onGenericError = (error) => {
        cleanup();
        log('Join room generic error', { error: error.message || error }, 'error');
        reject(new Error(error.message || 'Erro ao entrar na sala'));
      };

      socket.once('room_joined', onJoined);
      socket.once('join_room_error', onError);
      socket.once('error', onGenericError);
      
      // Log dos dados sendo enviados
      log('Emitting join_room', { 
        roomId: joinData.roomId, 
        userId: joinData.userId, 
        username: joinData.username,
        historiaId: joinData.historiaId,
        personagemId: joinData.personagemId
      });
      
      socket.emit('join_room', joinData);
    });
  },

  // Usado por: EtapaSalaEspera - ao sair da sala
  leaveRoom: async () => {
    const { socket, isConnected, configs, log } = get();

    return new Promise((resolve, reject) => {
      if (!socket || !isConnected) {
        return reject(new Error('WebSocket não conectado'));
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Timeout ao sair da sala após ${configs.ROOM_TIMEOUT}ms`));
      }, configs.ROOM_TIMEOUT);

      const cleanup = () => {
        clearTimeout(timeout);
        socket.off('room_left', onLeft);
        socket.off('leave_room_error', onError);
      };

      const onLeft = (result) => {
        cleanup();
        set({ 
          inRoom: false,
          roomId: null,
          session: null,
          roomUsers: []
        });
        log('Room left', { success: true });
        resolve(result);
      };

      const onError = (error) => {
        cleanup();
        log('Leave room error', { error: error.message }, 'error');
        reject(new Error(error.message));
      };

      socket.once('room_left', onLeft);
      socket.once('leave_room_error', onError);
      socket.emit('leave_room', {});
    });
  },

  // ===== MÉTODOS DE ENVIO =====
  // Usado por: ChatArea - envio de mensagens no chat
  sendMessage: (messageData) => {
    const { socket, isConnected, safeEmit } = get();
    if (socket && isConnected) {
      safeEmit('chat_message', messageData);
    }
  },

  // Usado por: PainelJogadores - ações dos jogadores
  playerAction: (actionData) => {
    const { socket, isConnected, safeEmit } = get();
    if (socket && isConnected) {
      safeEmit('rpg_action', actionData);
    }
  },

  // Usado por: InputArea - rolagem de dados
  rollDice: (diceData) => {
    const { socket, isConnected, safeEmit } = get();
    if (socket && isConnected) {
      safeEmit('dice_roll', diceData);
    }
  },

  // Usado por: StatusPersonagem - atualização de status
  updateStatus: (statusData) => {
    const { socket, isConnected, safeEmit } = get();
    if (socket && isConnected) {
      safeEmit('update_status', statusData);
    }
  },

  // Usado por: EtapaSalaEspera - iniciar jogo (mestre)
  startSession: async (sessionData) => {
    const { socket, isConnected, configs, log } = get();

    return new Promise((resolve, reject) => {
      if (!socket || !isConnected) {
        return reject(new Error('WebSocket não conectado'));
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Timeout ao iniciar sessão após ${configs.SESSION_TIMEOUT}ms`));
      }, configs.SESSION_TIMEOUT);

      const cleanup = () => {
        clearTimeout(timeout);
        socket.off('session_started', onStarted);
        socket.off('start_session_error', onError);
      };

      const onStarted = (result) => {
        cleanup();
        set({ session: result.session });
        log('Session started', { sessionId: result.session?.id, success: true });
        resolve(result);
      };

      const onError = (error) => {
        cleanup();
        log('Start session error', { error: error.message }, 'error');
        reject(new Error(error.message));
      };

      socket.once('session_started', onStarted);
      socket.once('start_session_error', onError);
      socket.emit('start_session', sessionData);
    });
  },

  // ===== AÇÕES DO SISTEMA DE TURNOS E RODADAS =====

  // Usado por: InputArea - rolar dado inicial (d20)
  rolarDadoInicial: () => {
    const { socket, isConnected, roomId, currentUser, safeEmit, log } = get();
    
    if (!socket || !isConnected) {
      log('Não conectado para rolar dado', {}, 'error');
      return false;
    }

    if (!roomId || !currentUser) {
      log('Faltam dados para rolar dado', { roomId: !!roomId, user: !!currentUser }, 'error');
      return false;
    }

    const dadoData = {
      roomId,
      userId: currentUser.id,
      username: currentUser.username || currentUser.nome
    };

    log('Rolando dado inicial', { userId: currentUser.id });
    return safeEmit('rolar_dado_inicial', dadoData);
  },

  // Usado por: InputArea - iniciar turno (receber mensagem inicial do Mestre)
  iniciarTurno: () => {
    const { socket, isConnected, roomId, currentUser, safeEmit, log } = get();
    
    if (!socket || !isConnected) {
      log('Não conectado para iniciar turno', {}, 'error');
      return false;
    }

    if (!roomId || !currentUser) {
      log('Faltam dados para iniciar turno', { roomId: !!roomId, user: !!currentUser }, 'error');
      return false;
    }

    const turnoData = {
      roomId,
      userId: currentUser.id,
      username: currentUser.username || currentUser.nome
    };

    log('Iniciando turno', { userId: currentUser.id });
    return safeEmit('iniciar_turno', turnoData);
  },

  // ===== MÉTODOS UTILITÁRIOS =====
  safeEmit: (event, data) => {
    const { socket, isConnected, log } = get();
    if (!socket || !isConnected) {
      log('Cannot emit - not connected', { event }, 'error');
      return false;
    }

    try {
      socket.emit(event, data);
      log('Event emitted', { event, hasData: !!data });
      return true;
    } catch (error) {
      log('Emit failed', { event, error: error.message }, 'error');
      return false;
    }
  },

  // Preparação de dados para sala
  prepareRoomData: (roomData, sessionId) => {
    const { normalizarDadosUsuario, normalizarDadosHistoria } = get();
    const userData = normalizarDadosUsuario(roomData);
    const historiaData = normalizarDadosHistoria(roomData);

    return {
      roomId: `historia_${historiaData.id}`,
      userId: userData.id,
      username: userData.name,
      historiaId: historiaData.id,
      historiaData,
      personagemId: roomData.personagemId,
      personagemNome: roomData.personagemNome,
      sessionId
    };
  },

  // Normalização de dados de usuário
  normalizarDadosUsuario: (userData) => {
    if (!userData) {
      throw new Error('Dados do usuário são obrigatórios');
    }

    const normalized = {
      id: userData.userId || userData.id,
      name: userData.username || userData.nome || userData.name,
      email: userData.email || '',
      role: userData.role || userData.tipo || 'jogador'
    };

    if (!normalized.id) {
      throw new Error('ID do usuário é obrigatório');
    }
    if (!normalized.name) {
      throw new Error('Nome do usuário é obrigatório');
    }

    return normalized;
  },

  // Normalização de dados de história
  normalizarDadosHistoria: (historiaData) => {
    if (!historiaData) {
      throw new Error('Dados da história são obrigatórios');
    }

    const normalized = {
      id: historiaData.historiaId || historiaData.id,
      titulo: historiaData.titulo || historiaData.nome,
      nome: historiaData.nome || historiaData.titulo,
      userId: historiaData.userId,
      criador: historiaData.criador || 'Criador desconhecido',
      descricao: historiaData.descricao || '',
      tema: historiaData.tema || '',
      status: historiaData.status || 'ativa'
    };

    if (!normalized.id) {
      throw new Error('ID da história é obrigatório');
    }

    return normalized;
  },

  // ===== CONEXÃO AUTOMÁTICA (USADO PELAS VIEWS) =====
  // Usado por: JogoView - conexão automática na sala de espera
  connectToSocket: async (authData = null) => {
    const { isConnected, isConnecting, connect, authenticate } = get();

    // Evitar múltiplas tentativas de conexão
    if (isConnected || isConnecting) {
      return;
    }

    try {
      // Conectar ao WebSocket
      await connect(authData);

      // Se há dados de autenticação, autenticar automaticamente
      if (authData?.token) {
        await authenticate(authData);
      }

    } catch (error) {
      console.error('❌ SocketStore: Erro na conexão automática:', error.message);
      set({ error: error.message });
      throw error;
    }
  },

  // ===== GERENCIAMENTO DE SOCKET TOKEN =====
  // Armazenar token do socket (recebido do backend no login/refresh)
  setSocketToken: (token) => {
    set({ socketToken: token });
  },

  // Limpar token do socket (no logout)
  clearSocketToken: () => {
    set({ socketToken: null });
  },

  // ===== DISCONNECT E CLEANUP =====
  // Usado por: Todas as views ao desmontar ou navegar
  disconnect: () => {
    const { socket, stopConnectionMonitor } = get();
    
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }

    stopConnectionMonitor();
    
    set({
      socket: null,
      isConnected: false,
      isConnecting: false,
      isAuthenticated: false,
      inRoom: false,
      roomId: null,
      session: null,
      currentUser: null,
      userRole: null,
      socketToken: null, // Limpar token ao desconectar
      roomUsers: [],
      error: null
    });
  },

  // Reset completo do estado
  resetSocketState: () => {
    const { disconnect } = get();
    disconnect();
    
    set({
      listeners: new Map(),
      connectionStartTime: null,
      connectionMonitor: null,
      lastConnectionTime: null,
      connectionAttempts: 0,
      lastPingTime: null,
      latency: 0,
      isTyping: false,
      typingTimeout: null,
      rateLimitExceeded: false,
      rateLimitResetTime: null,
      lastMessageTime: null,
      aventuraIniciada: false
    });
  }
}); 