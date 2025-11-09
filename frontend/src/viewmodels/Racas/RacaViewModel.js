import { getRacaStoreAPI } from '../../store/index.js';

export default class RacaViewModel {
  constructor() {
    // 🧬 API direta para ViewModels - sem hooks!
    this.racaStore = getRacaStoreAPI();
    
    this.state = {
      racas: [],
      racaAtual: null,
      loading: false,
      error: null,
      searchTerm: '',
      filteredRacas: []
    };

    this.subscribers = [];
    
    // 🔄 Subscribir a mudanças no store
    this.unsubscribe = this.racaStore.subscribe((state) => {
      this.handleStoreChange(state);
    });
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

  // ===== HANDLER DE MUDANÇAS DO STORE =====
  handleStoreChange = (storeState) => {
    // 🔄 Atualizar estado local quando store muda
    const filteredRacas = this.filterRacas(storeState.racas, this.state.searchTerm);
    this.setState({
      racas: storeState.racas,
      filteredRacas,
      loading: storeState.loading,
      error: storeState.error
    });
  };

  // ===== MÉTODOS DE BUSCA E FILTROS =====
  setSearchTerm = (term) => {
    this.setState({ searchTerm: term });
    
    // Aplicar filtro com o novo termo
    const filteredRacas = this.filterRacas(this.state.racas, term);
    this.setState({ filteredRacas });
  };

  // ===== CARREGAMENTO DE DADOS =====
  loadRacas = async (id = null) => {
    try {
      // 🧬 CACHE FIRST: Verificar se já existem dados no store
      const storeState = this.racaStore.getState();
      
      if (storeState.racasCarregadas && storeState.racas.length > 0) {
        // Se ID fornecido, buscar raça específica do cache
        if (id) {
          const raca = this.racaStore.getRacaById(parseInt(id));
          this.setState({ racaAtual: raca });
        }
        
        // Forçar atualização do estado local com dados do cache
        this.handleStoreChange(storeState);
        return;
      }
      
      // 📡 FALLBACK: Se não há cache, carregar do backend
      await this.racaStore.carregarRacas();
      
      // Estado será atualizado via handleStoreChange
    } catch (error) {
      this.setState({
        error: `Erro ao carregar raças: ${error.message}`,
        loading: false
      });
    }
  };

  // ===== CARREGAMENTO DE RAÇA INDIVIDUAL =====
  loadRacaById = async (id) => {
    try {
      // 🧬 CACHE FIRST: Verificar se raça já existe no cache
      const storeState = this.racaStore.getState();
      
      if (storeState.racasCarregadas && storeState.racas.length > 0) {
        const raca = this.racaStore.getRacaById(parseInt(id));
        
        this.setState({ 
          racaAtual: raca,
          error: raca ? null : 'Raça não encontrada'
        });
        
        return raca;
      }
      
      // 📡 FALLBACK: Se não há cache, carregar primeiro
      await this.racaStore.carregarRacas();
      
      // Buscar raça específica após carregamento
      const raca = this.racaStore.getRacaById(parseInt(id));
      this.setState({ 
        racaAtual: raca,
        error: raca ? null : 'Raça não encontrada'
      });
      
      return raca;
    } catch (error) {
      this.setState({
        error: `Erro ao carregar raça: ${error.message}`,
        racaAtual: null
      });
      return null;
    }
  };

  // ===== FILTROS E BUSCA =====
  filterRacas = (racas, searchTerm = null) => {
    const term = searchTerm || this.state.searchTerm;
    if (!term) return racas;
    
    const termLower = term.toLowerCase();
    return racas.filter(raca => 
      raca.nome?.toLowerCase().includes(termLower) ||
      raca.descricao?.toLowerCase().includes(termLower)
    );
  };

  // ===== DADOS PARA EXIBIÇÃO =====
  getRacas = () => {
    return this.state.filteredRacas;
  };

  // ===== MÉTODOS DE CRUD =====
  deleteRaca = async (id) => {
    try {
      // 🔥 TODO: Implementar delete no store quando necessário
      // Por enquanto, usar service direto para operações CRUD
      const { racaService } = await import('../../services/index.js');
      await racaService.delete(id);
      
      // 🔄 Recarregar do store
      await this.racaStore.recarregarRacas();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: `Erro ao remover raça: ${error.message}` 
      };
    }
  };

  // ===== MÉTODOS UTILITÁRIOS =====
  getRacaById = (id) => {
    return this.racaStore.getRacaById(id);
  };

  getRacaByNome = (nome) => {
    return this.racaStore.getRacaByNome(nome);
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

  // ===== INICIALIZAÇÃO E LIMPEZA =====
  init() {
    this.loadRacas();
  }

  // 🧹 Cleanup para evitar memory leaks
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.subscribers = [];
  }

  // ===== GETTERS PARA COMPATIBILIDADE =====
  getAllRacas() {
    return this.state.racas;
  }

  getFilteredRacas() {
    return this.state.filteredRacas;
  }
} 