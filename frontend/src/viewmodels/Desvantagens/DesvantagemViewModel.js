import { DesvantagemService } from '../../services/DesvantagemService';
import { apiClient } from '../../services/ApiClient';

export default class DesvantagemViewModel {
  constructor() {
    this.service = new DesvantagemService(apiClient);
    this.state = {
      desvantagens: [],
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
    this.loadDesvantagens();
  };

  setPage = (page) => {
    this.setState({ currentPage: page });
    this.loadDesvantagens();
  };

  loadDesvantagens = async () => {
    this.setState({ loading: true, error: null });
    try {
      const params = {
        page: this.state.currentPage,
        limit: this.state.itemsPerPage,
        search: this.state.searchTerm
      };
      const response = await this.service.getDesvantagens(params);
      let desvantagens = [];
      if (Array.isArray(response)) {
        desvantagens = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        desvantagens = response.data;
      } else if (response && response.data && Array.isArray(response.data.data)) {
        desvantagens = response.data.data;
      }
      this.setState({
        desvantagens,
        totalPages: response?.pagination?.totalPages || 1,
        loading: false
      });
    } catch (error) {
      this.setState({
        desvantagens: [],
        totalPages: 1,
        loading: false,
        error: `Erro ao carregar desvantagens: ${error.message}`
      });
    }
  };

  deleteDesvantagem = async (id) => {
    try {
      await this.service.delete(id);
      this.loadDesvantagens();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Erro ao remover desvantagem: ${error.message}`
      };
    }
  };

  loadDesvantagem = async (id) => {
    this.setState({ loadingVantagemDesvantagem: true, error: null });
    try {
      const response = await this.service.getById(id);
      this.setState({
        ...response,
        loadingVantagemDesvantagem: false
      });
    } catch (error) {
      this.setState({
        loadingVantagemDesvantagem: false,
        error: `Erro ao carregar desvantagem: ${error.message}`
      });
    }
  };

  clearError = () => {
    this.setState({ error: null });
  };

  init() {
    this.loadDesvantagens();
  }
} 