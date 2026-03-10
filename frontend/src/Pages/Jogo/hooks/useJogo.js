import { useState, useCallback, useRef } from 'react';
import { historiaService, personagemService } from '../../../services/index.js';
import useGameStore from '../../../store/game';
import useSocketStore from '../../../store/socket';
import { useTemaStore } from '../../../store/tema/index.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Hook compartilhado para orquestrar o ciclo de vida do jogo.
 * Substitui JogoViewModel, EtapaSelecaoPersonagemViewModel e EtapaSalaEsperaViewModel.
 *
 * Responsabilidades:
 * - Carregar historia e personagens
 * - Selecionar personagem
 * - Gerenciar participantes
 * - Mensagens do chat RPG
 * - Retomar sessao ativa
 * - Iniciar partida via API
 * - Compartilhar sala (copiar link)
 */
export const useJogo = () => {
  // === ZUSTAND STORES ===
  const gameStore = useGameStore();
  const {
    historiaAtual,
    personagensDaHistoria,
    personagemSelecionado,
    participantes,
    salaAberta,
    isDonoSala,
    mensagens,
    statusPersonagem,
    loading: gameLoading,
    error: gameError,
    loadingPersonagens,
    errorPersonagens,
  } = gameStore;

  // Tema store para nomes de temas
  const carregarTemas = useTemaStore(s => s.carregarTemas);
  const temasCarregados = useTemaStore(s => s.temasCarregados);
  const getNomesDeTemas = useTemaStore(s => s.getNomesDeTemas);

  // === LOCAL STATE ===
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [linkCopiado, setLinkCopiado] = useState(false);

  // === REFS ===
  const isInitializingRef = useRef(false);
  const isLoadingHistoriaRef = useRef(false);
  const copiarTimeoutRef = useRef(null);

  // === GAME STORE ACTIONS (stable references) ===
  const storeSetHistoriaAtual = useGameStore(s => s.setHistoriaAtual);
  const storeSetPersonagensDaHistoria = useGameStore(s => s.setPersonagensDaHistoria);
  const storeSelecionarPersonagem = useGameStore(s => s.selecionarPersonagem);
  const storeSetIsDonoSala = useGameStore(s => s.setIsDonoSala);
  const storeAbrirSala = useGameStore(s => s.abrirSala);
  const storeSetParticipantes = useGameStore(s => s.setParticipantes);
  const storeAdicionarMensagem = useGameStore(s => s.adicionarMensagem);
  const storeSetMensagens = useGameStore(s => s.setMensagens);
  const storeSetStatusPersonagem = useGameStore(s => s.setStatusPersonagem);
  const storeResetGameState = useGameStore(s => s.resetGameState);
  const storeSetLoading = useGameStore(s => s.setLoading);
  const storeSetError = useGameStore(s => s.setError);
  const storeClearErrors = useGameStore(s => s.clearErrors);
  const storeSetLoadingPersonagens = useGameStore(s => s.setLoadingPersonagens);
  const storeSetErrorPersonagens = useGameStore(s => s.setErrorPersonagens);

  // ------------------------------------------------------------------
  // CARREGAR HISTORIA
  // ------------------------------------------------------------------
  const carregarHistoria = useCallback(async (historiaId) => {
    if (isLoadingHistoriaRef.current) return;
    try {
      isLoadingHistoriaRef.current = true;
      setLoading(true);
      setError(null);

      const historia = await historiaService.getById(historiaId);
      storeSetHistoriaAtual(historia);

      setLoading(false);
      isLoadingHistoriaRef.current = false;
    } catch (err) {
      setError('Erro ao carregar historia: ' + err.message);
      setLoading(false);
      isLoadingHistoriaRef.current = false;
    }
  }, [storeSetHistoriaAtual]);

  // ------------------------------------------------------------------
  // CARREGAR PERSONAGENS
  // ------------------------------------------------------------------
  const carregarPersonagens = useCallback(async (userId) => {
    const historia = useGameStore.getState().historiaAtual;
    if (!historia || !userId) return;

    try {
      storeSetLoadingPersonagens(true);
      storeSetErrorPersonagens(null);

      const response = await personagemService.getByUsuarioEHistoria(userId, historia.id);
      const personagens = response.personagens || [];

      storeSetPersonagensDaHistoria(personagens);
      storeSetLoadingPersonagens(false);
    } catch (err) {
      storeSetErrorPersonagens(err.message);
      storeSetLoadingPersonagens(false);
    }
  }, [storeSetPersonagensDaHistoria, storeSetLoadingPersonagens, storeSetErrorPersonagens]);

  // ------------------------------------------------------------------
  // RECARREGAR PERSONAGENS (forca recarga)
  // ------------------------------------------------------------------
  const recarregarPersonagens = useCallback(async (userId) => {
    const historia = useGameStore.getState().historiaAtual;
    if (!historia || !userId) return;

    try {
      storeSetLoadingPersonagens(true);
      storeSetErrorPersonagens(null);

      const response = await personagemService.getByUsuarioEHistoria(userId, historia.id);
      const personagens = response.personagens || [];

      storeSetPersonagensDaHistoria(personagens);
      storeSetLoadingPersonagens(false);
    } catch (err) {
      storeSetErrorPersonagens(err.message);
      storeSetLoadingPersonagens(false);
    }
  }, [storeSetPersonagensDaHistoria, storeSetLoadingPersonagens, storeSetErrorPersonagens]);

  // ------------------------------------------------------------------
  // INICIALIZAR JOGO (historia + temas)
  // ------------------------------------------------------------------
  const initializeGame = useCallback(async (historiaId, options = {}) => {
    if (isInitializingRef.current) return;
    try {
      isInitializingRef.current = true;
      setError(null);

      // Limpar personagem selecionado de sessao anterior
      // Nova sessao = selecao obrigatoria de personagem
      storeSelecionarPersonagem(null);
      localStorage.removeItem('personagemSelecionado');

      await carregarHistoria(historiaId);

      // Carregar temas se necessario
      if (!temasCarregados) {
        await carregarTemas();
      }

      isInitializingRef.current = false;
    } catch (err) {
      setError('Erro ao inicializar jogo: ' + err.message);
      isInitializingRef.current = false;
    }
  }, [carregarHistoria, temasCarregados, carregarTemas, storeSelecionarPersonagem]);

  // ------------------------------------------------------------------
  // SELECIONAR PERSONAGEM
  // ------------------------------------------------------------------
  const selecionarPersonagem = useCallback(async (personagem, user) => {
    const historia = useGameStore.getState().historiaAtual;
    const isDono = String(historia?.id_usuario) === String(user?.id);

    storeSelecionarPersonagem(personagem);
    storeSetIsDonoSala(isDono);
    storeAbrirSala();

    // Adicionar usuario como participante
    const novoParticipante = {
      userId: user?.id,
      username: user?.nome || user?.name,
      personagem: personagem.nome,
      personagemNome: personagem.nome,
      personagemId: personagem.id,
      isOwner: isDono,
      status: 'pronto',
    };
    storeSetParticipantes([novoParticipante]);

    // Recarregar personagens
    if (user?.id) {
      await recarregarPersonagens(user.id);
    }
  }, [storeSelecionarPersonagem, storeSetIsDonoSala, storeAbrirSala, storeSetParticipantes, recarregarPersonagens]);

  // ------------------------------------------------------------------
  // INICIAR PARTIDA VIA API
  // ------------------------------------------------------------------
  const iniciarPartidaViaAPI = useCallback(async (historiaId, mensagemInicial = null) => {
    try {
      const response = await fetch(`${API_URL}/jogo/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          historiaId: parseInt(historiaId),
          mensagemInicial: mensagemInicial || 'A aventura comeca agora!',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao iniciar partida');
      }

      return await response.json();
    } catch (err) {
      throw err;
    }
  }, []);

  // ------------------------------------------------------------------
  // INICIAR JOGO (orquestra tudo)
  // ------------------------------------------------------------------
  const iniciarJogo = useCallback(async () => {
    const historia = useGameStore.getState().historiaAtual;
    try {
      await iniciarPartidaViaAPI(
        historia?.id,
        `Bem-vindos a aventura "${historia?.nome}"! Que a jornada comece!`
      );
    } catch (err) {
      setError(err.message || 'Erro ao iniciar jogo');
      throw err;
    }
  }, [iniciarPartidaViaAPI]);

  // ------------------------------------------------------------------
  // CARREGAR MENSAGENS SALVAS (do Redis via API)
  // ------------------------------------------------------------------
  const carregarMensagensSalvas = useCallback(async (historiaId) => {
    try {
      const statusData = await historiaService.getStatusJogo(historiaId);
      const { sessao } = statusData || {};

      // Carregar participantes da sessao
      if (sessao?.jogadores) {
        const jogadoresArray = Object.values(sessao.jogadores);
        if (jogadoresArray.length > 0) {
          const participantesFormatados = jogadoresArray.map(j => ({
            userId: j.id,
            username: j.nome,
            personagem: j.personagemNome,
            personagemId: j.personagemId,
            personagemNome: j.personagemNome,
          }));
          storeSetParticipantes(participantesFormatados);
        }
      }

      if (sessao?.mensagens && Array.isArray(sessao.mensagens)) {
        const mensagensFormatadas = sessao.mensagens.map(m => ({
          ...m,
          id: m.timestamp || Date.now(),
          message: m.mensagem || m.message,
        }));

        storeSetMensagens(mensagensFormatadas);
        return sessao.mensagens.length;
      }

      return 0;
    } catch {
      return 0;
    }
  }, [storeSetParticipantes, storeSetMensagens]);

  // ------------------------------------------------------------------
  // RETOMAR JOGO ATIVO
  // ------------------------------------------------------------------
  const retomarJogo = useCallback(async (historiaId, user) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Carregar historia
      await carregarHistoria(historiaId);

      // 2. Buscar dados da sessao
      const statusData = await historiaService.getStatusJogo(historiaId);
      const { sessao } = statusData || {};

      if (!sessao) {
        throw new Error('Sessao nao encontrada');
      }

      // 3. Buscar personagem do usuario no mapa de jogadores
      const dadosJogador = sessao.jogadores?.[String(user?.id)];

      if (dadosJogador?.personagemId) {
        try {
          const personagem = await personagemService.getById(dadosJogador.personagemId);
          storeSelecionarPersonagem(personagem);

          const historia = useGameStore.getState().historiaAtual;
          const isDono = String(historia?.id_usuario) === String(user?.id);
          storeSetIsDonoSala(isDono);
          storeAbrirSala();
        } catch {
          // Sem personagem - carregar lista para escolher
          if (user?.id) {
            await carregarPersonagens(user.id);
          }
          setLoading(false);
          return;
        }
      } else {
        // Sem personagem na sessao
        if (user?.id) {
          await carregarPersonagens(user.id);
        }
        setLoading(false);
        return;
      }

      // 4. Carregar mensagens salvas
      await carregarMensagensSalvas(historiaId);

      // 5. Carregar personagens do usuario
      if (user?.id) {
        await carregarPersonagens(user.id);
      }

      setLoading(false);
    } catch (err) {
      setError('Erro ao retomar jogo: ' + err.message);
      setLoading(false);
      throw err;
    }
  }, [carregarHistoria, storeSelecionarPersonagem, storeSetIsDonoSala, storeAbrirSala, carregarPersonagens, carregarMensagensSalvas]);

  // ------------------------------------------------------------------
  // SAIR DO JOGO
  // ------------------------------------------------------------------
  const sairDoJogo = useCallback(() => {
    storeResetGameState();
    useSocketStore.getState().resetSocketState();
  }, [storeResetGameState]);

  // ------------------------------------------------------------------
  // MENSAGENS
  // ------------------------------------------------------------------
  const adicionarMensagem = useCallback((mensagem) => {
    storeAdicionarMensagem(mensagem);
  }, [storeAdicionarMensagem]);

  const limparMensagensDados = useCallback((mensagensFiltradas = null) => {
    if (mensagensFiltradas) {
      storeSetMensagens(mensagensFiltradas);
    } else {
      const current = useGameStore.getState().mensagens;
      const filtradas = current.filter(m => m.tipo === 'mestre' || m.tipo === 'entre_rodadas');
      storeSetMensagens(filtradas);
    }
  }, [storeSetMensagens]);

  // ------------------------------------------------------------------
  // STATUS DO PERSONAGEM
  // ------------------------------------------------------------------
  const atualizarStatusPersonagem = useCallback((status) => {
    storeSetStatusPersonagem(status);
  }, [storeSetStatusPersonagem]);

  // ------------------------------------------------------------------
  // PARTICIPANTES
  // ------------------------------------------------------------------
  const atualizarParticipantes = useCallback((lista) => {
    storeSetParticipantes(lista);
  }, [storeSetParticipantes]);

  // ------------------------------------------------------------------
  // TEMAS
  // ------------------------------------------------------------------
  const obterTemasNomes = useCallback((historia) => {
    if (!historia?.temas) return [];
    if (Array.isArray(historia.temas)) {
      return getNomesDeTemas(historia.temas);
    }
    return [];
  }, [getNomesDeTemas]);

  // ------------------------------------------------------------------
  // FORMATADORES
  // ------------------------------------------------------------------
  const formatarInformacoesHistoria = useCallback((historia) => {
    if (!historia) {
      return { nome: 'Historia sem nome', descricao: '', maximoParticipantes: 0, temas: [] };
    }
    return {
      nome: historia.nome || historia.titulo || 'Historia sem nome',
      descricao: historia.descricao || '',
      maximoParticipantes: historia.maximo_de_participantes || 0,
      temas: obterTemasNomes(historia),
    };
  }, [obterTemasNomes]);

  const formatarInformacoesHistoriaSala = useCallback((historia) => {
    if (!historia) {
      return { titulo: 'Historia sem nome', descricao: 'Uma aventura epica esta prestes a comecar...', temas: [] };
    }
    return {
      titulo: historia.nome || historia.titulo || 'Historia sem nome',
      descricao: historia.prologo || 'Uma aventura epica esta prestes a comecar...',
      temas: obterTemasNomes(historia),
    };
  }, [obterTemasNomes]);

  const formatarInformacoesPersonagem = useCallback((personagem) => {
    if (!personagem) {
      return { nome: 'Personagem nao encontrado', classe: 'Desconhecida', raca: 'Desconhecida', nivel: '1', hp: '???', hpMaximo: '???', mp: '???', xp: '0' };
    }
    return {
      nome: personagem.nome || 'Personagem sem nome',
      classe: personagem.classe_nome || personagem.classe || 'Desconhecida',
      raca: personagem.raca_nome || personagem.raca || 'Desconhecida',
      nivel: personagem.nivel || '1',
      hp: personagem.hp_atual || personagem.hp || '???',
      hpMaximo: personagem.hp_maximo || personagem.hp || '???',
      mp: personagem.mp_atual || personagem.mp || '???',
      xp: personagem.xp || '0',
    };
  }, []);

  const formatarParticipantes = useCallback((participantesList, user) => {
    if (!Array.isArray(participantesList)) return [];
    return participantesList.map(p => ({
      ...p,
      username: p.username || 'Jogador Anonimo',
      personagem: p.personagem || p.personagemNome || 'Selecionando personagem...',
      isCurrentUser: p.userId === user?.id,
      isOwner: p.isOwner || false,
    }));
  }, []);

  const formatarParticipantesJogo = useCallback((participantesList, user) => {
    if (!Array.isArray(participantesList)) return [];
    return participantesList
      .filter(p => p.userId !== user?.id)
      .map(p => ({
        ...p,
        username: p.username || 'Jogador',
        personagem: p.personagem || 'Personagem',
        isOwner: p.isOwner || false,
        status: p.status || 'online',
      }));
  }, []);

  // ------------------------------------------------------------------
  // VALIDADORES
  // ------------------------------------------------------------------
  const validarPersonagem = useCallback((personagem) => {
    if (!personagem) return { valido: false, erro: 'Personagem nao encontrado' };
    if (!personagem.nome) return { valido: false, erro: 'Personagem sem nome' };
    if (!personagem.classe_nome && !personagem.classe) return { valido: false, erro: 'Personagem sem classe definida' };
    if (!personagem.raca_nome && !personagem.raca) return { valido: false, erro: 'Personagem sem raca definida' };
    return { valido: true, erro: null };
  }, []);

  const validarIniciarJogo = useCallback((isDono, sala, iniciando) => {
    if (!isDono) return { podeIniciar: false, motivo: 'Apenas o Mestre pode iniciar o jogo' };
    if (iniciando) return { podeIniciar: false, motivo: 'Jogo ja esta sendo iniciado...' };
    if (!sala) return { podeIniciar: false, motivo: 'Sala nao esta aberta' };
    return { podeIniciar: true, motivo: null };
  }, []);

  // ------------------------------------------------------------------
  // COMPARTILHAR SALA
  // ------------------------------------------------------------------
  const compartilharSala = useCallback(async () => {
    try {
      let url = window.location.href;
      url = url.replace('/jogo/', '/convite-jogo/');

      await navigator.clipboard.writeText(url);
      setLinkCopiado(true);

      if (copiarTimeoutRef.current) clearTimeout(copiarTimeoutRef.current);
      copiarTimeoutRef.current = setTimeout(() => setLinkCopiado(false), 2000);

      return true;
    } catch {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = window.location.href.replace('/jogo/', '/convite-jogo/');
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        setLinkCopiado(true);
        if (copiarTimeoutRef.current) clearTimeout(copiarTimeoutRef.current);
        copiarTimeoutRef.current = setTimeout(() => setLinkCopiado(false), 2000);

        return true;
      } catch {
        return false;
      }
    }
  }, []);

  // ------------------------------------------------------------------
  // CONNECTION STATUS (formatado para exibicao)
  // ------------------------------------------------------------------
  const getConnectionStatus = useCallback((socketConnected) => {
    if (!socketConnected) {
      return {
        text: 'Desconectado',
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        icon: '🔴',
      };
    }
    return {
      text: 'Conectado a Sala',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
      icon: '🟢',
    };
  }, []);

  // ------------------------------------------------------------------
  // CLEAR ERRORS
  // ------------------------------------------------------------------
  const clearErrors = useCallback(() => {
    setError(null);
    storeClearErrors();
  }, [storeClearErrors]);

  const clearErrorPersonagens = useCallback(() => {
    storeSetErrorPersonagens(null);
  }, [storeSetErrorPersonagens]);

  // ------------------------------------------------------------------
  // RETURN
  // ------------------------------------------------------------------
  return {
    // State (from store)
    historiaAtual,
    personagensDaHistoria,
    personagemSelecionado,
    participantes,
    salaAberta,
    isDonoSala,
    mensagens,
    statusPersonagem,
    loadingPersonagens,
    errorPersonagens,

    // Local state
    loading: loading || gameLoading,
    error: error || gameError,
    linkCopiado,

    // Actions - lifecycle
    initializeGame,
    carregarHistoria,
    carregarPersonagens,
    recarregarPersonagens,
    selecionarPersonagem,
    iniciarJogo,
    retomarJogo,
    sairDoJogo,

    // Actions - mensagens
    adicionarMensagem,
    limparMensagensDados,
    carregarMensagensSalvas,

    // Actions - participantes
    atualizarParticipantes,
    atualizarStatusPersonagem,

    // Actions - sala
    compartilharSala,
    iniciarPartidaViaAPI,

    // Formatadores
    formatarInformacoesHistoria,
    formatarInformacoesHistoriaSala,
    formatarInformacoesPersonagem,
    formatarParticipantes,
    formatarParticipantesJogo,
    obterTemasNomes,
    getConnectionStatus,

    // Validadores
    validarPersonagem,
    validarIniciarJogo,

    // Error handling
    clearErrors,
    clearErrorPersonagens,
  };
};

export default useJogo;
