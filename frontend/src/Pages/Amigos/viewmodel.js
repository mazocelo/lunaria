import { amizadeService } from '../../services';

export class AmigosViewModel {
  constructor() {
    this.state = {
      friends: [],
      pending: [],
      suggestions: [],
      searchResults: [],
      searchQuery: '',
      activeTab: 'amigos', // amigos | pendentes | buscar
      loading: false,
      loadingAction: null, // ID do item sendo processado
      error: null,
      successMessage: null,
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

  setActiveTab = (tab) => {
    this.setState({ activeTab: tab, error: null, successMessage: null });
    if (tab === 'amigos') this.loadFriends();
    if (tab === 'pendentes') this.loadPending();
    if (tab === 'buscar') this.loadSuggestions();
  };

  setSearchQuery = (query) => {
    this.setState({ searchQuery: query });
  };

  clearMessages = () => this.setState({ error: null, successMessage: null });

  loadFriends = async () => {
    this.setState({ loading: true, error: null });
    try {
      const response = await amizadeService.fetchFriends();
      this.setState({ friends: response.data || [], loading: false });
    } catch (error) {
      this.setState({ loading: false, error: 'Erro ao carregar amigos' });
    }
  };

  loadPending = async () => {
    this.setState({ loading: true, error: null });
    try {
      const response = await amizadeService.fetchPending();
      this.setState({ pending: response.data || [], loading: false });
    } catch (error) {
      this.setState({ loading: false, error: 'Erro ao carregar solicitacoes' });
    }
  };

  loadSuggestions = async () => {
    this.setState({ loading: true, error: null });
    try {
      const response = await amizadeService.fetchSuggestions();
      this.setState({ suggestions: response.data || [], loading: false });
    } catch (error) {
      this.setState({ loading: false, error: 'Erro ao carregar sugestoes' });
    }
  };

  search = async (query) => {
    if (!query || query.length < 2) {
      this.setState({ searchResults: [] });
      return;
    }
    this.setState({ loading: true, error: null });
    try {
      const response = await amizadeService.searchUsers(query);
      this.setState({ searchResults: response.data || [], loading: false });
    } catch (error) {
      this.setState({ loading: false, error: 'Erro na busca' });
    }
  };

  sendRequest = async (receiverId) => {
    this.setState({ loadingAction: receiverId, error: null });
    try {
      await amizadeService.sendRequest(receiverId);
      this.setState({
        loadingAction: null,
        successMessage: 'Solicitacao enviada!'
      });
      // Atualizar resultados da busca
      if (this.state.searchQuery) {
        await this.search(this.state.searchQuery);
      }
      await this.loadSuggestions();
    } catch (error) {
      this.setState({
        loadingAction: null,
        error: error.message || 'Erro ao enviar solicitacao'
      });
    }
  };

  acceptRequest = async (amizadeId) => {
    this.setState({ loadingAction: amizadeId, error: null });
    try {
      await amizadeService.acceptRequest(amizadeId);
      this.setState({
        loadingAction: null,
        successMessage: 'Amizade aceita!',
        pending: this.state.pending.filter(p => p.id !== amizadeId)
      });
    } catch (error) {
      this.setState({
        loadingAction: null,
        error: error.message || 'Erro ao aceitar'
      });
    }
  };

  rejectRequest = async (amizadeId) => {
    this.setState({ loadingAction: amizadeId, error: null });
    try {
      await amizadeService.rejectRequest(amizadeId);
      this.setState({
        loadingAction: null,
        pending: this.state.pending.filter(p => p.id !== amizadeId)
      });
    } catch (error) {
      this.setState({
        loadingAction: null,
        error: error.message || 'Erro ao rejeitar'
      });
    }
  };

  removeFriend = async (amizadeId) => {
    this.setState({ loadingAction: amizadeId, error: null });
    try {
      await amizadeService.removeFriend(amizadeId);
      this.setState({
        loadingAction: null,
        friends: this.state.friends.filter(f => f.amizadeId !== amizadeId)
      });
    } catch (error) {
      this.setState({
        loadingAction: null,
        error: error.message || 'Erro ao remover amigo'
      });
    }
  };

  initialize = async () => {
    await this.loadFriends();
    // Pre-carregar pendentes para badge
    try {
      const response = await amizadeService.fetchPending();
      this.setState({ pending: response.data || [] });
    } catch { /* silencioso */ }
  };
}

export const amigosViewModel = new AmigosViewModel();
