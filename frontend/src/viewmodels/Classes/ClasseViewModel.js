import { ClasseService } from '../../services/ClasseService';
import { Classe } from '../../models/Classe';
import { ApiClient } from '../../services/ApiClient';

export default class ClasseViewModel {
  constructor() {
    this.apiClient = new ApiClient();
    this.classeService = new ClasseService(this.apiClient);
    
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
    console.log('[ClasseViewModel] Novo state:', this.state); // Depuração
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
      console.log('[ClasseViewModel] Resposta da API:', response); // Depuração
      // O service já retorna os dados processados
      if (Array.isArray(response)) {
        this.setState({
          classes: response,
          totalPages: 1,
          loading: false
        });
      } else if (response && response.data && response.pagination) {
        this.setState({
          classes: response.data,
          totalPages: response.pagination.totalPages || 1,
          loading: false
        });
      } else {
        this.setState({
          classes: [],
          totalPages: 1,
          loading: false
        });
      }
    } catch (error) {
      // Fallback com dados de exemplo
      const classesExemplo = [
        {
          id: 1,
          nome: 'Guerreiro',
          descricao: 'Especialista em combate corpo a corpo, forte e resistente.',
          custo: 0,
          atributos_bonus: { forca: 2, constituicao: 1 },
          vantagens_iniciais: ['Armadura Pesada'],
          desvantagens_iniciais: [],
          habilidades_especiais: ['Ataque Extra', 'Defesa Aprimorada'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          nome: 'Mago',
          descricao: 'Usuário de magia arcana, domina feitiços poderosos.',
          custo: 2,
          atributos_bonus: { inteligencia: 3, carisma: 1 },
          vantagens_iniciais: ['Magia Arcana'],
          desvantagens_iniciais: ['Fragilidade'],
          habilidades_especiais: ['Conjurar Feitiços', 'Resistência Mágica'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 3,
          nome: 'Arqueiro',
          descricao: 'Especialista em ataques à distância e furtividade.',
          custo: 1,
          atributos_bonus: { destreza: 2, agilidade: 1 },
          vantagens_iniciais: ['Tiro Preciso'],
          desvantagens_iniciais: [],
          habilidades_especiais: ['Furtividade', 'Tiro Múltiplo'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 4,
          nome: 'Ladino',
          descricao: 'Ágil, mestre em furtividade e armadilhas.',
          custo: 1,
          atributos_bonus: { destreza: 2, agilidade: 2 },
          vantagens_iniciais: ['Furtividade'],
          desvantagens_iniciais: ['Fragilidade'],
          habilidades_especiais: ['Esquiva', 'Armadilhas'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      this.setState({
        classes: classesExemplo.map(classe => Classe.fromApi(classe)),
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