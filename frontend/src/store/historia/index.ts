import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { historiaInitialStates } from './states';
import { createHistoriaActions } from './actions';

export const useHistoriaStore = create(
  combine(historiaInitialStates, createHistoriaActions),
);

export const initializeHistoriaStore = async (): Promise<void> => {
  const { historiasCarregadas, inicializar } = useHistoriaStore.getState();
  if (!historiasCarregadas) {
    await inicializar();
  }
};

export default useHistoriaStore;
