import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { monstroInitialStates } from './states';
import { createMonstroActions } from './actions';

export const useMonstroStore = create(
  combine(monstroInitialStates, createMonstroActions),
);

export const initializeMonstroStore = async (): Promise<void> => {
  const { monstrosCarregados, inicializar } = useMonstroStore.getState();
  if (!monstrosCarregados) {
    await inicializar();
  }
};

export default useMonstroStore;
