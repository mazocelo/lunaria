import { RacaService } from '../../services/RacaService';
import { Raca } from '../../models/Raca';
import { apiClient } from '../../services/ApiClient';

export default class RacaViewModel {
  constructor() {
    this.racaService = new RacaService(apiClient);
    
    this.state = {
      racas: [],
      loading: false,
      error: null,
      searchTerm: '',
      currentPage: 1,
      totalPages: 1,
      itemsPerPage: 10
    };

    this.subscribers = [];
  }

  // Métodos de estado
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notify() {
    const state = this.getState();
    this.subscribers.forEach(callback => callback(state));
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  getState() {
    return { ...this.state };
  }

  // Métodos de busca e filtros
  setSearchTerm = (term) => {
    this.setState({ searchTerm: term, currentPage: 1 });
    this.loadRacas();
  };

  setPage = (page) => {
    this.setState({ currentPage: page });
    this.loadRacas();
  };

  // Carregamento de dados
  loadRacas = async () => {
    this.setState({ loading: true, error: null });
    
    try {
      const params = {
        page: this.state.currentPage,
        limit: this.state.itemsPerPage,
        search: this.state.searchTerm
      };

      const response = await this.racaService.getAll(params);
      let racas = [];
      if (Array.isArray(response)) {
        racas = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        racas = response.data;
      } else if (response && response.data && Array.isArray(response.data.data)) {
        racas = response.data.data;
      }
      this.setState({
        racas,
        totalPages: response?.pagination?.totalPages || 1,
        loading: false
      });
    } catch (error) {
      this.setState({
        racas: [],
        totalPages: 1,
        loading: false,
        error: `Erro ao carregar raças: ${error.message}`
      });
    }
  };

  // Métodos de CRUD
  deleteRaca = async (id) => {
    try {
      await this.racaService.delete(id);
      this.loadRacas(); // Recarrega a lista
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: `Erro ao remover raça: ${error.message}` 
      };
    }
  };

  // Métodos de navegação
  goToCreate = () => {
    // Será implementado pelo roteador
    return '/criar-raca';
  };

  goToEdit = (id) => {
    return `/editar-raca/${id}`;
  };

  goToView = (id) => {
    return `/ver-raca/${id}`;
  };

  // Métodos de utilidade
  clearError = () => {
    this.setState({ error: null });
  };

  // Inicialização
  init() {
    this.loadRacas();
  }
} 