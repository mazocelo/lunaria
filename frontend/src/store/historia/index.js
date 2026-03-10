import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { historiaInitialStates } from './states.js';
import { createHistoriaActions } from './actions.js';

export const useHistoriaStore = create(
  combine(historiaInitialStates, createHistoriaActions)
);

export const initializeHistoriaStore = async () => {
  const { historiasCarregadas, inicializar } = useHistoriaStore.getState();
  if (!historiasCarregadas) {
    await inicializar();
  }
};

export default useHistoriaStore;
