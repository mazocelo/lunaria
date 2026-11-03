import { normalizeGameMessage, normalizeGameMessages } from '../../utils/gameMessageNormalizer.js';
import type {
  GameHistoria,
  GameMensagem,
  GameParticipante,
  GamePersonagem,
  GameState,
} from './states';

/**
 * GAME ACTIONS - Logicas e acoes da sessao de jogo
 *
 * Contem todas as funcoes que modificam o estado do jogo:
 * - Controle de etapas
 * - Gerenciamento de historia
 * - Manipulacao de personagens
 * - Controle de sessao e participantes
 * - Acoes do jogo ativo
 * - Funcoes de reset e persistencia
 */

export type GameActions = {
  setHistoriaAtual: (historia: GameHistoria | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearErrors: () => void;
  setPersonagensDaHistoria: (personagens: GamePersonagem[]) => void;
  selecionarPersonagem: (personagem: GamePersonagem | null) => void;
  setLoadingPersonagens: (loading: boolean) => void;
  setErrorPersonagens: (error: string | null | undefined) => void;
  setBuscaPersonagem: (busca: string) => void;
  setSessaoId: (sessaoId: number | string | null) => void;
  setIsDonoSala: (isDonoSala: boolean) => void;
  abrirSala: () => void;
  fecharSala: () => void;
  adicionarParticipante: (participante: GameParticipante) => void;
  removerParticipante: (participanteId: number | string) => void;
  atualizarStatusParticipante: (participanteId: number | string, status: string) => void;
  setParticipantes: (participantes: GameParticipante[]) => void;
  adicionarMensagem: (mensagem: GameMensagem) => void;
  atualizarMensagem: (id: number | string, campos: Partial<GameMensagem>) => void;
  setMensagens: (mensagens: GameMensagem[]) => void;
  setStatusPersonagem: (status: Record<string, unknown>) => void;
  hidrataDoLocalStorage: () => void;
  persistirEstadoCritico: () => void;
  limparDadosPersistidos: () => void;
  resetGameState: () => void;
  sairDaSala: () => void;
};

type SetState = (partial: Partial<GameState>) => void;
type GetState = () => GameState;

export const createGameActions = (set: SetState, getBase: GetState): GameActions => {
  const get = getBase as () => GameState & GameActions;
  return ({
    setHistoriaAtual: (historia) => {
      set({ historiaAtual: historia });
    },

    setLoading: (loading) => {
      set({ loading });
    },

    setError: (error) => {
      console.error('GameStore: Erro de jogo definido:', error);
      set({ error });
    },

    clearErrors: () => {
      set({ error: null, errorPersonagens: null });
    },

    setPersonagensDaHistoria: (personagens) => {
      set({ personagensDaHistoria: personagens });
    },

    selecionarPersonagem: (personagem) => {
      if (!personagem) {
        set({ personagemSelecionado: null });
        return;
      }

      const { personagensDaHistoria } = get();
      if (personagensDaHistoria.length > 0) {
        const personagemValido = personagensDaHistoria.find((p) => p.id === personagem.id);
        if (!personagemValido) {
          console.warn('GameStore: Personagem nao encontrado na lista da historia');
          set({ error: 'Personagem nao encontrado na lista desta historia. Recarregue a pagina.' });
          return;
        }
      }

      set({ personagemSelecionado: personagem, error: null });
    },

    setLoadingPersonagens: (loading) => {
      set({ loadingPersonagens: loading });
    },

    setErrorPersonagens: (error) => {
      if (error === null || error === undefined) {
        set({ errorPersonagens: null });
        return;
      }

      console.error('GameStore: Erro personagens:', error);
      set({ errorPersonagens: error });
    },

    setBuscaPersonagem: (busca) => {
      set({ buscaPersonagem: busca });
    },

    setSessaoId: (sessaoId) => {
      set({ sessaoId });
    },

    setIsDonoSala: (isDonoSala) => {
      set({ isDonoSala });
    },

    abrirSala: () => {
      set({ salaAberta: true, podeIniciarJogo: true });
    },

    fecharSala: () => {
      set({ salaAberta: false, podeIniciarJogo: false });
    },

    adicionarParticipante: (participante) => {
      const { participantes } = get();
      if (!participantes.find((p) => (p.userId || p.id) === (participante.userId || participante.id))) {
        set({ participantes: [...participantes, participante] });
      }
    },

    removerParticipante: (participanteId) => {
      const { participantes } = get();
      set({ participantes: participantes.filter((p) => (p.userId || p.id) !== participanteId) });
    },

    atualizarStatusParticipante: (participanteId, status) => {
      const { participantes } = get();
      const participantesAtualizados = participantes.map((p) =>
        (p.userId || p.id) === participanteId ? { ...p, status } : p,
      );
      set({ participantes: participantesAtualizados });
    },

    setParticipantes: (participantes) => {
      set({ participantes });
    },

    adicionarMensagem: (mensagem) => {
      const { mensagens } = get();
      const mensagemNormalizada = normalizeGameMessage(mensagem) as GameMensagem;
      const messageId = mensagemNormalizada.id;

      if (messageId && mensagens.some((m) => String(m.id) === String(messageId))) {
        return;
      }

      set({ mensagens: [...mensagens, mensagemNormalizada] });
    },

    atualizarMensagem: (id, campos) => {
      const { mensagens } = get();
      set({
        mensagens: mensagens.map((mensagem) => (
          String(mensagem.id) === String(id)
            ? normalizeGameMessage({ ...mensagem, ...campos }) as GameMensagem
            : mensagem
        )),
      });
    },

    setMensagens: (mensagens) => {
      set({ mensagens: normalizeGameMessages(mensagens) as GameMensagem[] });
    },

    setStatusPersonagem: (status) => {
      set({ statusPersonagem: status });
    },

    /**
     * Hidrata o store com dados do localStorage
     * USO: Apenas na inicializacao da aplicacao
     */
    hidrataDoLocalStorage: () => {
      try {
        const personagemSalvo = localStorage.getItem('personagemSelecionado');
        if (personagemSalvo) {
          const personagem = JSON.parse(personagemSalvo) as GamePersonagem;
          set({ personagemSelecionado: personagem });
        }
      } catch (error) {
        console.error('GameStore: Erro na hidratacao do localStorage:', error);
      }
    },

    /**
     * Persiste dados criticos no localStorage
     * USO: Chamada explicita quando necessario preservar estado
     */
    persistirEstadoCritico: () => {
      try {
        const { personagemSelecionado } = get();
        if (personagemSelecionado) {
          localStorage.setItem('personagemSelecionado', JSON.stringify(personagemSelecionado));
        }
      } catch (error) {
        console.error('GameStore: Erro na persistencia:', error);
      }
    },

    /**
     * Limpa dados persistidos no localStorage
     * USO: Logout, reset, ou quando dados nao sao mais necessarios
     */
    limparDadosPersistidos: () => {
      try {
        localStorage.removeItem('personagemSelecionado');
      } catch (error) {
        console.error('GameStore: Erro ao limpar localStorage:', error);
      }
    },

    resetGameState: () => {
      get().limparDadosPersistidos();

      set({
        historiaAtual: null,
        loading: false,
        error: null,
        personagensDaHistoria: [],
        personagemSelecionado: null,
        loadingPersonagens: false,
        errorPersonagens: null,
        buscaPersonagem: '',
        participantes: [],
        sessaoId: null,
        isDonoSala: false,
        salaAberta: false,
        podeIniciarJogo: false,
        mensagens: [],
        statusPersonagem: {},
      });
    },

    sairDaSala: () => {
      const { resetGameState } = get();
      resetGameState();
    },
  });
};

export default createGameActions;
