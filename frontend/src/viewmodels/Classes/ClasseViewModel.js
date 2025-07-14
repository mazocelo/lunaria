import { ClasseService } from '../../services/ClasseService';
import { Classe } from '../../models/Classe';
import { apiClient } from '../../services/ApiClient';

export default class ClasseViewModel {
  constructor() {
    this.classeService = new ClasseService(apiClient);
    
    this.state = {
      classes: [],
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
    this.loadClasses();
  };

  setPage = (page) => {
    this.setState({ currentPage: page });
    this.loadClasses();
  };

  // Carregamento de dados
  loadClasses = async () => {
    this.setState({ loading: true, error: null });
    
    try {
      const params = {
        page: this.state.currentPage,
        limit: this.state.itemsPerPage,
        search: this.state.searchTerm
      };

      const response = await this.classeService.getAll(params);
      let classes = [];
      if (Array.isArray(response)) {
        classes = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        classes = response.data;
      } else if (response && response.data && Array.isArray(response.data.data)) {
        classes = response.data.data;
      }
      this.setState({
        classes,
        totalPages: response?.pagination?.totalPages || 1,
        loading: false
      });
    } catch (error) {
      this.setState({
        classes: [],
        totalPages: 1,
        loading: false,
        error: `Erro ao carregar classes: ${error.message}`
      });
    }
  };

  // Métodos de CRUD
  deleteClasse = async (id) => {
    try {
      await this.classeService.delete(id);
      this.loadClasses(); // Recarrega a lista
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: `Erro ao remover classe: ${error.message}` 
      };
    }
  };

  // Métodos de navegação
  goToCreate = () => {
    // Será implementado pelo roteador
    return '/criar-classe';
  };

  goToEdit = (id) => {
    return `/editar-classe/${id}`;
  };

  goToView = (id) => {
    return `/ver-classe/${id}`;
  };

  // Métodos de utilidade
  clearError = () => {
    this.setState({ error: null });
  };

  // Inicialização
  init() {
    this.loadClasses();
  }
} 