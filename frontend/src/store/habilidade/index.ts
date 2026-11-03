import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { habilidadeInitialStates } from './states';
import { createHabilidadeActions } from './actions';

export const useHabilidadeStore = create(
  combine(habilidadeInitialStates, createHabilidadeActions),
);

export default useHabilidadeStore;
