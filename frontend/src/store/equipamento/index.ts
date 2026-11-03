import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { equipamentoInitialStates } from './states';
import { createEquipamentoActions } from './actions';

export const useEquipamentoStore = create(
  combine(equipamentoInitialStates, createEquipamentoActions),
);

export const initializeEquipamentoStore = async (): Promise<void> => {
  const { equipamentosCarregados, inicializar } = useEquipamentoStore.getState();
  if (!equipamentosCarregados) {
    await inicializar();
  }
};

export default useEquipamentoStore;
