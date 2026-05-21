import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { magiasTresDetInitialStates } from './states.js';
import { createMagiasTresDetActions } from './actions.js';

export const useMagiasTresDetStore = create(
  combine(magiasTresDetInitialStates, createMagiasTresDetActions)
);

export default useMagiasTresDetStore;
