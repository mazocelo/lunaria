import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { gameInitialStates } from './states.js';
import { createGameActions } from './actions.js';

/**
 * 🎮 GAME STORE - Store principal da sessão de jogo
 * 
 * Combina os estados iniciais com as ações usando o padrão moderno do Zustand.
 * Utiliza o middleware `combine` para separar estado das actions.
 */
export const useGameStore = create(
  combine(
    gameInitialStates,
    createGameActions
  )
);

// ===== COMPUTED STATES (SELECTORS) =====
export const useGameSelectors = {
  // Estados computados para dados da sessão
  dadosSessao: () => {
    const { historiaAtual, personagemSelecionado, sessaoId, participantes, isDonoSala } = useGameStore.getState();
    return {
      historiaAtual,
      personagemSelecionado,
      sessaoId,
      participantes,
      isDonoSala
    };
  },
  
  // Estado computado da sala
  estadoSala: () => {
    const { salaAberta, jogoIniciado, podeIniciarJogo, participantes } = useGameStore.getState();
    return {
      salaAberta,
      jogoIniciado,
      podeIniciarJogo,
      totalParticipantes: participantes.length
    };
  },
  
  // Validação para avançar etapa
  podeAvancarEtapa: (etapa) => {
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

  // Estado de prontidão para jogo
  estadoProntidao: () => {
    const { historiaAtual, personagemSelecionado, participantes, salaAberta } = useGameStore.getState();
    return {
      temHistoria: !!historiaAtual,
      temPersonagem: !!personagemSelecionado,
      temParticipantes: participantes.length > 0,
      salaAberta,
      prontoParaJogar: !!(historiaAtual && personagemSelecionado && salaAberta)
    };
  },

  // Dados para persistência (apenas dados críticos)
  dadosParaPersistir: () => {
    const { personagemSelecionado, historiaAtual, etapaAtual } = useGameStore.getState();
    return {
      personagemSelecionado, // Mais crítico - escolha do usuário
      // historiaAtual,       // Pode ser recuperado via API
      // etapaAtual          // Pode ser derivado do contexto
    };
  },
  
  // Estado completo para debugging
  estadoCompleto: () => {
    if (process.env.NODE_ENV === 'development') {
      return useGameStore.getState();
    }
    return null;
  }
};

// ===== UTILITIES PARA INICIALIZAÇÃO =====
export const initializeGameStore = () => {
  
  // Hidratar com dados do localStorage
  const { hidrataDoLocalStorage } = useGameStore.getState();
  hidrataDoLocalStorage();
};

// ===== EXPORTS =====
export default useGameStore;
export { gameInitialStates } from './states.js';
export { createGameActions } from './actions.js'; 