/**
 * Socket Store - Listeners internos: todos os socket.on() do jogo
 */
import { COMBAT } from '../../constants/game';
import { transicaoFase } from './faseMachine.js';
import { playSound } from '../../utils/audio.js';
import { sendNotification } from '../../utils/notifications.js';
import { showGameNotification } from '../../components/Jogo/NotificationManager.jsx';
import {
  normalizeCombateIniciado,
  normalizeResultadoAcao,
  normalizeJogadorFerido,
  normalizeMonstruoDerrotado,
  normalizeCombateFinalizado,
  normalizeCombateEstado,
} from './dtos.js';

export const createListenerActions = (set, get) => ({
  setupInternalListeners: () => {
    const { socket, listeners: storedListeners } = get();

    // Limpar apenas listeners internos do socket (não os de componentes via socketStoreOn)
    // removeAllListeners() destruía listeners de EtapaJogoRPG registrados via on()
    const internalEvents = [
      'connect', 'disconnect', 'connect_error', 'error',
      'authenticated',
      'room_joined', 'room_left',
      'fase_atualizada', 'aventura_iniciada', 'resultado_dado_inicial',
      'ordem_definida', 'turno_alterado', 'mestre_finalizou_turno',
      'turno_iniciado', 'rodada_finalizada', 'nova_rodada_iniciada',
      'turno_estado_atualizado', 'teste_rejeitado',
      'erro_cooldown_roleplay', 'erro_turno', 'server_message', 'force_disconnect',
      'mestre_solicita_dados', 'mensagem_roleplay',
      'sessao_resetada', 'sessao_encerrada',
      'erro_sistema', 'erro_mensagem', 'erro_dado_inicial', 'rate_limit_exceeded',
      'combate_iniciado', 'combate_resultado_acao', 'combate_monstro_derrotado',
      'combate_jogador_ferido', 'combate_finalizado', 'combate_estado',
      'acao_mestre', 'level_up', 'combate_loot',
      'user_joined', 'user_left',
      'status_jogo_alterado',
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

      if (!isIntentional) {
        showGameNotification('Conexao perdida. Tentando reconectar...', 'warning');
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

    socket.on('error', (data) => {
      const message = data?.message || 'Erro no websocket';
      set({
        error: message,
        erroMensagem: message
      });
      showGameNotification(message, 'error');
      get().log('Socket error', { error: message }, 'error');
    });

    // ===== LISTENERS DE RECONEXÃO =====
    socket.io.on('reconnect', async (attempt) => {
      set({ isConnected: true, isReconnecting: false, error: null });
      showGameNotification('Reconectado com sucesso!', 'success');

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

      if (!userId || !username) {
        get().log('Cannot re-authenticate: missing userId/username', {}, 'warn');
        return;
      }

      // Obter socketToken fresco via /auth/renovar (cookies HttpOnly autenticam)
      let token = socketToken;
      if (!token) {
        try {
          const apiBase = import.meta.env.VITE_API_URL || '';
          const res = await fetch(`${apiBase}/auth/renovar`, {
            method: 'POST',
            credentials: 'include',
          });
          if (res.ok) {
            const data = await res.json();
            token = data?.data?.socketToken;
            if (token) get().setSocketToken(token);
          }
        } catch (e) {
          get().log('Failed to refresh socketToken on reconnect', { err: e.message }, 'warn');
        }
      }

      const authData = { userId, username };
      if (token) authData.token = token;

      socket.emit('authenticate', authData);

      // Após re-auth, re-entrar na sala se estava em uma
      const savedRoomId = roomId;
      if (savedRoomId) {
        socket.once('authenticated', () => {
          get().log('Re-joining room after reconnect', { roomId: savedRoomId });
          socket.emit('join_room', { roomId: savedRoomId, userId });
        });
      }
    });

    socket.io.on('reconnect_attempt', (attempt) => {
      set({ isReconnecting: true, connectionAttempts: attempt });
    });

    socket.io.on('reconnect_failed', () => {
      console.error('❌ Reconexão falhou após todas as tentativas');
      set({ isReconnecting: false, error: 'Nao foi possivel reconectar. Recarregue a pagina.' });
      showGameNotification('Falha na reconexao. Recarregue a pagina.', 'error');
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
        const turnoStatus = estadoJogo.turno?.status || (estadoJogo.turnoIniciado ? 'active' : 'idle');
        const testesPendentes = Array.isArray(estadoJogo.testesPendentes)
          ? estadoJogo.testesPendentes.filter((teste) => teste?.status !== 'resolved' && teste?.status !== 'cancelled')
          : [];
        const testePendenteLegado = !testesPendentes.length && estadoJogo.dadosSolicitados && estadoJogo.testeInfo
          ? {
              ...estadoJogo.testeInfo,
              status: 'pending',
              jogadorAlvo: estadoJogo.testeInfo.jogadorAlvo || estadoJogo.turno?.jogadorAtual || null
            }
          : null;

        updateData.turnoIniciado = ['starting', 'active', 'awaiting_roll', 'resolving_roll'].includes(turnoStatus);
        updateData.turnoStatus = turnoStatus;
        updateData.testesPendentes = testesPendentes.length > 0 ? testesPendentes : (testePendenteLegado ? [testePendenteLegado] : []);
        updateData.testePendente = estadoJogo.testePendente ?? testePendenteLegado ?? updateData.testesPendentes[0] ?? null;

        if (estadoJogo.turno?.jogadorAtual != null) {
          const jogadorAtualTurno = (updateData.ordemJogadores || estadoJogo.ordemJogadores || []).find(
            (jogador) => String(jogador.userId || jogador.id) === String(estadoJogo.turno.jogadorAtual)
          ) || { userId: estadoJogo.turno.jogadorAtual };
          updateData.jogadorAtual = jogadorAtualTurno;
          updateData.ehMeuTurno = currentUser && String(estadoJogo.turno.jogadorAtual) === String(currentUser.id);
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
        showGameNotification(`⚡ É SUA VEZ!`, 'success');
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
        rodadaAtual: data.turno?.rodadaAtual ?? get().rodadaAtual,
        turnoStatus: data.turno?.status || 'idle',
        turnoIniciado: ['starting', 'active', 'awaiting_roll', 'resolving_roll'].includes(data.turno?.status),
        testePendente: data.testePendente || testesPendentes[0] || null,
        testesPendentes,
        jogadorAtual: jogadorAtualPayload,
        ehMeuTurno
      });
    });

    socket.on('teste_rejeitado', (data) => {
      showGameNotification('Essa rolagem não corresponde ao teste pendente.', 'warning');
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
      showGameNotification(data.message || 'Não é seu turno!', 'warning');
      get().log('Erro ao enviar mensagem fora do turno', { message: data.message });
    });

    socket.on('server_message', (data) => {
      showGameNotification(data.mensagem || data.message || 'Mensagem do servidor', 'warning');
      get().log('Server message', { mensagem: data.mensagem });
    });

    socket.on('force_disconnect', (data) => {
      set({ isConnected: false });
      showGameNotification(data.reason || 'Conexão encerrada: você abriu o jogo em outra aba.', 'error');
      get().log('Force disconnect', { reason: data.reason });
    });

    socket.on('mestre_solicita_dados', (data) => {
      showGameNotification(`🎲 O Mestre solicita rolagem de dados!`, 'info');
      get().log('Solicitação de dados do Mestre', { data });
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

      showGameNotification(`Sessão resetada pelo dono da história: ${data.historiaNome || ''}`, 'warning');
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

      showGameNotification(`Sessão encerrada: ${data.motivo || 'Encerrada pelo administrador'}`, 'info');
    });

    socket.on('status_jogo_alterado', (data) => {
      set({ statusJogo: data.statusJogo, totalJogadoresSala: data.totalJogadores });
      get().log('Status jogo alterado', { statusJogo: data.statusJogo });
    });

    // ===== LISTENERS DE ERROS =====

    socket.on('erro_sistema', (data) => {
      set({ erroMensagem: data.message || 'Erro do sistema' });
      showGameNotification(data.message || 'Erro do sistema', 'error');
    });

    socket.on('erro_mensagem', (data) => {
      set({ erroMensagem: data.message || 'Erro ao enviar mensagem' });
      showGameNotification(data.message || 'Erro ao enviar mensagem', 'error');
    });

    socket.on('erro_dado_inicial', (data) => {
      showGameNotification(data.message || 'Erro ao rolar dado inicial', 'error');
    });

    socket.on('rate_limit_exceeded', (data) => {
      set({ rateLimitExceeded: true });
      showGameNotification(data.message || 'Muitas mensagens! Aguarde um momento.', 'warning');
      setTimeout(() => set({ rateLimitExceeded: false }), data.retryAfter || 5000);
    });

    // ===== LISTENERS DE COMBATE =====

    socket.on('combate_iniciado', (data) => {
      const dto = normalizeCombateIniciado(data);
      set({
        combateAtivo: true,
        combateMonstros: dto.monstros,
        combateJogadores: dto.jogadores,
        combateRodada: dto.rodada,
        combateResultado: null,
        combateLog: [],
        combateXpGanho: 0
      });
      get().log('Combate iniciado', { monstros: dto.monstros.length, success: true });
    });

    socket.on('combate_resultado_acao', (data) => {
      const dto = normalizeResultadoAcao(data);
      const { combateMonstros, combateJogadores, combateLog } = get();

      if (dto.tipo === 'ataque_jogador' && dto.alvo?.id) {
        const monstrosAtualizados = combateMonstros.map(m => {
          if (m.id === dto.alvo.id) {
            return { ...m, hp_atual: dto.hpRestante, status: dto.hpRestante <= 0 ? 'derrotado' : m.status };
          }
          return m;
        });
        set({ combateMonstros: monstrosAtualizados });
      }

      if (dto.tipo === 'ataque_monstro' && dto.alvo?.userId) {
        const jogadoresAtualizados = { ...combateJogadores };
        if (jogadoresAtualizados[dto.alvo.userId]) {
          jogadoresAtualizados[dto.alvo.userId] = {
            ...jogadoresAtualizados[dto.alvo.userId],
            hp_atual: dto.hpRestante,
            status: dto.hpRestante <= 0 ? 'derrotado' : 'vivo'
          };
        }
        set({ combateJogadores: jogadoresAtualizados });
        if (dto.acertou && dto.dano > 0) playSound('combat_hit');
      }

      if (dto.tipo === 'status_dano' && dto.alvo?.userId) {
        const jogadoresAtualizados = { ...combateJogadores };
        if (jogadoresAtualizados[dto.alvo.userId]) {
          jogadoresAtualizados[dto.alvo.userId] = {
            ...jogadoresAtualizados[dto.alvo.userId],
            hp_atual: dto.hpRestante,
            status: dto.hpRestante <= 0 ? 'derrotado' : 'vivo'
          };
        }
        set({ combateJogadores: jogadoresAtualizados });
        playSound('combat_hit');
      }

      // DOT em monstros (status_dano com alvo.id = monstro)
      if (dto.tipo === 'status_dano' && dto.alvo?.id && !dto.alvo?.userId) {
        const monstrosAtualizados = combateMonstros.map(m => {
          if (m.id === dto.alvo.id) {
            return { ...m, hp_atual: dto.hpRestante, status: dto.hpRestante <= 0 ? 'derrotado' : m.status };
          }
          return m;
        });
        set({ combateMonstros: monstrosAtualizados });
      }

      // Habilidade do jogador: atualizar HP do monstro e mana do jogador
      if (dto.tipo === 'habilidade_jogador' && dto.ataque?.alvoId) {
        const monstrosAtualizados = combateMonstros.map(m => {
          if (m.id === dto.ataque.alvoId) {
            return { ...m, hp_atual: dto.ataque.hpRestante ?? m.hp_atual, status: (dto.ataque.hpRestante ?? m.hp_atual) <= 0 ? 'derrotado' : m.status };
          }
          return m;
        });
        set({ combateMonstros: monstrosAtualizados });
      }
      if ((dto.tipo === 'habilidade_jogador' || dto.tipo === 'habilidade_falhou') && dto.userId && dto.manaRestante != null) {
        const jogadoresAtualizados = { ...combateJogadores };
        if (jogadoresAtualizados[dto.userId]) {
          jogadoresAtualizados[dto.userId] = {
            ...jogadoresAtualizados[dto.userId],
            mana_atual: dto.manaRestante
          };
        }
        set({ combateJogadores: jogadoresAtualizados });
      }

      set({ combateLog: [...combateLog.slice(-(COMBAT.LOG_MAX_ENTRIES - 1)), dto] });
      get().log('Ação combate processada', { tipo: dto.tipo, acertou: dto.acertou });
    });

    socket.on('combate_monstro_derrotado', (data) => {
      const dto = normalizeMonstruoDerrotado(data);
      const { combateMonstros } = get();
      const monstrosAtualizados = combateMonstros.map(m => {
        if (m.id === dto.monstro?.id) {
          return { ...m, status: 'derrotado', hp_atual: 0 };
        }
        return m;
      });
      set({ combateMonstros: monstrosAtualizados });
      get().log('Monstro derrotado', { nome: dto.monstro?.nome, xp: dto.xp });
    });

    socket.on('combate_jogador_ferido', (data) => {
      const dto = normalizeJogadorFerido(data);
      const { combateJogadores } = get();
      const jogadoresAtualizados = { ...combateJogadores };
      if (jogadoresAtualizados[dto.userId]) {
        jogadoresAtualizados[dto.userId] = {
          ...jogadoresAtualizados[dto.userId],
          hp_atual: dto.hp_atual,
          status: dto.derrotado ? 'derrotado' : 'vivo'
        };
      }
      set({ combateJogadores: jogadoresAtualizados });
      playSound(dto.derrotado ? 'death' : 'combat_hit');
      get().log('Jogador ferido', { nome: dto.nome, hp: dto.hp_atual });
    });

    socket.on('combate_finalizado', (data) => {
      const dto = normalizeCombateFinalizado(data);
      set({
        combateAtivo: false,
        combateResultado: dto.resultado,
        combateXpGanho: dto.xpTotal
      });
      get().log('Combate finalizado', { resultado: dto.resultado, xp: dto.xpTotal, success: true });

      // Auto-limpar resultado após 8s para desmontar o BatalhaUI
      setTimeout(() => {
        const current = get();
        if (current.combateResultado === dto.resultado && !current.combateAtivo) {
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
      const dto = normalizeCombateEstado(data);
      set({
        combateMonstros: dto.monstros ?? get().combateMonstros,
        combateJogadores: dto.jogadores ?? get().combateJogadores,
        combateRodada: dto.rodada ?? get().combateRodada,
        combateLog: dto.log ?? get().combateLog
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
      if (data.tipo === 'dano_ambiental' && get().combateAtivo && jogador) {
        const updated = { ...combateJogadores };
        updated[data.userId] = { ...updated[data.userId], hp_atual: data.hp_atual, status: data.derrotado ? 'derrotado' : 'vivo' };
        set({ combateJogadores: updated });
        if (!data.imune) playSound('combat_hit');
      }
      if (data.tipo === 'personagem_estabilizado' && get().combateAtivo && jogador) {
        const updated = { ...combateJogadores };
        updated[data.userId] = { ...updated[data.userId], hp_atual: data.hp_atual, status: data.hp_atual > 0 ? 'vivo' : updated[data.userId].status };
        set({ combateJogadores: updated });
        playSound('heal');
      }
      if (data.tipo === 'efeitos_expirados' && get().combateAtivo) {
        // efeitos_expirados não tem userId — resolver por personagem nome
        const targetUserId = data.userId || Object.keys(combateJogadores).find(uid => {
          const j = combateJogadores[uid];
          return j && (j.nome === data.personagem || j.personagemNome === data.personagem);
        });
        if (targetUserId && combateJogadores[targetUserId]) {
          const updated = { ...combateJogadores };
          const efeitosNomes = data.efeitos || [];
          const efeitos = (updated[targetUserId].status_efeitos || []).filter(e => !efeitosNomes.includes(e.nome));
          updated[targetUserId] = { ...updated[targetUserId], status_efeitos: efeitos };
          set({ combateJogadores: updated });
        }
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
