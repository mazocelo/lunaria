import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { mestreInitialStates } from './states';
import { createMestreActions } from './actions';

export const useMestreStore = create(
  combine(mestreInitialStates, createMestreActions),
);

export const initializeMestreStore = async (): Promise<void> => {
  const { mestresCarregados, inicializar } = useMestreStore.getState();
  if (!mestresCarregados) {
    await inicializar();
  }
};

/* eslint-disable react-hooks/rules-of-hooks */
export const useMestreSelectors = {
  mestres: () => useMestreStore((state) => state.mestres),
  mestresAtivos: () => useMestreStore((state) => state.mestresAtivos),
  loading: () => useMestreStore((state) => state.loading),
  getMestreById: () => useMestreStore((state) => state.getMestreById),
  getMestreByNome: () => useMestreStore((state) => state.getMestreByNome),
};

export default useMestreStore;
