import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { personagemInitialStates } from './states';
import { createPersonagemActions } from './actions';

export const usePersonagemStore = create(
  combine(personagemInitialStates, createPersonagemActions),
);

export const initializePersonagemStore = async (): Promise<void> => {
  const { personagensCarregados, inicializar } = usePersonagemStore.getState();
  if (!personagensCarregados) {
    await inicializar();
  }
};

export default usePersonagemStore;
