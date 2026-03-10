import { feedService } from '../../services/index.js';

export const createFeedActions = (set, get) => ({

  carregarFeed: async (tab, forceReload = false) => {
    const { postsCarregados, loading, activeTab } = get();
    if ((postsCarregados || loading) && !forceReload && tab === activeTab) {
      return get().posts;
    }

    set({ loading: true, error: null, activeTab: tab });

    try {
      const response = await feedService.fetchFeed(tab, { limit: 20, offset: 0 });
      const postsData = Array.isArray(response.data) ? response.data : [];

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
      set({ loading: false, error: error.message, posts: [], postsCarregados: false });
      throw error;
    }
  },

  carregarMaisPosts: async () => {
    const { loading, hasMore, activeTab, offset } = get();
    if (loading || !hasMore) return;

    set({ loading: true });

    try {
      const response = await feedService.fetchFeed(activeTab, { limit: 20, offset });
      const newPosts = Array.isArray(response.data) ? response.data : [];

      set(state => ({
        posts: [...state.posts, ...newPosts],
        loading: false,
        hasMore: response.pagination?.hasMore || false,
        offset: state.offset + 20,
      }));
    } catch (error) {
      set({ loading: false, error: error.message });
    }
  },

  adicionarPost: (post) => {
    if (post) {
      set(state => ({ posts: [post, ...state.posts] }));
    }
  },

  removerPost: (postId) => {
    set(state => ({ posts: state.posts.filter(p => p.id !== postId) }));
  },

  atualizarPost: (postId, updates) => {
    set(state => ({
      posts: state.posts.map(p => p.id === postId ? { ...p, ...updates } : p)
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
