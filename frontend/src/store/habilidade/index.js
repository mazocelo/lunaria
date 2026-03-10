import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { habilidadeInitialStates } from './states.js';
import { createHabilidadeActions } from './actions.js';

export const useHabilidadeStore = create(
  combine(habilidadeInitialStates, createHabilidadeActions)
);

export default useHabilidadeStore;
