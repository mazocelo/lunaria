import { VantagemService } from '../../services/VantagemService';
import { apiClient } from '../../services/ApiClient';

export default class VantagemViewModel {
  constructor() {
    this.service = new VantagemService(apiClient);
    this.state = {
      vantagens: [],
      loading: false,
      error: null,
      searchTerm: '',
      currentPage: 1,
      totalPages: 1,
      itemsPerPage: 10
    };
    this.subscribers = [];
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(callback => callback(this.getState()));
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  getState() {
    return { ...this.state };
  }

  setSearchTerm = (term) => {
    this.setState({ searchTerm: term, currentPage: 1 });
    this.loadVantagens();
  };

  setPage = (page) => {
    this.setState({ currentPage: page });
    this.loadVantagens();
  };

  loadVantagens = async () => {
    this.setState({ loading: true, error: null });
    try {
      const params = {
        page: this.state.currentPage,
        limit: this.state.itemsPerPage,
        search: this.state.searchTerm
      };
      const response = await this.service.getVantagens(params);
      console.log('Resposta bruta da API:', response);
      let vantagens = [];
      if (Array.isArray(response)) {
        vantagens = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        vantagens = response.data;
      } else if (response && response.data && Array.isArray(response.data.data)) {
        vantagens = response.data.data;
      }
      this.setState({
        vantagens,
        totalPages: response?.pagination?.totalPages || 1,
        loading: false
      });
    } catch (error) {
      this.setState({
        vantagens: [],
        totalPages: 1,
        loading: false,
        error: `Erro ao carregar vantagens: ${error.message}`
      });
    }
  };

  deleteVantagem = async (id) => {
    try {
      await this.service.delete(id);
      this.loadVantagens();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Erro ao remover vantagem: ${error.message}`
      };
    }
  };

  clearError = () => {
    this.setState({ error: null });
  };

  init() {
    this.loadVantagens();
  }
} 