import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { feedInitialStates } from './states';
import { createFeedActions } from './actions';

export const useFeedStore = create(
  combine(feedInitialStates, createFeedActions),
);

export const initializeFeedStore = async (): Promise<void> => {
  const { postsCarregados, inicializar } = useFeedStore.getState();
  if (!postsCarregados) {
    await inicializar();
  }
};

export default useFeedStore;
