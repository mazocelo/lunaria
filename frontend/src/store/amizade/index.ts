import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { amizadeInitialStates } from './states';
import { createAmizadeActions } from './actions';

export const useAmizadeStore = create(
  combine(amizadeInitialStates, createAmizadeActions),
);

export const initializeAmizadeStore = async (): Promise<void> => {
  const { amigosCarregados, inicializar } = useAmizadeStore.getState();
  if (!amigosCarregados) {
    await inicializar();
  }
};

export default useAmizadeStore;
