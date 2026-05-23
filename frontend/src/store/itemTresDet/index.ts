import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { itemTresDetInitialStates } from './states';
import { createItemTresDetActions } from './actions';

export const useItemTresDetStore = create(
  combine(itemTresDetInitialStates, createItemTresDetActions),
);

export const initializeItemTresDetStore = async (): Promise<void> => {
  const { itensCarregados, inicializar } = useItemTresDetStore.getState();
  if (!itensCarregados) {
    await inicializar();
  }
};

export default useItemTresDetStore;
