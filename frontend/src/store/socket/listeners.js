/**
 * Socket Store - Listeners internos: todos os socket.on() do jogo
 */
import { COMBAT } from '../../constants/game';
import { transicaoFase } from './faseMachine.js';
import { playSound } from '../../utils/audio.js';
import { sendNotification } from '../../utils/notifications.js';

export const createListenerActions = (set, get) => ({
  setupInternalListeners: () => {
    const { socket, listeners: storedListeners } = get();

    // Limpar apenas listeners internos do socket (não os de componentes via socketStoreOn)
    // removeAllListeners() destruía listeners de EtapaJogoRPG registrados via on()
    const internalEvents = [
      'connect', 'disconnect', 'connect_error',
      'authenticated', 'authentication_error',
      'room_joined', 'room_left', 'room_users', 'connection_error',
      'fase_atualizada', 'aventura_iniciada', 'resultado_dado_inicial',
      'ordem_definida', 'turno_alterado', 'mestre_finalizou_turno',
      'turno_iniciado', 'rodada_finalizada', 'nova_rodada_iniciada',
      'turno_estado_atualizado', 'teste_rejeitado',
      'erro_cooldown_roleplay', 'erro_turno', 'server_message', 'force_disconnect',
      'mestre_solicita_dados', 'solicitacao_dados', 'mensagem_roleplay',
      'sessao_resetada', 'sessao_encerrada',
      'erro_sistema', 'erro_mensagem', 'erro_dado_inicial', 'rate_limit_exceeded',
      'combate_iniciado', 'combate_resultado_acao', 'combate_monstro_derrotado',
      'combate_jogador_ferido', 'combate_finalizado', 'combate_estado',
      'acao_mestre', 'level_up', 'combate_loot',
      'user_joined', 'user_left',
    ];
    for (const event of internalEvents) {
      socket.removeAllListeners(event);
    }

    // Limpar listeners de Manager (socket.io) para evitar acumulação em reconexões
    socket.io.off('reconnect');
    socket.io.off('reconnect_attempt');
    socket.io.off('reconnect_failed');

    // ===== LISTENERS DE CONEXÃO =====
    socket.on('connect', () => {
      set({ isConnected: true, isConnecting: false });
      get().log('Connected successfully', { socketId: socket.id, success: true });
    });

    socket.on('disconnect', (reason) => {
      const isIntentional = reason === 'io client disconnect';
      const prevRoomId = get().roomId;

      set({
        isConnected: false,
        isAuthenticated: false,
        inRoom: false,
        // Preservar roomId para auto-rejoin em reconexões não-intencionais
        roomId: isIntentional ? null : prevRoomId
      });
      get().log('Disconnected', { reason, preservedRoomId: isIntentional ? null : prevRoomId });

      if (!isIntentional && window.showGameNotification) {
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

    // ===== LISTENERS DE RECONEXÃO =====
    socket.io.on('reconnect', (attempt) => {
      set({ isConnected: true, isReconnecting: false, error: null });
      if (window.showGameNotification) {
        window.showGameNotification('Reconectado com sucesso!', 'success');
      }

      // Recuperar dados de auth para re-autenticar
      const { socketToken, currentUser, roomId } = get();
      let userId = currentUser?.id;
      let username = currentUser?.username;

      // Fallback: recuperar do localStorage se currentUser foi limpo
      if (!userId || !username) {
        try {
          const storedUser = JSON.parse(localStorage.getItem('user'));
          userId = userId || storedUser?.id;
          username = username || storedUser?.username || storedUser?.nome;
        } catch (e) { /* silent */ }
      }

      if (userId && username) {
        const authData = { userId, username };
        if (socketToken) authData.token = socketToken;

        socket.emit('authenticate', authData);

        // Após re-auth, re-entrar na sala se estava em uma
        const savedRoomId = roomId;
        if (savedRoomId) {
          socket.once('authenticated', () => {
            get().log('Re-joining room after reconnect', { roomId: savedRoomId });
            socket.emit('join_room', { roomId: savedRoomId, userId });
          });
        }
      } else {
        get().log('Cannot re-authenticate: missing userId/username', {}, 'warn');
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

    // ===== LISTENERS DE AUTENTICAÇÃO =====
    socket.on('authenticated', (data) => {
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

    // ===== LISTENERS DE ROOM =====
    socket.on('room_joined', (data) => {
      // Recuperar estado do jogo ao reconectar
      const estadoJogo = data.sessao?.estadoJogo || data.session?.estadoJogo;

      if (estadoJogo) {
        const currentUser = get().currentUser;
        const updateData = {};

        if (estadoJogo.fase) {
          updateData.faseJogo = estadoJogo.fase;
        }
        if (estadoJogo.rodadaAtual !== undefined) {
          updateData.rodadaAtual = estadoJogo.rodadaAtual;
        }
        if (estadoJogo.turnoAtual !== undefined) {
          updateData.turnoAtual = estadoJogo.turnoAtual;
        }
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
        if (estadoJogo.turnoIniciado !== undefined) {
          updateData.turnoIniciado = estadoJogo.turnoIniciado;
        }
        if (estadoJogo.turno?.status) {
          updateData.turnoStatus = estadoJogo.turno.status;
        }
        if (Array.isArray(estadoJogo.testesPendentes)) {
          updateData.testesPendentes = estadoJogo.testesPendentes;
        }
        if (estadoJogo.testePendente !== undefined) {
          updateData.testePendente = estadoJogo.testePendente;
        }
        if (estadoJogo.rolagemInicial) {
          updateData.resultadosDados = estadoJogo.rolagemInicial;
        }
        if (estadoJogo.combate?.ativo) {
          updateData.combateAtivo = true;
          updateData.combateMonstros = estadoJogo.combate.monstros || [];
          updateData.combateJogadores = estadoJogo.combate.jogadores || {};
          updateData.combateRodada = estadoJogo.combate.rodadaCombate || 1;
          updateData.combateLog = (estadoJogo.combate.log || []).slice(-COMBAT.LOG_MAX_ENTRIES);
        }

        set(updateData);
      }

      set({
        inRoom: true,
        roomId: data.roomId,
        session: data.sessao || data.session,
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

    socket.on('fase_atualizada', (data) => {
      set({
        faseJogo: data.fase,
        estadoJogo: data.estadoJogo || get().estadoJogo
      });
      get().log('Fase atualizada', { fase: data.fase, success: true });
    });

    socket.on('aventura_iniciada', (data) => {
      set(state => ({
        faseJogo: transicaoFase(state.faseJogo, 'rolagem_inicial'),
        aventuraIniciada: true
      }));
      get().log('Aventura iniciada', {
        historiaId: data.historiaId,
        historiaNome: data.historiaNome,
        success: true
      });
    });

    socket.on('resultado_dado_inicial', (data) => {
      const { resultadosDados = {} } = get();
      resultadosDados[data.userId] = {
        valor: data.valor,
        username: data.username,
        personagemNome: data.personagemNome,
        timestamp: data.timestamp
      };

      set({ resultadosDados: { ...resultadosDados } });
      playSound('dice_roll');

      get().log('Dado inicial rolado', {
        userId: data.userId,
        valor: data.valor,
        success: true
      });
    });

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

    socket.on('turno_alterado', (data) => {
      const currentUser = get().currentUser;
      const ehMeuTurno = currentUser && String(data.jogadorAtual?.userId) === String(currentUser.id);

      // Preservar valorDado existente ao atualizar ordemJogadores
      let ordemAtualizada = data.ordemCompleta || get().ordemJogadores;
      if (data.ordemCompleta) {
        const ordemAnterior = get().ordemJogadores;
        const dadosMap = {};
        ordemAnterior.forEach(j => {
          if (j.valorDado != null) dadosMap[j.userId || j.id] = j.valorDado;
        });
        ordemAtualizada = data.ordemCompleta.map(j => {
          const uid = j.userId || j.id;
          if (j.valorDado == null && dadosMap[uid] != null) {
            return { ...j, valorDado: dadosMap[uid] };
          }
          return j;
        });
      }

      set({
        rodadaAtual: data.rodadaAtual,
        turnoAtual: data.turnoAtual,
        jogadorAtual: data.jogadorAtual,
        ordemJogadores: ordemAtualizada,
        ehMeuTurno,
        turnoIniciado: false,
        turnoStatus: 'idle',
        testePendente: null,
        testesPendentes: []
      });

      if (ehMeuTurno) {
        playSound('my_turn');
        sendNotification('Lunaria - É sua vez!', { body: 'Seu turno começou. Volte ao jogo!' });
        if (typeof window !== 'undefined' && window.showGameNotification) {
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

    socket.on('mestre_finalizou_turno', (data) => {
      get().log('Mestre finalizou turno', {
        jogador: data.jogador,
        contador: data.contador,
        success: true
      });
    });

    socket.on('turno_iniciado', (data) => {
      const currentUser = get().currentUser;
      const ehMeuTurno = currentUser && String(data.userId) === String(currentUser.id);

      if (ehMeuTurno) {
        set({
          turnoIniciado: true,
          turnoStatus: data.turnoEstado?.status || 'active'
        });
      }

      get().log('Turno iniciado', { userId: data.userId, success: true });
    });

    socket.on('turno_estado_atualizado', (data) => {
      const currentUser = get().currentUser;
      const jogadorAtual = data.turno?.jogadorAtual;
      const testesPendentes = Array.isArray(data.testesPendentes)
        ? data.testesPendentes
        : (data.testePendente ? [data.testePendente] : []);
      const ehMeuTurno = currentUser && jogadorAtual != null
        ? String(jogadorAtual) === String(currentUser.id)
        : false;
      const jogadorAtualPayload = jogadorAtual == null
        ? null
        : (typeof jogadorAtual === 'object'
            ? jogadorAtual
            : (get().ordemJogadores || []).find(j => String(j.userId || j.id) === String(jogadorAtual)) || { userId: jogadorAtual });

      set({
        turnoStatus: data.turno?.status || 'idle',
        turnoIniciado: ['starting', 'active', 'awaiting_roll', 'resolving_roll'].includes(data.turno?.status),
        testePendente: data.testePendente || testesPendentes[0] || null,
        testesPendentes,
        jogadorAtual: jogadorAtualPayload,
        ehMeuTurno
      });
    });

    socket.on('teste_rejeitado', (data) => {
      if (window.showGameNotification) {
        window.showGameNotification('Essa rolagem não corresponde ao teste pendente.', 'warning');
      }
      get().log('Teste rejeitado', data, 'warn');
    });

    socket.on('rodada_finalizada', (data) => {
      set(state => ({
        faseJogo: transicaoFase(state.faseJogo, 'entre_rodadas'),
        rodadaFinalizada: data.rodada,
        ehMeuTurno: false,
        turnoIniciado: false,
        turnoStatus: 'idle',
        jogadorAtual: null,
        testePendente: null,
        testesPendentes: []
      }));
      get().log('Rodada finalizada', { rodada: data.rodada, success: true });
    });

    socket.on('nova_rodada_iniciada', (data) => {
      set(state => ({
        faseJogo: transicaoFase(state.faseJogo, 'rodada_em_andamento'),
        rodadaAtual: data.rodada,
        turnoAtual: 0,
        rodadaFinalizada: null,
        turnoStatus: 'idle',
        testePendente: null,
        testesPendentes: [],
        ehMeuTurno: false
      }));
      get().log('Nova rodada iniciada', { rodada: data.rodada, success: true });
    });

    socket.on('erro_cooldown_roleplay', (data) => {
      set({
        cooldownRoleplay: data.segundosRestantes || 0,
        erroMensagem: data.message
      });
      get().log('Cooldown roleplay ativo', { segundos: data.segundosRestantes });
    });

    socket.on('erro_turno', (data) => {
      set({ erroMensagem: data.message });
      if (window.showGameNotification) {
        window.showGameNotification(data.message || 'Não é seu turno!', 'warning');
      }
      get().log('Erro ao enviar mensagem fora do turno', { message: data.message });
    });

    socket.on('server_message', (data) => {
      if (window.showGameNotification) {
        window.showGameNotification(data.mensagem || data.message || 'Mensagem do servidor', 'warning');
      }
      get().log('Server message', { mensagem: data.mensagem });
    });

    socket.on('force_disconnect', (data) => {
      set({ isConnected: false });
      if (window.showGameNotification) {
        window.showGameNotification(data.reason || 'Conexão encerrada: você abriu o jogo em outra aba.', 'error');
      }
      get().log('Force disconnect', { reason: data.reason });
    });

    socket.on('solicitacao_dados', (data) => {
      if (window.showGameNotification) {
        window.showGameNotification(`🎲 O Mestre solicita rolagem de dados!`, 'info');
      }
      get().log('Solicitação de dados manual', { data });
    });

    socket.on('mensagem_roleplay', (data) => {
      get().log('Mensagem roleplay recebida', { userId: data.userId });
    });

    // ===== LISTENERS DE SESSÃO =====

    socket.on('sessao_resetada', (data) => {
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
        turnoStatus: 'idle',
        testePendente: null,
        testesPendentes: [],
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
        turnoStatus: 'idle',
        testePendente: null,
        testesPendentes: [],
        cooldownRoleplay: 0,
        session: null,
        combateAtivo: false,
        combateMonstros: [],
        combateJogadores: {},
        combateRodada: 0,
        combateResultado: null,
        combateLog: [],
        combateXpGanho: 0,
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

    // ===== LISTENERS DE ERROS =====

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

    // ===== LISTENERS DE COMBATE =====

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
        if (data.acertou && data.dano > 0) playSound('combat_hit');
      }

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
      playSound(data.derrotado ? 'death' : 'combat_hit');
      get().log('Jogador ferido', { nome: data.nome, hp: data.hp_atual });
    });

    socket.on('combate_finalizado', (data) => {
      set({
        combateAtivo: false,
        combateResultado: data.resultado,
        combateXpGanho: data.xpTotal || 0
      });
      get().log('Combate finalizado', { resultado: data.resultado, xp: data.xpTotal, success: true });

      // Auto-limpar resultado após 8s para desmontar o BatalhaUI
      setTimeout(() => {
        const current = get();
        if (current.combateResultado === data.resultado && !current.combateAtivo) {
          set({
            combateResultado: null,
            combateMonstros: [],
            combateJogadores: {},
            combateRodada: 0,
            combateLog: [],
            combateXpGanho: 0
          });
        }
      }, 8000);
    });

    socket.on('combate_estado', (data) => {
      set({
        combateMonstros: data.monstros ?? get().combateMonstros,
        combateJogadores: data.jogadores ?? get().combateJogadores,
        combateRodada: data.rodada ?? get().combateRodada,
        combateLog: data.log ?? get().combateLog
      });
    });

    // ===== LISTENER DE AÇÕES DO MESTRE =====
    socket.on('acao_mestre', (data) => {
      const { combateJogadores } = get();
      const jogador = data.userId && combateJogadores[data.userId];

      if (data.tipo === 'curado') playSound('heal');
      if (data.tipo === 'dano_recebido' && !data.imune) playSound('combat_hit');
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

    // ===== LISTENERS DE PROGRESSÃO =====
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
      playSound('level_up');
      get().log('Level Up', { userId: data.userId, nivel: data.novoNivel || data.nivel, success: true });
    });

    socket.on('combate_loot', (data) => {
      set({ lastCombateLoot: data });
      get().log('Combate Loot', { totalItens: data.todosItens?.length || 0 });
    });

    // ===== LISTENERS DE PARTICIPANTES =====
    socket.on('user_joined', (data) => {
      const { participantes = [] } = get();
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
      }

      get().log('Usuario entrou', { username: data.username, success: true });
    });

    socket.on('user_left', (data) => {
      const { participantes = [] } = get();
      const participantesAtualizados = participantes.filter(
        p => String(p.userId) !== String(data.userId)
      );

      set({ participantes: participantesAtualizados });

      get().log('Usuario saiu', { username: data.username, success: true });
    });

    // Re-registrar listeners de componentes (via socketStoreOn) no socket real
    // Eles sobrevivem na Map do store mas foram removidos do socket acima
    for (const [event, callbacks] of storedListeners) {
      for (const cb of callbacks) {
        socket.on(event, cb);
      }
    }
  },
});
