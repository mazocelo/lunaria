import { useState, useCallback, useRef } from 'react';
import { historiaService, personagemService } from '../../../services/index';
import useGameStore from '../../../store/game';
import useSocketStore from '../../../store/socket';
import { useTemaStore } from '../../../store/tema/index';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface User {
  id?: number | string;
  nome?: string;
  name?: string;
  email?: string;
  [key: string]: unknown;
}

interface PersonagemBasico {
  id?: number | string;
  nome?: string;
  classe?: string;
  classe_nome?: string;
  raca?: string;
  raca_nome?: string;
  nivel?: number | string;
  hp?: number | string;
  hp_atual?: number | string;
  hp_maximo?: number | string;
  mp?: number | string;
  mp_atual?: number | string;
  xp?: number | string;
  [key: string]: unknown;
}

interface HistoriaBasica {
  id?: number | string;
  id_usuario?: number | string;
  nome?: string;
  titulo?: string;
  descricao?: string;
  prologo?: string;
  maximo_de_participantes?: number;
  temas?: unknown;
  [key: string]: unknown;
}

interface ParticipanteBasico {
  userId?: number | string;
  username?: string;
  personagem?: string;
  personagemId?: number | string;
  personagemNome?: string;
  isOwner?: boolean;
  status?: string;
  [key: string]: unknown;
}

async function extrairMensagemErroResponse(response: Response, fallback = 'Erro ao iniciar partida'): Promise<string> {
  try {
    const errorData = await response.json();

    if (typeof errorData?.error === 'string') return errorData.error;
    if (typeof errorData?.message === 'string') return errorData.message;
    if (typeof errorData?.error?.message === 'string') return errorData.error.message;

    return fallback;
  } catch {
    try {
      const text = await response.text();
      return text || fallback;
    } catch {
      return fallback;
    }
  }
}

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
  const [error, setError] = useState<string | null>(null);
  const [linkCopiado, setLinkCopiado] = useState(false);

  // === REFS ===
  const isInitializingRef = useRef(false);
  const isLoadingHistoriaRef = useRef(false);
  const copiarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const storeClearErrors = useGameStore(s => s.clearErrors);
  const storeSetLoadingPersonagens = useGameStore(s => s.setLoadingPersonagens);
  const storeSetErrorPersonagens = useGameStore(s => s.setErrorPersonagens);

  // ------------------------------------------------------------------
  // CARREGAR HISTORIA
  // ------------------------------------------------------------------
  const carregarHistoria = useCallback(async (historiaId: number | string) => {
    if (isLoadingHistoriaRef.current) return;
    try {
      isLoadingHistoriaRef.current = true;
      setLoading(true);
      storeSetLoading(true);
      setError(null);

      const historia = await historiaService.getById(Number(historiaId));
      storeSetHistoriaAtual(historia as unknown as Parameters<typeof storeSetHistoriaAtual>[0]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError('Erro ao carregar historia: ' + message);
    } finally {
      setLoading(false);
      storeSetLoading(false);
      isLoadingHistoriaRef.current = false;
    }
  }, [storeSetHistoriaAtual, storeSetLoading]);

  // ------------------------------------------------------------------
  // CARREGAR PERSONAGENS
  // ------------------------------------------------------------------
  const carregarPersonagens = useCallback(async (userId: number | string) => {
    const historia = useGameStore.getState().historiaAtual;
    if (!historia || !userId) return;

    try {
      storeSetLoadingPersonagens(true);
      storeSetErrorPersonagens(null);

      const response = await personagemService.getByUsuarioEHistoria(Number(userId), Number(historia.id)) as unknown as { personagens?: PersonagemBasico[] } | null;
      const personagens = response?.personagens || [];

      storeSetPersonagensDaHistoria(personagens as unknown as Parameters<typeof storeSetPersonagensDaHistoria>[0]);
      storeSetLoadingPersonagens(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      storeSetErrorPersonagens(message);
      storeSetLoadingPersonagens(false);
    }
  }, [storeSetPersonagensDaHistoria, storeSetLoadingPersonagens, storeSetErrorPersonagens]);

  // ------------------------------------------------------------------
  // RECARREGAR PERSONAGENS (forca recarga)
  // ------------------------------------------------------------------
  const recarregarPersonagens = useCallback(async (userId: number | string) => {
    const historia = useGameStore.getState().historiaAtual;
    if (!historia || !userId) return;

    try {
      storeSetLoadingPersonagens(true);
      storeSetErrorPersonagens(null);

      const response = await personagemService.getByUsuarioEHistoria(Number(userId), Number(historia.id)) as unknown as { personagens?: PersonagemBasico[] } | null;
      const personagens = response?.personagens || [];

      storeSetPersonagensDaHistoria(personagens as unknown as Parameters<typeof storeSetPersonagensDaHistoria>[0]);
      storeSetLoadingPersonagens(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      storeSetErrorPersonagens(message);
      storeSetLoadingPersonagens(false);
    }
  }, [storeSetPersonagensDaHistoria, storeSetLoadingPersonagens, storeSetErrorPersonagens]);

  // ------------------------------------------------------------------
  // INICIALIZAR JOGO (historia + temas)
  // ------------------------------------------------------------------
  const initializeGame = useCallback(async (historiaId: number | string, _options: { fromInvite?: boolean } = {}) => {
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
      const message = err instanceof Error ? err.message : String(err);
      setError('Erro ao inicializar jogo: ' + message);
      isInitializingRef.current = false;
    }
  }, [carregarHistoria, temasCarregados, carregarTemas, storeSelecionarPersonagem]);

  // ------------------------------------------------------------------
  // SELECIONAR PERSONAGEM
  // ------------------------------------------------------------------
  const selecionarPersonagem = useCallback(async (personagem: PersonagemBasico, user: User | null | undefined) => {
    const historia = useGameStore.getState().historiaAtual;
    const isDono = String(historia?.id_usuario) === String(user?.id);

    storeSelecionarPersonagem(personagem as unknown as Parameters<typeof storeSelecionarPersonagem>[0]);
    storeSetIsDonoSala(isDono);
    storeAbrirSala();

    // Adicionar usuario como participante
    const novoParticipante: ParticipanteBasico = {
      userId: user?.id,
      username: user?.nome || user?.name,
      personagem: personagem.nome,
      personagemNome: personagem.nome,
      personagemId: personagem.id,
      isOwner: isDono,
      status: 'pronto',
    };
    storeSetParticipantes([novoParticipante] as unknown as Parameters<typeof storeSetParticipantes>[0]);

    // Recarregar personagens
    if (user?.id) {
      await recarregarPersonagens(user.id);
    }
  }, [storeSelecionarPersonagem, storeSetIsDonoSala, storeAbrirSala, storeSetParticipantes, recarregarPersonagens]);

  // ------------------------------------------------------------------
  // INICIAR PARTIDA VIA API
  // ------------------------------------------------------------------
  const iniciarPartidaViaAPI = useCallback(async (historiaId: number | string, mensagemInicial: string | null = null) => {
    try {
      const response = await fetch(`${API_URL}/jogo/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          historiaId: parseInt(String(historiaId), 10),
          mensagemInicial: mensagemInicial || 'A aventura comeca agora!',
        }),
      });

      if (!response.ok) {
        const message = await extrairMensagemErroResponse(response, 'Erro ao iniciar partida');
        throw new Error(message);
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
    if (historia?.id == null) {
      setError('Historia nao carregada');
      throw new Error('Historia nao carregada');
    }
    try {
      await iniciarPartidaViaAPI(
        historia.id,
        `Bem-vindos a aventura "${historia.nome}"! Que a jornada comece!`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao iniciar jogo';
      setError(message);
      throw err;
    }
  }, [iniciarPartidaViaAPI]);

  // ------------------------------------------------------------------
  // CARREGAR MENSAGENS SALVAS (do Redis via API)
  // ------------------------------------------------------------------
  const carregarMensagensSalvas = useCallback(async (historiaId: number | string) => {
    try {
      const statusData = await historiaService.getStatusJogo(Number(historiaId)) as { sessao?: { jogadores?: Record<string, { id?: number | string; nome?: string; personagemNome?: string; personagemId?: number | string }>; mensagens?: Array<Record<string, unknown>>; mestreConfig?: { voice_id?: string | null; voice_provider?: string | null } } } | null;
      const sessao = statusData?.sessao;

      // Carregar participantes da sessao
      if (sessao?.jogadores) {
        const jogadoresArray = Object.values(sessao.jogadores);
        if (jogadoresArray.length > 0) {
          const participantesFormatados: ParticipanteBasico[] = jogadoresArray.map(j => ({
            userId: j.id,
            username: j.nome,
            personagem: j.personagemNome,
            personagemId: j.personagemId,
            personagemNome: j.personagemNome,
          }));
          storeSetParticipantes(participantesFormatados as unknown as Parameters<typeof storeSetParticipantes>[0]);
        }
      }

      if (sessao?.mensagens && Array.isArray(sessao.mensagens)) {
        const fallbackVoiceId = sessao?.mestreConfig?.voice_id || null;
        const fallbackVoiceProvider = sessao?.mestreConfig?.voice_provider || null;
        const mensagensFormatadas = sessao.mensagens.map((m, index: number) => ({
          ...m,
          id: m.id ?? m.timestamp ?? `msg_${Date.now()}_${index}`,
          message: m.mensagem || m.message,
          scene_image: m.scene_image || m.sceneImage || m.imagem_cena || null,
          voice_id: m.voice_id || fallbackVoiceId,
          voice_provider: m.voice_provider || fallbackVoiceProvider,
        }));

        storeSetMensagens(mensagensFormatadas as unknown as Parameters<typeof storeSetMensagens>[0]);
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
  const retomarJogo = useCallback(async (historiaId: number | string, user: User | null | undefined) => {
    try {
      setLoading(true);
      storeSetLoading(true);
      setError(null);

      // 1. Carregar historia
      await carregarHistoria(historiaId);

      // 2. Buscar dados da sessao
      const statusData = await historiaService.getStatusJogo(Number(historiaId)) as { sessao?: { jogadores?: Record<string, { personagemId?: number | string }> } } | null;
      const sessao = statusData?.sessao;

      if (!sessao) {
        throw new Error('Sessao nao encontrada');
      }

      // 3. Buscar personagem do usuario no mapa de jogadores
      const dadosJogador = sessao.jogadores?.[String(user?.id)];

      if (dadosJogador?.personagemId) {
        try {
          const personagem = await personagemService.getById(Number(dadosJogador.personagemId));
          storeSelecionarPersonagem(personagem as unknown as Parameters<typeof storeSelecionarPersonagem>[0]);

          const historia = useGameStore.getState().historiaAtual;
          const isDono = String(historia?.id_usuario) === String(user?.id);
          storeSetIsDonoSala(isDono);
          storeAbrirSala();
        } catch {
          // Sem personagem - carregar lista para escolher
          if (user?.id) {
            await carregarPersonagens(user.id);
          }
          return;
        }
      } else {
        // Sem personagem na sessao
        if (user?.id) {
          await carregarPersonagens(user.id);
        }
        return;
      }

      // 4. Carregar mensagens salvas
      await carregarMensagensSalvas(historiaId);

      // 5. Carregar personagens do usuario
      if (user?.id) {
        await carregarPersonagens(user.id);
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError('Erro ao retomar jogo: ' + message);
      throw err;
    } finally {
      setLoading(false);
      storeSetLoading(false);
    }
  }, [carregarHistoria, storeSelecionarPersonagem, storeSetIsDonoSala, storeAbrirSala, carregarPersonagens, carregarMensagensSalvas, storeSetLoading]);

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
  const adicionarMensagem = useCallback((mensagem: Parameters<typeof storeAdicionarMensagem>[0]) => {
    storeAdicionarMensagem(mensagem);
  }, [storeAdicionarMensagem]);

  const limparMensagensDados = useCallback((mensagensFiltradas: Parameters<typeof storeSetMensagens>[0] | null = null) => {
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
  const atualizarStatusPersonagem = useCallback((status: Parameters<typeof storeSetStatusPersonagem>[0]) => {
    storeSetStatusPersonagem(status);
  }, [storeSetStatusPersonagem]);

  // ------------------------------------------------------------------
  // PARTICIPANTES
  // ------------------------------------------------------------------
  const atualizarParticipantes = useCallback((lista: Parameters<typeof storeSetParticipantes>[0]) => {
    storeSetParticipantes(lista);
  }, [storeSetParticipantes]);

  // ------------------------------------------------------------------
  // TEMAS
  // ------------------------------------------------------------------
  const obterTemasNomes = useCallback((historia: HistoriaBasica | null | undefined): string[] => {
    if (!historia?.temas) return [];
    if (Array.isArray(historia.temas)) {
      return getNomesDeTemas(historia.temas);
    }
    return [];
  }, [getNomesDeTemas]);

  // ------------------------------------------------------------------
  // FORMATADORES
  // ------------------------------------------------------------------
  const formatarInformacoesHistoria = useCallback((historia: HistoriaBasica | null | undefined) => {
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

  const formatarInformacoesHistoriaSala = useCallback((historia: HistoriaBasica | null | undefined) => {
    if (!historia) {
      return { titulo: 'Historia sem nome', descricao: 'Uma aventura epica esta prestes a comecar...', temas: [] };
    }
    return {
      titulo: historia.nome || historia.titulo || 'Historia sem nome',
      descricao: historia.prologo || 'Uma aventura epica esta prestes a comecar...',
      temas: obterTemasNomes(historia),
    };
  }, [obterTemasNomes]);

  const formatarInformacoesPersonagem = useCallback((personagem: PersonagemBasico | null | undefined) => {
    if (!personagem) {
      return { nome: 'Personagem nao encontrado', classe: 'Desconhecida', raca: 'Desconhecida', nivel: '1', hp: '???', hpMaximo: '???', mp: '???', xp: '0' };
    }
    return {
      ...personagem,
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

  const formatarParticipantes = useCallback((participantesList: ParticipanteBasico[] | null | undefined, user: User | null | undefined) => {
    if (!Array.isArray(participantesList)) return [];
    return participantesList.map(p => ({
      ...p,
      username: p.username || 'Jogador Anonimo',
      personagem: p.personagem || p.personagemNome || 'Selecionando personagem...',
      isCurrentUser: p.userId === user?.id,
      isOwner: p.isOwner || false,
    }));
  }, []);

  const formatarParticipantesJogo = useCallback((participantesList: ParticipanteBasico[] | null | undefined, user: User | null | undefined) => {
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
  const validarPersonagem = useCallback((personagem: PersonagemBasico | null | undefined) => {
    if (!personagem) return { valido: false, erro: 'Personagem nao encontrado' };
    if (!personagem.nome) return { valido: false, erro: 'Personagem sem nome' };
    if (!personagem.classe_nome && !personagem.classe) return { valido: false, erro: 'Personagem sem classe definida' };
    if (!personagem.raca_nome && !personagem.raca) return { valido: false, erro: 'Personagem sem raca definida' };
    return { valido: true, erro: null };
  }, []);

  const validarIniciarJogo = useCallback((isDono: boolean, sala: boolean, iniciando: boolean) => {
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
  const getConnectionStatus = useCallback((socketConnected: boolean) => {
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

