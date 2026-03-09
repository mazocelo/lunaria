import { feedService } from '../../services';

export class FeedViewModel {
  constructor() {
    this.state = {
      posts: [],
      activeTab: 'amigos', // amigos | comunidade
      loading: false,
      loadingMore: false,
      hasMore: false,
      offset: 0,
      // Criacao de post
      newPostText: '',
      newPostVisibility: 'amigos',
      creatingPost: false,
      // Geral
      error: null,
    };
    this.subscribers = [];
  }

  getState() {
    return { ...this.state };
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(cb => cb(this.getState()));
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  setNewPostText = (text) => this.setState({ newPostText: text });
  setNewPostVisibility = (vis) => this.setState({ newPostVisibility: vis });

  setActiveTab = (tab) => {
    this.setState({ activeTab: tab, posts: [], offset: 0, hasMore: false, error: null });
    this.loadFeed(tab);
  };

  loadFeed = async (tab) => {
    const activeTab = tab || this.state.activeTab;
    this.setState({ loading: true, error: null });
    try {
      const response = await feedService.fetchFeed(activeTab, { limit: 20, offset: 0 });
      this.setState({
        posts: response.data || [],
        hasMore: response.pagination?.hasMore || false,
        offset: 20,
        loading: false
      });
    } catch (error) {
      this.setState({ loading: false, error: 'Erro ao carregar feed' });
    }
  };

  loadMore = async () => {
    if (this.state.loadingMore || !this.state.hasMore) return;
    this.setState({ loadingMore: true });
    try {
      const response = await feedService.fetchFeed(this.state.activeTab, {
        limit: 20,
        offset: this.state.offset
      });
      const newPosts = response.data || [];
      this.setState({
        posts: [...this.state.posts, ...newPosts],
        hasMore: response.pagination?.hasMore || false,
        offset: this.state.offset + 20,
        loadingMore: false
      });
    } catch (error) {
      this.setState({ loadingMore: false, error: 'Erro ao carregar mais posts' });
    }
  };

  createPost = async () => {
    const text = this.state.newPostText.trim();
    if (!text) return;
    this.setState({ creatingPost: true, error: null });
    try {
      const response = await feedService.createPost({
        texto: text,
        visibilidade: this.state.newPostVisibility
      });
      const newPost = response.data;
      this.setState({
        creatingPost: false,
        newPostText: '',
        posts: newPost ? [newPost, ...this.state.posts] : this.state.posts
      });
    } catch (error) {
      this.setState({
        creatingPost: false,
        error: error.message || 'Erro ao criar post'
      });
    }
  };

  toggleLike = async (postId) => {
    try {
      const response = await feedService.toggleLike(postId);
      const curtido = response.data?.curtido;
      this.setState({
        posts: this.state.posts.map(p => {
          if (p.id !== postId) return p;
          return {
            ...p,
            curtidoPorMim: curtido,
            curtidas: curtido ? p.curtidas + 1 : p.curtidas - 1
          };
        })
      });
    } catch (error) {
      // silencioso
    }
  };

  deletePost = async (postId) => {
    try {
      await feedService.deletePost(postId);
      this.setState({
        posts: this.state.posts.filter(p => p.id !== postId)
      });
    } catch (error) {
      this.setState({ error: 'Erro ao deletar post' });
    }
  };

  initialize = () => {
    this.loadFeed();
  };
}

export const feedViewModel = new FeedViewModel();
