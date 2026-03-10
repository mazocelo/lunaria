import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { amizadeInitialStates } from './states.js';
import { createAmizadeActions } from './actions.js';

export const useAmizadeStore = create(
  combine(amizadeInitialStates, createAmizadeActions)
);

export const initializeAmizadeStore = async () => {
  const { amigosCarregados, inicializar } = useAmizadeStore.getState();
  if (!amigosCarregados) {
    await inicializar();
  }
};

export default useAmizadeStore;
