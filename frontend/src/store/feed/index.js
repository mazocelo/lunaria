import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { feedInitialStates } from './states.js';
import { createFeedActions } from './actions.js';

export const useFeedStore = create(
  combine(feedInitialStates, createFeedActions)
);

export const initializeFeedStore = async () => {
  const { postsCarregados, inicializar } = useFeedStore.getState();
  if (!postsCarregados) {
    await inicializar();
  }
};

export default useFeedStore;
