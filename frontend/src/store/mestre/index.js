import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { mestreInitialStates } from './states.js';
import { createMestreActions } from './actions.js';

export const useMestreStore = create(
  combine(mestreInitialStates, createMestreActions)
);

export const initializeMestreStore = async () => {
  const { mestresCarregados, inicializar } = useMestreStore.getState();
  if (!mestresCarregados) {
    await inicializar();
  }
};

export const useMestreSelectors = {
  mestres: () => useMestreStore(state => state.mestres),
  mestresAtivos: () => useMestreStore(state => state.mestresAtivos),
  loading: () => useMestreStore(state => state.loading),
  getMestreById: () => useMestreStore(state => state.getMestreById),
  getMestreByNome: () => useMestreStore(state => state.getMestreByNome),
};

export default useMestreStore;
