import { feedService } from '../../services/index';
import type { FeedPost, FeedState, FeedTab } from './states';

type FeedResponse = {
  data?: unknown;
  pagination?: { hasMore?: boolean } | null;
};

export type FeedActions = {
  carregarFeed: (tab: FeedTab, forceReload?: boolean) => Promise<FeedPost[]>;
  carregarMaisPosts: () => Promise<void>;
  adicionarPost: (post: FeedPost | null | undefined) => void;
  removerPost: (postId: number | string) => void;
  atualizarPost: (postId: number | string, updates: Partial<FeedPost>) => void;
  recarregarFeed: () => Promise<void>;
  resetFeedState: () => void;
  inicializar: () => Promise<void>;
};

type SetState = {
  (partial: Partial<FeedState>): void;
  (updater: (state: FeedState) => Partial<FeedState>): void;
};
type GetState = () => FeedState;

export const createFeedActions = (set: SetState, getBase: GetState): FeedActions => {
  const get = getBase as () => FeedState & FeedActions;
  return ({

    carregarFeed: async (tab, forceReload = false) => {
      const { postsCarregados, loading, activeTab } = get();
      if ((postsCarregados || loading) && !forceReload && tab === activeTab) {
        return get().posts;
      }

      set({ loading: true, error: null, activeTab: tab });

      try {
        const response = (await feedService.fetchFeed(tab, { limit: 20, offset: 0 })) as FeedResponse;
        const postsData = (Array.isArray(response.data) ? response.data : []) as FeedPost[];

        set({
          posts: postsData,
          postsCarregados: true,
          loading: false,
          error: null,
          lastLoadTime: Date.now(),
          hasMore: response.pagination?.hasMore || false,
          offset: 20,
          activeTab: tab,
        });
        return postsData;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        set({ loading: false, error: message, posts: [], postsCarregados: false });
        throw error;
      }
    },

    carregarMaisPosts: async () => {
      const { loading, hasMore, activeTab, offset } = get();
      if (loading || !hasMore) return;

      set({ loading: true });

      try {
        const response = (await feedService.fetchFeed(activeTab, { limit: 20, offset })) as FeedResponse;
        const newPosts = (Array.isArray(response.data) ? response.data : []) as FeedPost[];

        set((state) => ({
          posts: [...state.posts, ...newPosts],
          loading: false,
          hasMore: response.pagination?.hasMore || false,
          offset: state.offset + 20,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        set({ loading: false, error: message });
      }
    },

    adicionarPost: (post) => {
      if (post) {
        set((state) => ({ posts: [post, ...state.posts] }));
      }
    },

    removerPost: (postId) => {
      set((state) => ({ posts: state.posts.filter((p) => p.id !== postId) }));
    },

    atualizarPost: (postId, updates) => {
      set((state) => ({
        posts: state.posts.map((p) => (p.id === postId ? { ...p, ...updates } : p)),
      }));
    },

    recarregarFeed: async () => {
      const { activeTab } = get();
      await get().carregarFeed(activeTab, true);
    },

    resetFeedState: () => {
      set({
        posts: [],
        postsCarregados: false,
        loading: false,
        error: null,
        lastLoadTime: null,
        hasMore: false,
        offset: 0,
        activeTab: 'amigos',
      });
    },

    inicializar: async () => {
      const { postsCarregados } = get();
      if (!postsCarregados) {
        await get().carregarFeed('amigos');
      }
    },
  });
};
