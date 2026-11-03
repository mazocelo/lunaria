import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { gameInitialStates } from './states';
import { createGameActions } from './actions';

/**
 * GAME STORE - Store principal da sessao de jogo
 *
 * Combina os estados iniciais com as acoes usando o padrao moderno do Zustand.
 * Utiliza o middleware `combine` para separar estado das actions.
 */
export const useGameStore = create(
  combine(
    gameInitialStates,
    createGameActions,
  ),
);

export const useGameSelectors = {
  dadosSessao: () => {
    const { historiaAtual, personagemSelecionado, sessaoId, participantes, isDonoSala } = useGameStore.getState();
    return {
      historiaAtual,
      personagemSelecionado,
      sessaoId,
      participantes,
      isDonoSala,
    };
  },

  estadoSala: () => {
    const { salaAberta, podeIniciarJogo, participantes } = useGameStore.getState();
    return {
      salaAberta,
      podeIniciarJogo,
      totalParticipantes: participantes.length,
    };
  },

  podeAvancarEtapa: (etapa: string) => {
    const { historiaAtual, personagemSelecionado, salaAberta } = useGameStore.getState();

    switch (etapa) {
      case 'selecao-personagem':
        return !!historiaAtual;
      case 'sala-espera':
        return !!(historiaAtual && personagemSelecionado);
      case 'jogo-ativo':
        return !!(salaAberta && personagemSelecionado);
      default:
        return true;
    }
  },

  estadoProntidao: () => {
    const { historiaAtual, personagemSelecionado, participantes, salaAberta } = useGameStore.getState();
    return {
      temHistoria: !!historiaAtual,
      temPersonagem: !!personagemSelecionado,
      temParticipantes: participantes.length > 0,
      salaAberta,
      prontoParaJogar: !!(historiaAtual && personagemSelecionado && salaAberta),
    };
  },

  dadosParaPersistir: () => {
    const { personagemSelecionado } = useGameStore.getState();
    return {
      personagemSelecionado,
    };
  },

  estadoCompleto: () => {
    if (import.meta.env.DEV) {
      return useGameStore.getState();
    }
    return null;
  },
};

export const initializeGameStore = (): void => {
  const { hidrataDoLocalStorage } = useGameStore.getState();
  hidrataDoLocalStorage();
};

export default useGameStore;
export { gameInitialStates } from './states';
export { createGameActions } from './actions';
