import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { monstroInitialStates } from './states.js';
import { createMonstroActions } from './actions.js';

export const useMonstroStore = create(
  combine(monstroInitialStates, createMonstroActions)
);

export const initializeMonstroStore = async () => {
  const { monstrosCarregados, inicializar } = useMonstroStore.getState();
  if (!monstrosCarregados) {
    await inicializar();
  }
};

export default useMonstroStore;
