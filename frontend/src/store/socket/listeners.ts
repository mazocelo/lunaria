/**
 * Socket Store - Listeners internos: todos os socket.on() do jogo
 */
import { COMBAT } from '../../constants/game';
import { transicaoFase } from './faseMachine';
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
} from './dtos';
import type { SocketGetState, SocketSetState } from './types';
import type { SocketState } from './states';

type AnyObj = Record<string, unknown>;

export type SocketListenerActions = {
  setupInternalListeners: () => void;
};

export const createListenerActions = (set: SocketSetState, get: SocketGetState): SocketListenerActions => ({
  setupInternalListeners: () => {
    const { socket, listeners: storedListeners } = get();
    if (!socket) return;

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
      'mestre_request_status', 'mestre_stream_start', 'mestre_stream_chunk', 'mestre_stream_end', 'mestre_stream_error',
      'sessao_resetada', 'sessao_encerrada',
      'erro_sistema', 'erro_mensagem', 'erro_dado_inicial', 'rate_limit_exceeded',
      'combate_iniciado', 'combate_resultado_acao', 'combate_monstro_derrotado',
      'combate_jogador_ferido', 'combate_finalizado', 'combate_estado',
      'combate_solicita_iniciativa', 'combate_resultado_iniciativa', 'combate_ordem_definida',
      'combat_turn', 'combat_monster_action',
      'acao_mestre', 'level_up', 'combate_loot',
      'user_joined', 'user_left',
      'status_jogo_alterado',
    ];
    for (const event of internalEvents) {
      socket.removeAllListeners(event);
    }

    socket.io.off('reconnect');
    socket.io.off('reconnect_attempt');
    socket.io.off('reconnect_failed');

    const log = (get().log as (event: string, data?: AnyObj, level?: string) => void);
    const setSocketToken = (get().setSocketToken as (token: string | null) => void);

    // ===== LISTENERS DE CONEXAO =====
    socket.on('connect', () => {
      set({
        isConnected: true,
        isConnecting: false,
        isAuthenticated: false,
        inRoom: false,
        joiningRoomId: null,
      });
      log('Connected successfully', { socketId: socket.id, success: true });
    });

    socket.on('disconnect', (reason: string) => {
      const isIntentional = reason === 'io client disconnect';
      const prevRoomId = get().roomId;

      set({
        isConnected: false,
        isAuthenticated: false,
        inRoom: false,
        joiningRoomId: null,
        roomId: isIntentional ? null : prevRoomId,
      });
      log('Disconnected', { reason, preservedRoomId: isIntentional ? null : prevRoomId });

      if (!isIntentional) {
        showGameNotification('Conexao perdida. Tentando reconectar...', 'warning');
      }
    });

    socket.on('connect_error', (error: Error) => {
      set({
        isConnected: false,
        isConnecting: false,
        joiningRoomId: null,
        error: error.message,
      });
      log('Connection error', { error: error.message }, 'error');
    });

    socket.on('error', (data: AnyObj) => {
      const message = (typeof data?.message === 'string' ? data.message : 'Erro no websocket');
      set({
        joiningRoomId: null,
        error: message,
        erroMensagem: message,
      });
      showGameNotification(message, 'error');
      log('Socket error', { error: message }, 'error');
    });

    // ===== LISTENERS DE RECONEXAO =====
    socket.io.on('reconnect', async () => {
      set({ isConnected: true, isAuthenticated: false, inRoom: false, joiningRoomId: null, isReconnecting: false, error: null });
      showGameNotification('Reconectado com sucesso!', 'success');

      const { socketToken, currentUser, roomId } = get();
      let userId: number | string | undefined = currentUser?.id;
      let username: string | undefined = typeof currentUser?.username === 'string' ? currentUser.username : undefined;

      if (!userId || !username) {
        try {
          const storedRaw = localStorage.getItem('user');
          const storedUser = storedRaw ? (JSON.parse(storedRaw) as AnyObj) : null;
          userId = userId || (storedUser?.id as number | string | undefined);
          username = username
            || (typeof storedUser?.username === 'string' ? storedUser.username : undefined)
            || (typeof storedUser?.nome === 'string' ? storedUser.nome : undefined);
        } catch { /* silent */ }
      }

      if (!userId || !username) {
        log('Cannot re-authenticate: missing userId/username', {}, 'warn');
        return;
      }

      let token = socketToken;
      if (!token) {
        try {
          const apiBase = import.meta.env.VITE_API_URL || '';
          const res = await fetch(`${apiBase}/auth/renovar`, {
            method: 'POST',
            credentials: 'include',
          });
          if (res.ok) {
            const data = await res.json() as { data?: { socketToken?: string } };
            token = data?.data?.socketToken || null;
            if (token) setSocketToken(token);
          }
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          log('Failed to refresh socketToken on reconnect', { err: message }, 'warn');
        }
      }

      const authData: AnyObj = { userId, username };
      if (token) authData.token = token;

      socket.emit('authenticate', authData);

      const savedRoomId = roomId;
      if (savedRoomId) {
        socket.once('authenticated', () => {
          set({ joiningRoomId: savedRoomId });
          log('Re-joining room after reconnect', { roomId: savedRoomId });
          socket.emit('join_room', { roomId: savedRoomId, userId });
        });
      }
    });

    socket.io.on('reconnect_attempt', (attempt: number) => {
      set({ isReconnecting: true, connectionAttempts: attempt });
    });

    socket.io.on('reconnect_failed', () => {
      console.error('Reconexao falhou apos todas as tentativas');
      set({
        isReconnecting: false,
        isConnected: false,
        isAuthenticated: false,
        inRoom: false,
        error: 'Conexao perdida. Redirecionando...',
      });
      showGameNotification('Conexao perdida. Voltando a lista...', 'error');
      setTimeout(() => {
        window.location.href = '/historias';
      }, 2000);
    });

    // ===== LISTENERS DE AUTENTICACAO =====
    socket.on('authenticated', (data: AnyObj) => {
      const user = {
        id: data.userId as number | string,
        username: data.username as string,
        socketId: data.socketId,
        sessionId: data.sessionId,
      };

      set({
        isAuthenticated: true,
        currentUser: user,
        userRole: null,
        error: null,
      });
      log('Authenticated', { userId: user.id, username: user.username, success: true });
    });

    // ===== LISTENERS DE ROOM =====
    socket.on('room_joined', (data: AnyObj) => {
      const sessao = (data.sessao || data.session) as AnyObj | undefined;
      const estadoJogo = sessao?.estadoJogo as AnyObj | undefined;

      if (estadoJogo) {
        const currentUser = get().currentUser;
        const updateData: Partial<SocketState> = {};

        if (typeof estadoJogo.fase === 'string') {
          updateData.faseJogo = estadoJogo.fase;
        }
        if (typeof estadoJogo.rodadaAtual === 'number') {
          updateData.rodadaAtual = estadoJogo.rodadaAtual;
        }
        if (typeof estadoJogo.turnoAtual === 'number') {
          updateData.turnoAtual = estadoJogo.turnoAtual;
        }
        if (Array.isArray(estadoJogo.ordemJogadores) && estadoJogo.ordemJogadores.length > 0) {
          const ordemJogadores = estadoJogo.ordemJogadores as AnyObj[];
          const turnoAtual = typeof estadoJogo.turnoAtual === 'number' ? estadoJogo.turnoAtual : 0;
          const jogadorAtual = ordemJogadores[turnoAtual];
          const ehMeuTurno = !!(currentUser && jogadorAtual
            && String(jogadorAtual.userId) === String(currentUser.id));

          updateData.ordemJogadores = ordemJogadores;
          updateData.ordemDefinida = true;
          updateData.jogadorAtual = jogadorAtual;
          updateData.ehMeuTurno = ehMeuTurno;
        }
        const turno = estadoJogo.turno as AnyObj | undefined;
        const turnoStatus = (typeof turno?.status === 'string' ? turno.status : (estadoJogo.turnoIniciado ? 'active' : 'idle'));
        const testesRaw = estadoJogo.testesPendentes;
        const testesPendentes = Array.isArray(testesRaw)
          ? testesRaw.filter((teste): teste is AnyObj => {
            const t = teste as AnyObj | null;
            return !!t && t.status !== 'resolved' && t.status !== 'cancelled';
          })
          : [];
        const testeInfo = estadoJogo.testeInfo as AnyObj | undefined;
        const testePendenteLegado = !testesPendentes.length && estadoJogo.dadosSolicitados && testeInfo
          ? {
            ...testeInfo,
            status: 'pending',
            jogadorAlvo: testeInfo.jogadorAlvo || turno?.jogadorAtual || null,
          }
          : null;

        updateData.turnoIniciado = ['starting', 'active', 'awaiting_roll', 'resolving_roll'].includes(turnoStatus);
        updateData.turnoStatus = turnoStatus;
        updateData.testesPendentes = testesPendentes.length > 0 ? testesPendentes : (testePendenteLegado ? [testePendenteLegado] : []);
        updateData.testePendente = (estadoJogo.testePendente as AnyObj | null) ?? testePendenteLegado ?? updateData.testesPendentes[0] ?? null;

        if (turno?.jogadorAtual != null) {
          const ordem = (updateData.ordemJogadores || (estadoJogo.ordemJogadores as AnyObj[] | undefined) || []);
          const jogadorAtualTurno = ordem.find(
            (jogador) => String((jogador as AnyObj).userId || (jogador as AnyObj).id) === String(turno.jogadorAtual),
          ) || { userId: turno.jogadorAtual };
          updateData.jogadorAtual = jogadorAtualTurno;
          updateData.ehMeuTurno = !!(currentUser && String(turno.jogadorAtual) === String(currentUser.id));
        }
        if (estadoJogo.rolagemInicial) {
          updateData.resultadosDados = estadoJogo.rolagemInicial as Record<string, AnyObj>;
        }
        const combate = estadoJogo.combate as AnyObj | undefined;
        if (combate?.ativo) {
          updateData.combateAtivo = true;
          updateData.combateMonstros = (Array.isArray(combate.monstros) ? combate.monstros : []) as AnyObj[];
          updateData.combateJogadores = (combate.jogadores as Record<string, AnyObj>) || {};
          updateData.combateRodada = typeof combate.rodadaCombate === 'number' ? combate.rodadaCombate : 1;
          updateData.combateLog = (Array.isArray(combate.log) ? combate.log.slice(-COMBAT.LOG_MAX_ENTRIES) : []) as AnyObj[];
        }
        const mestreRequestAtiva = (estadoJogo.mestreRequestAtiva as AnyObj | null) || null;
        const lastRegenerable = (estadoJogo.lastRegenerableMestreRequest as AnyObj | null) || null;
        const restoreRequest = mestreRequestAtiva
          || (lastRegenerable && String(lastRegenerable.userId) === String(currentUser?.id) ? lastRegenerable : null);
        const restoreStatus = (restoreRequest?.status as string | undefined) || null;
        const restoreTerminal = restoreStatus !== null && ['completed', 'failed', 'timed_out', 'superseded'].includes(restoreStatus);

        updateData.pendingMestreRequestId = null;
        updateData.pendingMestreRequestKind = null;
        updateData.pendingMestreSentAt = null;
        updateData.lastRegenerableMestreRequest = lastRegenerable && String(lastRegenerable.userId) === String(currentUser?.id)
          ? lastRegenerable
          : null;
        updateData.activeMestreRequestId = (restoreRequest?.requestId as string | undefined) || null;
        updateData.activeMestreRequestStatus = restoreStatus;
        updateData.activeMestreRequestAttempt = typeof restoreRequest?.attempt === 'number' ? restoreRequest.attempt : 0;
        updateData.activeMestreRequestUserId = (restoreRequest?.userId as number | string | undefined) || null;
        updateData.activeMestrePlayerMessageId = (restoreRequest?.playerMessageId as number | string | undefined) || null;
        updateData.activeMestreUpdatedAt = (restoreRequest?.updatedAt as string | undefined) || null;
        updateData.mestrePensando = !!restoreRequest && !restoreTerminal;
        updateData.aguardandoRespostaMestre = !!restoreRequest && !restoreTerminal;
        updateData.mestreTimedOut = restoreStatus === 'timed_out';
        updateData.mestreStale = false;
        updateData.sessionRecap = null;
        updateData.joiningRoomId = null;
        set(updateData);
      }

      set({
        inRoom: true,
        joiningRoomId: null,
        roomId: data.roomId as string,
        session: (data.sessao || data.session) as AnyObj | null,
        roomUsers: (Array.isArray(data.users) ? data.users : []) as AnyObj[],
        sessionRecap: null,
        error: null,
      });
      const jogadores = (sessao?.jogadoresConectados as AnyObj[] | undefined) || [];
      log('Room joined', {
        roomId: data.roomId,
        users: Array.isArray(data.users) ? data.users.length : 0,
        jogadores: jogadores.length,
        success: true,
      });
    });

    socket.on('room_left', () => {
      set({
        inRoom: false,
        joiningRoomId: null,
        roomId: null,
        session: null,
        roomUsers: [],
        pendingMestreRequestId: null,
        pendingMestreRequestKind: null,
        pendingMestreSentAt: null,
        activeMestreRequestId: null,
        activeMestreRequestStatus: null,
        activeMestreRequestAttempt: 0,
        activeMestreRequestUserId: null,
        activeMestrePlayerMessageId: null,
        activeMestreUpdatedAt: null,
        lastRegenerableMestreRequest: null,
        mestrePensando: false,
        aguardandoRespostaMestre: false,
        mestreTimedOut: false,
        mestreStale: false,
        sessionRecap: null,
      });
      log('Room left', { success: true });
    });

    // ===== LISTENERS DO SISTEMA DE TURNOS E RODADAS =====

    socket.on('fase_atualizada', (data: AnyObj) => {
      set({
        faseJogo: data.fase as string,
        estadoJogo: (data.estadoJogo as AnyObj) || get().estadoJogo,
      });
      log('Fase atualizada', { fase: data.fase, success: true });
    });

    socket.on('aventura_iniciada', (data: AnyObj) => {
      set((state) => ({
        faseJogo: transicaoFase(state.faseJogo, 'rolagem_inicial'),
        aventuraIniciada: true,
      }));
      log('Aventura iniciada', {
        historiaId: data.historiaId,
        historiaNome: data.historiaNome,
        success: true,
      });
    });

    socket.on('resultado_dado_inicial', (data: AnyObj) => {
      const { resultadosDados = {} } = get();
      const userId = String(data.userId);
      resultadosDados[userId] = {
        valor: data.valor,
        username: data.username,
        personagemNome: data.personagemNome,
        timestamp: data.timestamp,
      };

      set({ resultadosDados: { ...resultadosDados } });
      playSound('dice_roll');

      log('Dado inicial rolado', {
        userId: data.userId,
        valor: data.valor,
        success: true,
      });
    });

    socket.on('ordem_definida', (data: AnyObj) => {
      const ordem = Array.isArray(data.ordemJogadores) ? data.ordemJogadores as AnyObj[] : [];
      set({
        ordemJogadores: ordem,
        ordemDefinida: true,
      });
      log('Ordem de jogadores definida', {
        totalJogadores: ordem.length,
        success: true,
      });
    });

    socket.on('turno_alterado', (data: AnyObj) => {
      const currentUser = get().currentUser;
      const jogadorAtualPayload = data.jogadorAtual as AnyObj | undefined;
      const ehMeuTurno = !!(currentUser && String(jogadorAtualPayload?.userId) === String(currentUser.id));

      let ordemAtualizada = (data.ordemCompleta as AnyObj[] | undefined) || get().ordemJogadores;
      if (Array.isArray(data.ordemCompleta)) {
        const ordemAnterior = get().ordemJogadores;
        const dadosMap: Record<string, unknown> = {};
        ordemAnterior.forEach((j) => {
          const ji = j as AnyObj;
          if (ji.valorDado != null) dadosMap[String(ji.userId || ji.id)] = ji.valorDado;
        });
        ordemAtualizada = (data.ordemCompleta as AnyObj[]).map((j) => {
          const uid = String(j.userId || j.id);
          if (j.valorDado == null && dadosMap[uid] != null) {
            return { ...j, valorDado: dadosMap[uid] };
          }
          return j;
        });
      }

      set({
        rodadaAtual: data.rodadaAtual as number,
        turnoAtual: data.turnoAtual as number,
        jogadorAtual: jogadorAtualPayload ?? null,
        ordemJogadores: ordemAtualizada,
        ehMeuTurno,
        turnoIniciado: false,
        turnoStatus: 'idle',
        testePendente: null,
        testesPendentes: [],
      });

      if (ehMeuTurno) {
        playSound('my_turn');
        sendNotification('Lunaria - E sua vez!', { body: 'Seu turno comecou. Volte ao jogo!' });
        showGameNotification('E SUA VEZ!', 'success');
      }

      log('Turno alterado', {
        turno: data.turnoAtual,
        jogador: jogadorAtualPayload?.username,
        ehMeuTurno,
        success: true,
      });
    });

    socket.on('mestre_finalizou_turno', (data: AnyObj) => {
      log('Mestre finalizou turno', {
        jogador: data.jogador,
        contador: data.contador,
        success: true,
      });
    });

    socket.on('turno_iniciado', (data: AnyObj) => {
      log('Turno iniciado', { userId: data.userId, success: true });
    });

    socket.on('turno_estado_atualizado', (data: AnyObj) => {
      const currentUser = get().currentUser;
      const turno = data.turno as AnyObj | undefined;
      const jogadorAtual = turno?.jogadorAtual;
      const testesPendentes = Array.isArray(data.testesPendentes)
        ? data.testesPendentes as AnyObj[]
        : (data.testePendente ? [data.testePendente as AnyObj] : []);
      const ehMeuTurno = !!(currentUser && jogadorAtual != null
        ? String(jogadorAtual) === String(currentUser.id)
        : false);
      const jogadorAtualPayload = jogadorAtual == null
        ? null
        : (typeof jogadorAtual === 'object'
          ? jogadorAtual as AnyObj
          : (get().ordemJogadores || []).find((j) => String((j as AnyObj).userId || (j as AnyObj).id) === String(jogadorAtual)) || { userId: jogadorAtual });

      const status = (typeof turno?.status === 'string' ? turno.status : 'idle');
      set({
        rodadaAtual: typeof turno?.rodadaAtual === 'number' ? turno.rodadaAtual : get().rodadaAtual,
        turnoStatus: status,
        turnoIniciado: ['starting', 'active', 'awaiting_roll', 'resolving_roll'].includes(status),
        testePendente: (data.testePendente as AnyObj | undefined) || testesPendentes[0] || null,
        testesPendentes,
        jogadorAtual: jogadorAtualPayload as AnyObj | null,
        ehMeuTurno,
      });
    });

    socket.on('teste_rejeitado', (data: AnyObj) => {
      showGameNotification('Essa rolagem nao corresponde ao teste pendente.', 'warning');
      log('Teste rejeitado', data, 'warn');
    });

    socket.on('rodada_finalizada', (data: AnyObj) => {
      set((state) => ({
        faseJogo: transicaoFase(state.faseJogo, 'entre_rodadas'),
        rodadaFinalizada: (typeof data.rodada === 'number' ? data.rodada : null),
        ehMeuTurno: false,
        turnoIniciado: false,
        turnoStatus: 'idle',
        jogadorAtual: null,
        testePendente: null,
        testesPendentes: [],
      }));
      log('Rodada finalizada', { rodada: data.rodada, success: true });
    });

    socket.on('nova_rodada_iniciada', (data: AnyObj) => {
      set((state) => ({
        faseJogo: transicaoFase(state.faseJogo, 'rodada_em_andamento'),
        rodadaAtual: typeof data.rodada === 'number' ? data.rodada : state.rodadaAtual,
        turnoAtual: 0,
        rodadaFinalizada: null,
        turnoStatus: 'idle',
        testePendente: null,
        testesPendentes: [],
        ehMeuTurno: false,
      }));
      log('Nova rodada iniciada', { rodada: data.rodada, success: true });
    });

    socket.on('erro_cooldown_roleplay', (data: AnyObj) => {
      set({
        cooldownRoleplay: typeof data.segundosRestantes === 'number' ? data.segundosRestantes : 0,
        erroMensagem: (typeof data.message === 'string' ? data.message : null),
      });
      log('Cooldown roleplay ativo', { segundos: data.segundosRestantes });
    });

    socket.on('erro_turno', (data: AnyObj) => {
      const message = typeof data.message === 'string' ? data.message : 'Nao e seu turno!';
      set({ erroMensagem: message });
      showGameNotification(message, 'warning');
      log('Erro ao enviar mensagem fora do turno', { message: data.message });
    });

    socket.on('server_message', (data: AnyObj) => {
      const message = (typeof data.mensagem === 'string' ? data.mensagem
        : typeof data.message === 'string' ? data.message
          : 'Mensagem do servidor');
      showGameNotification(message, 'warning');
      log('Server message', { mensagem: data.mensagem });
    });

    socket.on('force_disconnect', (data: AnyObj) => {
      set({ isConnected: false });
      const reason = typeof data.reason === 'string' ? data.reason : 'Conexao encerrada: voce abriu o jogo em outra aba.';
      showGameNotification(reason, 'error');
      log('Force disconnect', { reason: data.reason });
    });

    socket.on('mestre_solicita_dados', (data: AnyObj) => {
      showGameNotification('O Mestre solicita rolagem de dados!', 'info');
      log('Solicitacao de dados do Mestre', { data });
    });

    socket.on('mensagem_roleplay', (data: AnyObj) => {
      log('Mensagem roleplay recebida', { userId: data.userId });
    });

    // ===== LISTENERS DE SESSAO =====

    socket.on('sessao_resetada', (data: AnyObj) => {
      set({
        faseJogo: 'aguardando_inicio',
        rodadaAtual: 1,
        turnoAtual: 0,
        jogadorAtual: null,
        ordemJogadores: [],
        ordemDefinida: false,
        resultadosDados: {},
        pendingMestreRequestId: null,
        pendingMestreRequestKind: null,
        pendingMestreSentAt: null,
        activeMestreRequestId: null,
        activeMestreRequestStatus: null,
        activeMestreRequestAttempt: 0,
        activeMestreRequestUserId: null,
        activeMestrePlayerMessageId: null,
        activeMestreUpdatedAt: null,
        lastRegenerableMestreRequest: null,
        ehMeuTurno: false,
        turnoIniciado: false,
        turnoStatus: 'idle',
        aguardandoRespostaMestre: false,
        mestrePensando: false,
        mestreTimedOut: false,
        mestreStale: false,
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
        sessionRecap: null,
      });

      log('Sessao resetada', { historiaId: data.historiaId, success: true });

      const nome = typeof data.historiaNome === 'string' ? data.historiaNome : '';
      showGameNotification(`Sessao resetada pelo dono da historia: ${nome}`, 'warning');
    });

    socket.on('sessao_encerrada', (data: AnyObj) => {
      set({
        faseJogo: 'aguardando_inicio',
        rodadaAtual: 1,
        turnoAtual: 0,
        jogadorAtual: null,
        ordemJogadores: [],
        ordemDefinida: false,
        resultadosDados: {},
        pendingMestreRequestId: null,
        pendingMestreRequestKind: null,
        pendingMestreSentAt: null,
        activeMestreRequestId: null,
        activeMestreRequestStatus: null,
        activeMestreRequestAttempt: 0,
        activeMestreRequestUserId: null,
        activeMestrePlayerMessageId: null,
        activeMestreUpdatedAt: null,
        lastRegenerableMestreRequest: null,
        ehMeuTurno: false,
        turnoIniciado: false,
        turnoStatus: 'idle',
        aguardandoRespostaMestre: false,
        mestrePensando: false,
        mestreTimedOut: false,
        mestreStale: false,
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
          xpGanho: typeof data.xpGanho === 'number' ? data.xpGanho : 0,
          loot: Array.isArray(data.loot) ? data.loot : [],
        },
      });

      log('Sessao encerrada', { salaId: data.salaId, success: true });

      const motivo = typeof data.motivo === 'string' ? data.motivo : 'Encerrada pelo administrador';
      showGameNotification(`Sessao encerrada: ${motivo}`, 'info');
    });

    socket.on('status_jogo_alterado', (data: AnyObj) => {
      set({
        statusJogo: (typeof data.statusJogo === 'string' ? data.statusJogo : null),
        totalJogadoresSala: typeof data.totalJogadores === 'number' ? data.totalJogadores : 0,
      });
      log('Status jogo alterado', { statusJogo: data.statusJogo });
    });

    // ===== LISTENERS DE ERROS =====

    socket.on('erro_sistema', (data: AnyObj) => {
      const message = typeof data.message === 'string' ? data.message : 'Erro do sistema';
      set({ erroMensagem: message });
      showGameNotification(message, 'error');
    });

    socket.on('erro_mensagem', (data: AnyObj) => {
      const message = typeof data.message === 'string' ? data.message : 'Erro ao enviar mensagem';
      set({ erroMensagem: message });
      showGameNotification(message, 'error');
    });

    socket.on('erro_dado_inicial', (data: AnyObj) => {
      const message = typeof data.message === 'string' ? data.message : 'Erro ao rolar dado inicial';
      showGameNotification(message, 'error');
    });

    socket.on('rate_limit_exceeded', (data: AnyObj) => {
      set({ rateLimitExceeded: true });
      const message = typeof data.message === 'string' ? data.message : 'Muitas mensagens! Aguarde um momento.';
      showGameNotification(message, 'warning');
      setTimeout(() => set({ rateLimitExceeded: false }), typeof data.retryAfter === 'number' ? data.retryAfter : 5000);
    });

    // ===== LISTENERS DE COMBATE =====

    socket.on('combate_iniciado', (data: AnyObj) => {
      const dto = normalizeCombateIniciado(data);
      set({
        combateAtivo: true,
        combateFase: (typeof data.fase === 'string' ? data.fase : 'combate'),
        combateMonstros: dto.monstros,
        combateJogadores: dto.jogadores,
        combateRodada: dto.rodada,
        combateResultado: null,
        combateLog: [],
        combateXpGanho: 0,
        combateOrdemIniciativa: [],
        combateTurnoAtual: null,
        combateIniciativaPendente: false,
      });
      log('Combate iniciado', { fase: data.fase, monstros: dto.monstros.length, success: true });
    });

    socket.on('combate_solicita_iniciativa', (data: AnyObj) => {
      const { currentUser } = get();
      if (String(data.userId) === String(currentUser?.id)) {
        set({
          combateIniciativaPendente: true,
          combateIniciativaModificador: typeof data.modificador === 'number' ? data.modificador : 0,
        });
        log('Iniciativa solicitada', { modificador: data.modificador });
      }
    });

    socket.on('combate_resultado_iniciativa', (data: AnyObj) => {
      set({ combateIniciativaPendente: false });
      log('Resultado iniciativa', { nome: data.personagemNome, iniciativa: data.iniciativa });
    });

    socket.on('combate_ordem_definida', (data: AnyObj) => {
      const ordem = Array.isArray(data.ordemIniciativa) ? data.ordemIniciativa as AnyObj[] : [];
      set({
        combateFase: 'ordem_definida',
        combateOrdemIniciativa: ordem,
        combateTurnoAtual: (data.primeiroTurno as AnyObj | null) || null,
        combateRodada: typeof data.rodada === 'number' ? data.rodada : 1,
        combateIniciativaPendente: false,
      });
      log('Ordem de combate definida', { ordem: ordem.map((o) => (o as AnyObj).nome) });

      setTimeout(() => {
        const current = get();
        if (current.combateFase === 'ordem_definida') {
          set({ combateFase: 'combate' });
        }
      }, 4000);
    });

    socket.on('combat_turn', (data: AnyObj) => {
      set({
        combateTurnoAtual: (data.turnoAtual as AnyObj | null) || null,
        combateRodada: typeof data.rodada === 'number' ? data.rodada : get().combateRodada,
      });
      const turnoAtual = data.turnoAtual as AnyObj | undefined;
      log('Turno de combate', { nome: turnoAtual?.nome, tipo: turnoAtual?.tipo });
    });

    socket.on('combat_monster_action', (data: AnyObj) => {
      const { combateJogadores, combateLog } = get();
      if (data.acertou && data.alvoId) {
        const jogadoresAtualizados = { ...combateJogadores };
        const alvoId = String(data.alvoId);
        if (jogadoresAtualizados[alvoId]) {
          const hpRestante = typeof data.hpRestante === 'number' ? data.hpRestante : 0;
          jogadoresAtualizados[alvoId] = {
            ...jogadoresAtualizados[alvoId],
            hp_atual: hpRestante,
            status: hpRestante <= 0 ? 'derrotado' : 'vivo',
          };
        }
        set({ combateJogadores: jogadoresAtualizados });
      }
      set({ combateLog: [...combateLog.slice(-19), { tipo: 'ataque_monstro', ...data }] });
      log('Acao do monstro', { atacante: data.atacanteNome, acertou: data.acertou, dano: data.dano });
    });

    socket.on('combate_resultado_acao', (data: AnyObj) => {
      const dto = normalizeResultadoAcao(data);
      const { combateMonstros, combateJogadores, combateLog } = get();
      const alvo = dto.alvo as AnyObj | null | undefined;
      const ataque = dto.ataque as AnyObj | undefined;
      const hpRestante = typeof dto.hpRestante === 'number' ? dto.hpRestante : 0;

      if (dto.tipo === 'ataque_jogador' && alvo?.id) {
        const monstrosAtualizados = combateMonstros.map((m) => {
          const mi = m as AnyObj;
          if (mi.id === alvo.id) {
            return { ...mi, hp_atual: hpRestante, status: hpRestante <= 0 ? 'derrotado' : mi.status };
          }
          return mi;
        });
        set({ combateMonstros: monstrosAtualizados });
      }

      if (dto.tipo === 'ataque_monstro' && alvo?.userId) {
        const jogadoresAtualizados = { ...combateJogadores };
        const uid = String(alvo.userId);
        if (jogadoresAtualizados[uid]) {
          jogadoresAtualizados[uid] = {
            ...jogadoresAtualizados[uid],
            hp_atual: hpRestante,
            status: hpRestante <= 0 ? 'derrotado' : 'vivo',
          };
        }
        set({ combateJogadores: jogadoresAtualizados });
        const dano = typeof dto.dano === 'number' ? dto.dano : 0;
        if (dto.acertou && dano > 0) playSound('combat_hit');
      }

      if (dto.tipo === 'status_dano' && alvo?.userId) {
        const jogadoresAtualizados = { ...combateJogadores };
        const uid = String(alvo.userId);
        if (jogadoresAtualizados[uid]) {
          jogadoresAtualizados[uid] = {
            ...jogadoresAtualizados[uid],
            hp_atual: hpRestante,
            status: hpRestante <= 0 ? 'derrotado' : 'vivo',
          };
        }
        set({ combateJogadores: jogadoresAtualizados });
        playSound('combat_hit');
      }

      if (dto.tipo === 'status_dano' && alvo?.id && !alvo?.userId) {
        const monstrosAtualizados = combateMonstros.map((m) => {
          const mi = m as AnyObj;
          if (mi.id === alvo.id) {
            return { ...mi, hp_atual: hpRestante, status: hpRestante <= 0 ? 'derrotado' : mi.status };
          }
          return mi;
        });
        set({ combateMonstros: monstrosAtualizados });
      }

      if (dto.tipo === 'habilidade_jogador' && ataque?.alvoId) {
        const monstrosAtualizados = combateMonstros.map((m) => {
          const mi = m as AnyObj;
          if (mi.id === ataque.alvoId) {
            const hp = typeof ataque.hpRestante === 'number' ? ataque.hpRestante : (mi.hp_atual as number);
            return { ...mi, hp_atual: hp, status: hp <= 0 ? 'derrotado' : mi.status };
          }
          return mi;
        });
        set({ combateMonstros: monstrosAtualizados });
      }
      if ((dto.tipo === 'habilidade_jogador' || dto.tipo === 'habilidade_falhou' || dto.tipo === 'habilidade_teste_falhou') && dto.userId && dto.manaRestante != null) {
        const jogadoresAtualizados = { ...combateJogadores };
        const uid = String(dto.userId);
        if (jogadoresAtualizados[uid]) {
          jogadoresAtualizados[uid] = {
            ...jogadoresAtualizados[uid],
            mana_atual: dto.manaRestante,
          };
        }
        set({ combateJogadores: jogadoresAtualizados });
      }

      set({ combateLog: [...combateLog.slice(-(COMBAT.LOG_MAX_ENTRIES - 1)), dto] });
      log('Acao combate processada', { tipo: dto.tipo, acertou: dto.acertou });
    });

    socket.on('combate_monstro_derrotado', (data: AnyObj) => {
      const dto = normalizeMonstruoDerrotado(data);
      const { combateMonstros } = get();
      const monstrosAtualizados = combateMonstros.map((m) => {
        const mi = m as AnyObj;
        if (mi.id === dto.monstro?.id) {
          return { ...mi, status: 'derrotado', hp_atual: 0 };
        }
        return mi;
      });
      set({ combateMonstros: monstrosAtualizados });
      log('Monstro derrotado', { nome: dto.monstro?.nome, xp: dto.xp });
    });

    socket.on('combate_jogador_ferido', (data: AnyObj) => {
      const dto = normalizeJogadorFerido(data);
      const { combateJogadores } = get();
      const jogadoresAtualizados = { ...combateJogadores };
      const uid = String(dto.userId);
      if (jogadoresAtualizados[uid]) {
        jogadoresAtualizados[uid] = {
          ...jogadoresAtualizados[uid],
          hp_atual: dto.hp_atual,
          status: dto.derrotado ? 'derrotado' : 'vivo',
        };
      }
      set({ combateJogadores: jogadoresAtualizados });
      playSound(dto.derrotado ? 'death' : 'combat_hit');
      log('Jogador ferido', { nome: dto.nome, hp: dto.hp_atual });
    });

    socket.on('combate_finalizado', (data: AnyObj) => {
      const dto = normalizeCombateFinalizado(data);
      set({
        combateAtivo: false,
        combateFase: null,
        combateResultado: (typeof dto.resultado === 'string' ? dto.resultado : null),
        combateXpGanho: dto.xpTotal,
        combateOrdemIniciativa: [],
        combateTurnoAtual: null,
        combateIniciativaPendente: false,
      });
      log('Combate finalizado', { resultado: dto.resultado, xp: dto.xpTotal, success: true });

      setTimeout(() => {
        const current = get();
        if (current.combateResultado === dto.resultado && !current.combateAtivo) {
          set({
            combateResultado: null,
            combateMonstros: [],
            combateJogadores: {},
            combateRodada: 0,
            combateLog: [],
            combateXpGanho: 0,
          });
        }
      }, 8000);
    });

    socket.on('combate_estado', (data: AnyObj) => {
      const dto = normalizeCombateEstado(data);
      set({
        combateMonstros: dto.monstros ?? get().combateMonstros,
        combateJogadores: dto.jogadores ?? get().combateJogadores,
        combateRodada: dto.rodada ?? get().combateRodada,
        combateLog: dto.log ?? get().combateLog,
      });
    });

    // ===== LISTENER DE ACOES DO MESTRE =====
    socket.on('acao_mestre', (data: AnyObj) => {
      const { combateJogadores } = get();
      const uid = data.userId != null ? String(data.userId) : null;
      const jogador = uid ? combateJogadores[uid] : undefined;

      if (data.tipo === 'curado') playSound('heal');
      if (data.tipo === 'dano_recebido' && !data.imune) playSound('combat_hit');
      if (data.tipo === 'curado' && get().combateAtivo && jogador && uid) {
        const updated = { ...combateJogadores };
        const hp = typeof data.hp_atual === 'number' ? data.hp_atual : 0;
        updated[uid] = { ...updated[uid], hp_atual: hp, status: hp > 0 ? 'vivo' : updated[uid].status };
        set({ combateJogadores: updated });
      }
      if (data.tipo === 'dano_recebido' && get().combateAtivo && jogador && uid) {
        const updated = { ...combateJogadores };
        updated[uid] = { ...updated[uid], hp_atual: data.hp_atual, status: data.derrotado ? 'derrotado' : 'vivo' };
        set({ combateJogadores: updated });
      }
      if (data.tipo === 'status_aplicado' && get().combateAtivo && jogador && uid) {
        const updated = { ...combateJogadores };
        const efeitosBase = Array.isArray(updated[uid].status_efeitos) ? updated[uid].status_efeitos as AnyObj[] : [];
        const efeitos = [...efeitosBase];
        const existente = efeitos.findIndex((e) => e.nome === data.status);
        if (existente >= 0) {
          efeitos[existente] = { nome: data.status, duracao: data.duracao || 3 };
        } else {
          efeitos.push({ nome: data.status, duracao: data.duracao || 3 });
        }
        updated[uid] = { ...updated[uid], status_efeitos: efeitos };
        set({ combateJogadores: updated });
      }
      if (data.tipo === 'status_removido' && get().combateAtivo && jogador && uid) {
        const updated = { ...combateJogadores };
        const efeitosBase = Array.isArray(updated[uid].status_efeitos) ? updated[uid].status_efeitos as AnyObj[] : [];
        const efeitos = efeitosBase.filter((e) => e.nome !== data.status);
        updated[uid] = { ...updated[uid], status_efeitos: efeitos };
        set({ combateJogadores: updated });
      }
      if (data.tipo === 'dano_ambiental' && get().combateAtivo && jogador && uid) {
        const updated = { ...combateJogadores };
        updated[uid] = { ...updated[uid], hp_atual: data.hp_atual, status: data.derrotado ? 'derrotado' : 'vivo' };
        set({ combateJogadores: updated });
        if (!data.imune) playSound('combat_hit');
      }
      if (data.tipo === 'personagem_estabilizado' && get().combateAtivo && jogador && uid) {
        const updated = { ...combateJogadores };
        const hp = typeof data.hp_atual === 'number' ? data.hp_atual : 0;
        updated[uid] = { ...updated[uid], hp_atual: hp, status: hp > 0 ? 'vivo' : updated[uid].status };
        set({ combateJogadores: updated });
        playSound('heal');
      }
      if (data.tipo === 'efeitos_expirados' && get().combateAtivo) {
        const targetUserId = uid || Object.keys(combateJogadores).find((u) => {
          const j = combateJogadores[u] as AnyObj | undefined;
          return j && (j.nome === data.personagem || j.personagemNome === data.personagem);
        });
        if (targetUserId && combateJogadores[targetUserId]) {
          const updated = { ...combateJogadores };
          const efeitosNomes = Array.isArray(data.efeitos) ? data.efeitos : [];
          const efeitosBase = Array.isArray(updated[targetUserId].status_efeitos) ? updated[targetUserId].status_efeitos as AnyObj[] : [];
          const efeitos = efeitosBase.filter((e) => !efeitosNomes.includes(e.nome));
          updated[targetUserId] = { ...updated[targetUserId], status_efeitos: efeitos };
          set({ combateJogadores: updated });
        }
      }
      log('Acao do Mestre', { tipo: data.tipo, personagem: data.personagem });
    });

    // ===== LISTENERS DE PROGRESSAO =====
    socket.on('level_up', (data: AnyObj) => {
      set({
        lastLevelUp: {
          userId: data.userId,
          username: data.personagemNome || data.username,
          novoNivel: data.novoNivel || data.nivel,
          ganhos: data.ganhos || {},
          timestamp: Date.now(),
        },
      });
      playSound('level_up');
      log('Level Up', { userId: data.userId, nivel: data.novoNivel || data.nivel, success: true });
    });

    socket.on('combate_loot', (data: AnyObj) => {
      set({ lastCombateLoot: data });
      const todosItens = Array.isArray(data.todosItens) ? data.todosItens : [];
      log('Combate Loot', { totalItens: todosItens.length });
    });

    // ===== TRANSICAO DE ARCO =====
    socket.on('transicao_arco', (data: AnyObj) => {
      log('Transicao de arco', {
        arcoAnterior: data.arcoAnterior,
        arcoNovo: data.arcoNovo,
        tituloAnterior: data.tituloAnterior,
        tituloNovo: data.tituloNovo,
        porcentagem: data.porcentagem,
      });

      const addMessage = get().addMessage as ((msg: AnyObj) => void) | undefined;
      if (addMessage) {
        addMessage({
          tipo: 'sistema',
          message: data.tituloNovo
            ? `Arco "${data.tituloAnterior}" concluido! Proximo: "${data.tituloNovo}"`
            : `Arco "${data.tituloAnterior}" concluido! A aventura se aproxima do fim...`,
          timestamp: data.timestamp,
        });
      }
    });

    // ===== LISTENERS DE PARTICIPANTES =====
    socket.on('user_joined', (data: AnyObj) => {
      const { participantes = [] } = get();
      const jaExiste = participantes.find((p) => String((p as AnyObj).userId) === String(data.userId));

      if (!jaExiste) {
        const novoParticipante = {
          userId: data.userId,
          username: data.username,
          personagemId: data.personagemId,
          personagemNome: data.personagemNome,
          status: data.status || 'selecionando',
          isReconnection: data.isReconnection,
        };

        set({ participantes: [...participantes, novoParticipante] });
      }

      log('Usuario entrou', { username: data.username, success: true });
    });

    socket.on('user_left', (data: AnyObj) => {
      const { participantes = [] } = get();
      const participantesAtualizados = participantes.filter(
        (p) => String((p as AnyObj).userId) !== String(data.userId),
      );

      set({ participantes: participantesAtualizados });

      log('Usuario saiu', { username: data.username, success: true });
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
