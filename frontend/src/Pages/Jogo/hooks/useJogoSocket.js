import { useState, useCallback, useRef, useEffect } from 'react';
import { useSocketStore } from '../../../store/socket/index.js';
import { historiaService } from '../../../services/index.js';
import useGameStore from '../../../store/game';

/**
 * Hook compartilhado para gerenciar conexao WebSocket do jogo.
 * Substitui a logica de socket do JogoViewModel.
 *
 * Responsabilidades:
 * - Conectar/desconectar do WebSocket
 * - Autenticar no socket
 * - Entrar na sala (joinRoom)
 * - Conectar como anfitriao ou convidado
 * - Sincronizar participantes em tempo real
 * - Listeners de eventos (aventura_iniciada, room_joined, etc.)
 * - Enviar mensagens
 * - Controle de typing
 */
export const useJogoSocket = () => {
  // === ZUSTAND STORES ===
  const isConnected = useSocketStore(s => s.isConnected);
  const isConnecting = useSocketStore(s => s.isConnecting);
  const isAuthenticated = useSocketStore(s => s.isAuthenticated);
  const socketError = useSocketStore(s => s.error);
  const isReconnecting = useSocketStore(s => s.isReconnecting);
  const roomUsers = useSocketStore(s => s.roomUsers);
  const inRoom = useSocketStore(s => s.inRoom);

  // Socket store actions
  const socketConnect = useSocketStore(s => s.connect);
  const socketAuthenticate = useSocketStore(s => s.authenticate);
  const socketJoinRoom = useSocketStore(s => s.joinRoom);
  const socketSendMessage = useSocketStore(s => s.sendMessage);
  const socketOn = useSocketStore(s => s.on);
  const socketOff = useSocketStore(s => s.off);

  // Game store actions
  const storeSetParticipantes = useGameStore(s => s.setParticipantes);
  const storeSetMensagens = useGameStore(s => s.setMensagens);
  const storeAbrirSala = useGameStore(s => s.abrirSala);

  // === LOCAL STATE ===
  const [localSocketError, setLocalSocketError] = useState(null);
  const [localIsConnecting, setLocalIsConnecting] = useState(false);

  // === REFS ===
  const socketStoreUnsubscribeRef = useRef(null);

  // ------------------------------------------------------------------
  // VALIDAR AUTENTICACAO
  // ------------------------------------------------------------------
  const validarAutenticacao = useCallback(async () => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      throw new Error('Usuario nao autenticado. Por favor, faca login novamente.');
    }
    return true;
  }, []);

  // ------------------------------------------------------------------
  // CONECTAR SOCKET (anfitriao)
  // ------------------------------------------------------------------
  const conectarSocket = useCallback(async (connectionData) => {
    try {
      setLocalIsConnecting(true);
      setLocalSocketError(null);

      await validarAutenticacao();

      // Conectar ao WebSocket
      await socketConnect();

      // Obter socketToken do Zustand store
      const socketToken = useSocketStore.getState().socketToken;

      await socketAuthenticate({
        token: socketToken,
        userId: String(connectionData.userId),
        username: connectionData.username,
        email: connectionData.email,
      });

      // Aguardar autenticação ser confirmada pelo backend
      const waitForAuth = () => new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Auth timeout')), 5000);
        const check = () => {
          const state = useSocketStore.getState();
          if (state.isAuthenticated) { clearTimeout(timeout); resolve(); return; }
          setTimeout(check, 100);
        };
        check();
      });
      await waitForAuth();

      // Se tiver historia e personagem, entrar na sala
      const gameState = useGameStore.getState();
      const historia = gameState.historiaAtual;
      const personagem = gameState.personagemSelecionado;

      if (historia?.id && personagem?.id) {
        await socketJoinRoom({
          id: historia.id,
          historiaId: String(historia.id),
          nome: historia.nome,
          titulo: historia.nome,
          userId: String(connectionData.userId),
          username: connectionData.username,
          personagemId: String(personagem.id),
          personagemNome: personagem.nome || 'Personagem',
        });

        // Carregar participantes da sessao
        const roomState = useSocketStore.getState();
        if (roomState.session?.jogadoresConectados) {
          const participantesAtuais = gameState.participantes;
          const participantesFormatados = roomState.session.jogadoresConectados.map(j => {
            const participanteExistente = participantesAtuais.find(
              p => String(p.userId) === String(j.userId)
            );
            const isOwner = String(j.userId) === String(historia?.id_usuario);

            if (participanteExistente) {
              return { ...j, ...participanteExistente, isOwner };
            }

            return {
              userId: j.userId,
              username: j.username,
              personagem: j.personagemNome || 'Selecionando...',
              personagemNome: j.personagemNome,
              personagemId: j.personagemId,
              status: j.status || 'selecionando',
              isOwner,
            };
          });

          storeSetParticipantes(participantesFormatados);
        }

        // Sincronizar com socket store em tempo real
        if (socketStoreUnsubscribeRef.current) {
          socketStoreUnsubscribeRef.current();
        }

        const unsubscribe = useSocketStore.subscribe((state, prevState) => {
          if (state.participantes && state.participantes !== prevState?.participantes) {
            storeSetParticipantes(state.participantes);
          }
        });
        socketStoreUnsubscribeRef.current = unsubscribe;

        // Verificar se sessao ja foi iniciada
        if (roomState.session?.status === 'iniciada') {
          // Carregar mensagens salvas
          try {
            const statusData = await historiaService.getStatusJogo(historia.id);
            const { sessao } = statusData || {};
            if (sessao?.mensagens && Array.isArray(sessao.mensagens)) {
              const mensagensFormatadas = sessao.mensagens.map(m => ({
                id: m.timestamp || Date.now(),
                userId: m.userId,
                username: m.username,
                message: m.mensagem,
                tipo: m.tipo,
                timestamp: m.timestamp,
              }));
              storeSetMensagens(mensagensFormatadas);
            }
          } catch { /* silenced */ }

          setLocalIsConnecting(false);

          return { sessionAlreadyStarted: true };
        }
      }

      setLocalIsConnecting(false);
      return { sessionAlreadyStarted: false };
    } catch (err) {
      setLocalSocketError(err.message || 'Erro ao conectar');
      setLocalIsConnecting(false);
      throw err;
    }
  }, [validarAutenticacao, socketConnect, socketAuthenticate, socketJoinRoom, storeSetParticipantes, storeSetMensagens]);

  // ------------------------------------------------------------------
  // CONECTAR COMO CONVIDADO
  // ------------------------------------------------------------------
  const conectarComoConvidado = useCallback(async (historiaId, personagemId, user) => {
    try {
      setLocalIsConnecting(true);
      setLocalSocketError(null);

      // 1. Buscar dados da sessao
      const statusData = await historiaService.getStatusJogo(historiaId);
      const { sessao } = statusData || {};

      if (!sessao) {
        throw new Error('Sala nao encontrada ou ainda nao foi criada');
      }

      // 2. Validar autenticacao
      await validarAutenticacao();

      // 3. Conectar ao WebSocket
      await socketConnect();

      const socketToken = useSocketStore.getState().socketToken;

      await socketAuthenticate({
        token: socketToken,
        userId: String(user.id),
        username: user.nome || user.name,
        email: user.email,
      });

      // Aguardar processamento
      await new Promise(resolve => setTimeout(resolve, 500));

      // 4. Entrar na sala
      const gameState = useGameStore.getState();
      const personagem = gameState.personagemSelecionado;

      await socketJoinRoom({
        id: parseInt(historiaId),
        historiaId: String(historiaId),
        nome: gameState.historiaAtual?.nome || sessao.historiaNome || 'Historia',
        titulo: gameState.historiaAtual?.nome || sessao.historiaNome || 'Historia',
        userId: String(user.id),
        username: user.nome || user.name,
        personagemId: String(personagemId),
        personagemNome: personagem?.nome || 'Personagem',
      });

      setLocalIsConnecting(false);
    } catch (err) {
      setLocalSocketError(err.message || 'Erro ao conectar a sala');
      setLocalIsConnecting(false);
      throw err;
    }
  }, [validarAutenticacao, socketConnect, socketAuthenticate, socketJoinRoom]);

  // ------------------------------------------------------------------
  // ENVIAR MENSAGEM
  // ------------------------------------------------------------------
  const enviarMensagem = useCallback(async (payload) => {
    if (!socketSendMessage) return false;
    try {
      await socketSendMessage(payload);
      return true;
    } catch {
      return false;
    }
  }, [socketSendMessage]);

  // ------------------------------------------------------------------
  // LISTENERS (on/off)
  // ------------------------------------------------------------------
  const onSocketEvent = useCallback((event, handler) => {
    if (socketOn) socketOn(event, handler);
  }, [socketOn]);

  const offSocketEvent = useCallback((event, handler) => {
    if (socketOff) socketOff(event, handler);
  }, [socketOff]);

  // ------------------------------------------------------------------
  // CLEANUP
  // ------------------------------------------------------------------
  const cleanup = useCallback(() => {
    if (socketStoreUnsubscribeRef.current) {
      socketStoreUnsubscribeRef.current();
      socketStoreUnsubscribeRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // ------------------------------------------------------------------
  // CLEAR SOCKET ERROR
  // ------------------------------------------------------------------
  const clearSocketError = useCallback(() => {
    setLocalSocketError(null);
  }, []);

  // ------------------------------------------------------------------
  // RETURN
  // ------------------------------------------------------------------
  return {
    // State
    isConnected,
    isConnecting: isConnecting || localIsConnecting,
    isAuthenticated,
    socketError: localSocketError || socketError,
    isReconnecting,
    roomUsers,
    inRoom,

    // Actions
    conectarSocket,
    conectarComoConvidado,
    enviarMensagem,

    // Listeners
    onSocketEvent,
    offSocketEvent,

    // Cleanup
    cleanup,
    clearSocketError,
  };
};

export default useJogoSocket;
