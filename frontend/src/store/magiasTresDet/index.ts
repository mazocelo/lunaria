import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { magiasTresDetInitialStates } from './states';
import { createMagiasTresDetActions } from './actions';

export const useMagiasTresDetStore = create(
  combine(magiasTresDetInitialStates, createMagiasTresDetActions),
);

export default useMagiasTresDetStore;
