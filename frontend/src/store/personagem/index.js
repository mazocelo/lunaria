import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { personagemInitialStates } from './states.js';
import { createPersonagemActions } from './actions.js';

export const usePersonagemStore = create(
  combine(personagemInitialStates, createPersonagemActions)
);

export const initializePersonagemStore = async () => {
  const { personagensCarregados, inicializar } = usePersonagemStore.getState();
  if (!personagensCarregados) {
    await inicializar();
  }
};

export default usePersonagemStore;
