import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { equipamentoInitialStates } from './states.js';
import { createEquipamentoActions } from './actions.js';

export const useEquipamentoStore = create(
  combine(equipamentoInitialStates, createEquipamentoActions)
);

export const initializeEquipamentoStore = async () => {
  const { equipamentosCarregados, inicializar } = useEquipamentoStore.getState();
  if (!equipamentosCarregados) {
    await inicializar();
  }
};

export default useEquipamentoStore;
