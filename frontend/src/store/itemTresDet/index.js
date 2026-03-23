import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { itemTresDetInitialStates } from './states.js';
import { createItemTresDetActions } from './actions.js';

export const useItemTresDetStore = create(
  combine(itemTresDetInitialStates, createItemTresDetActions)
);

export const initializeItemTresDetStore = async () => {
  const { itensCarregados, inicializar } = useItemTresDetStore.getState();
  if (!itensCarregados) {
    await inicializar();
  }
};

export default useItemTresDetStore;
