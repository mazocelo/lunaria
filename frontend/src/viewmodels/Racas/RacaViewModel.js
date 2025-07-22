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
      currentPage: 1,
      totalPages: 1,
      itemsPerPage: 10,
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
      error: storeState.error,
      totalPages: Math.ceil(filteredRacas.length / this.state.itemsPerPage)
    });
  };

  // ===== MÉTODOS DE BUSCA E FILTROS =====
  setSearchTerm = (term) => {
    this.setState({ searchTerm: term, currentPage: 1 });
    
    // Aplicar filtro com o novo termo
    const filteredRacas = this.filterRacas(this.state.racas, term);
    this.setState({ 
      filteredRacas,
      totalPages: Math.ceil(filteredRacas.length / this.state.itemsPerPage)
    });
  };

  setPage = (page) => {
    this.setState({ currentPage: page });
  };

  // ===== CARREGAMENTO DE DADOS =====
  loadRacas = async (id = null) => {
    try {
      // 🧬 CACHE FIRST: Verificar se já existem dados no store
      const storeState = this.racaStore.getState();
      
      if (storeState.racasCarregadas && storeState.racas.length > 0) {
        console.log('✅ RacaViewModel: Usando dados do cache');
        
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
      console.log('📡 RacaViewModel: Cache vazio, carregando do backend...');
      await this.racaStore.carregarRacas();
      
      // Se ID fornecido, buscar raça específica
      if (id) {
        const raca = this.racaStore.getRacaById(parseInt(id));
        this.setState({ racaAtual: raca });
      }
      
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
        console.log('✅ RacaViewModel: Buscando raça no cache');
        const raca = this.racaStore.getRacaById(parseInt(id));
        
        this.setState({ 
          racaAtual: raca,
          error: raca ? null : 'Raça não encontrada'
        });
        
        return raca;
      }
      
      // 📡 FALLBACK: Se não há cache, carregar primeiro
      console.log('📡 RacaViewModel: Cache vazio, carregando raças...');
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

  // ===== PAGINAÇÃO =====
  getPaginatedRacas = () => {
    const start = (this.state.currentPage - 1) * this.state.itemsPerPage;
    const end = start + this.state.itemsPerPage;
    return this.state.filteredRacas.slice(start, end);
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
  getRacas() {
    return this.getPaginatedRacas();
  }

  getAllRacas() {
    return this.state.racas;
  }

  getFilteredRacas() {
    return this.state.filteredRacas;
  }
} 