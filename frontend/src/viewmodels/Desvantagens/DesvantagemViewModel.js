import { getDesvantagemStoreAPI } from '../../store/index.js';
import { VantagemDesvantagem } from '../../models/VantagemDesvantagem';

export default class DesvantagemViewModel {
  constructor() {
    // 🔻 API direta para ViewModels - sem hooks!
    this.desvantagemStore = getDesvantagemStoreAPI();
    
    this.state = {
      desvantagens: [],
      desvantagemAtual: null,
      loading: false,
      error: null,
      searchTerm: '',
      currentPage: 1,
      totalPages: 1,
      itemsPerPage: 10,
      filteredDesvantagens: []
    };

    this.subscribers = [];
    
    // 🔄 Subscribir a mudanças no store
    this.unsubscribe = this.desvantagemStore.subscribe((state) => {
      this.handleStoreChange(state);
    });
  }

  // ===== HANDLER DE MUDANÇAS DO STORE =====
  handleStoreChange = (storeState) => {
    // 🔄 Atualizar estado local quando store muda
    const filteredDesvantagens = this.filterDesvantagens(storeState.desvantagens, this.state.searchTerm);
    this.setState({
      desvantagens: storeState.desvantagens,
      filteredDesvantagens,
      loading: storeState.loading,
      error: storeState.error,
      totalPages: Math.ceil(filteredDesvantagens.length / this.state.itemsPerPage)
    });
  };

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

  // ===== MÉTODOS DE BUSCA E FILTROS =====
  setSearchTerm = (term) => {
    this.setState({ searchTerm: term, currentPage: 1 });
    
    // Aplicar filtro com o novo termo
    const filteredDesvantagens = this.filterDesvantagens(this.state.desvantagens, term);
    this.setState({ 
      filteredDesvantagens,
      totalPages: Math.ceil(filteredDesvantagens.length / this.state.itemsPerPage)
    });
  };

  setPage = (page) => {
    this.setState({ currentPage: page });
  };

  // ===== CARREGAMENTO DE DADOS =====
  loadDesvantagens = async (id = null) => {
    try {
      // 🔻 CACHE FIRST: Verificar se já existem dados no store
      const storeState = this.desvantagemStore.getState();
      
      if (storeState.desvantagensCarregadas && storeState.desvantagens.length > 0) {
        console.log('✅ DesvantagemViewModel: Usando dados do cache');
        
        // Se ID fornecido, buscar desvantagem específica do cache
        if (id) {
          const desvantagem = this.desvantagemStore.getDesvantagemById(parseInt(id));
          this.setState({ desvantagemAtual: desvantagem });
        }
        
        // Forçar atualização do estado local com dados do cache
        this.handleStoreChange(storeState);
        return;
      }
      
      // 📡 FALLBACK: Se não há cache, carregar do backend
      console.log('📡 DesvantagemViewModel: Cache vazio, carregando do backend...');
      await this.desvantagemStore.carregarDesvantagens();
      
      // Se ID fornecido, buscar desvantagem específica
      if (id) {
        const desvantagem = this.desvantagemStore.getDesvantagemById(parseInt(id));
        this.setState({ desvantagemAtual: desvantagem });
      }
      
      // Estado será atualizado via handleStoreChange
    } catch (error) {
      this.setState({
        error: `Erro ao carregar desvantagens: ${error.message}`,
        loading: false
      });
    }
  };

  // ===== CARREGAMENTO DE DESVANTAGEM INDIVIDUAL =====
  loadDesvantagemById = async (id) => {
    try {
      // 🔻 CACHE FIRST: Verificar se desvantagem já existe no cache
      const storeState = this.desvantagemStore.getState();
      
      if (storeState.desvantagensCarregadas && storeState.desvantagens.length > 0) {
        console.log('✅ DesvantagemViewModel: Buscando desvantagem no cache');
        const desvantagem = this.desvantagemStore.getDesvantagemById(parseInt(id));
        
        this.setState({ 
          desvantagemAtual: desvantagem,
          error: desvantagem ? null : 'Desvantagem não encontrada'
        });
        
        return desvantagem;
      }
      
      // 📡 FALLBACK: Se não há cache, carregar primeiro
      console.log('📡 DesvantagemViewModel: Cache vazio, carregando desvantagens...');
      await this.desvantagemStore.carregarDesvantagens();
      
      // Buscar desvantagem específica após carregamento
      const desvantagem = this.desvantagemStore.getDesvantagemById(parseInt(id));
      this.setState({ 
        desvantagemAtual: desvantagem,
        error: desvantagem ? null : 'Desvantagem não encontrada'
      });
      
      return desvantagem;
    } catch (error) {
      this.setState({
        error: `Erro ao carregar desvantagem: ${error.message}`,
        desvantagemAtual: null
      });
      return null;
    }
  };

  // ===== FILTROS E BUSCA =====
  filterDesvantagens = (desvantagens, searchTerm = null) => {
    const term = searchTerm || this.state.searchTerm;
    if (!term) return desvantagens;
    
    const termLower = term.toLowerCase();
    return desvantagens.filter(desvantagem => 
      desvantagem.nome?.toLowerCase().includes(termLower) ||
      desvantagem.descricao?.toLowerCase().includes(termLower) ||
      (Array.isArray(desvantagem.tipo) && desvantagem.tipo.some(tipo => 
        tipo.toLowerCase().includes(termLower)
      ))
    );
  };

  // ===== PAGINAÇÃO =====
  getPaginatedDesvantagens = () => {
    const start = (this.state.currentPage - 1) * this.state.itemsPerPage;
    const end = start + this.state.itemsPerPage;
    return this.state.filteredDesvantagens.slice(start, end);
  };

  // ===== MÉTODOS DE CRUD =====
  deleteDesvantagem = async (id) => {
    try {
      // 🔥 TODO: Implementar delete no store quando necessário
      // Por enquanto, usar service direto para operações CRUD
      const { desvantagemService } = await import('../../services/index.js');
      await desvantagemService.delete(id);
      
      // 🔄 Recarregar do store
      await this.desvantagemStore.recarregarDesvantagens();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Erro ao remover desvantagem: ${error.message}`
      };
    }
  };

  // ===== MÉTODOS UTILITÁRIOS =====
  getDesvantagemById = (id) => {
    return this.desvantagemStore.getDesvantagemById(id);
  };

  getDesvantagemByNome = (nome) => {
    return this.desvantagemStore.getDesvantagemByNome(nome);
  };

  // ===== FUNÇÕES ESPECÍFICAS PARA DESVANTAGENS =====
  getDesvantagensPorNivel = (nivel) => {
    return this.desvantagemStore.getDesvantagensPorNivel(nivel);
  };

  getDesvantagensPorTipo = (tipo) => {
    return this.desvantagemStore.getDesvantagensPorTipo(tipo);
  };

  getEstatisticasDesvantagens = () => {
    return this.desvantagemStore.getEstatisticasDesvantagens();
  };

  clearError = () => {
    this.setState({ error: null });
  };

  // ===== INICIALIZAÇÃO E LIMPEZA =====
  init() {
    this.loadDesvantagens();
  }

  // 🧹 Cleanup para evitar memory leaks
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.subscribers = [];
  }

  // ===== GETTERS PARA COMPATIBILIDADE =====
  getDesvantagens() {
    return this.getPaginatedDesvantagens();
  }

  getAllDesvantagens() {
    return this.state.desvantagens;
  }

  getFilteredDesvantagens() {
    return this.state.filteredDesvantagens;
  }

  getDesvantagensAtivas() {
    return this.desvantagemStore.desvantagensAtivas;
  }
} 