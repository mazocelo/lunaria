import { getVantagemStoreAPI } from '../../store/index.js';
import { VantagemDesvantagem } from '../../models/VantagemDesvantagem';

export default class VantagemViewModel {
  constructor() {
    // 🌟 API direta para ViewModels - sem hooks!
    this.vantagemStore = getVantagemStoreAPI();
    
    this.state = {
      vantagens: [],
      vantagemAtual: null,
      loading: false,
      error: null,
      searchTerm: '',
      filteredVantagens: []
    };

    this.subscribers = [];
    
    // 🔄 Subscribir a mudanças no store
    this.unsubscribe = this.vantagemStore.subscribe((state) => {
      this.handleStoreChange(state);
    });
  }

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
    const filteredVantagens = this.filterVantagens(storeState.vantagens, this.state.searchTerm);
    this.setState({
      vantagens: storeState.vantagens,
      filteredVantagens,
      loading: storeState.loading,
      error: storeState.error
    });
  };

  // ===== MÉTODOS DE BUSCA E FILTROS =====
  setSearchTerm = (term) => {
    this.setState({ searchTerm: term });
    
    // Aplicar filtro com o novo termo
    const filteredVantagens = this.filterVantagens(this.state.vantagens, term);
    this.setState({ filteredVantagens });
  };

  // ===== CARREGAMENTO DE DADOS =====
  loadVantagens = async (id = null) => {
    try {
      // 🌟 CACHE FIRST: Verificar se já existem dados no store
      const storeState = this.vantagemStore.getState();
      
      if (storeState.vantagensCarregadas && storeState.vantagens.length > 0) {
        // Se ID fornecido, buscar vantagem específica do cache
        if (id) {
          const vantagem = this.vantagemStore.getVantagemById(parseInt(id));
          this.setState({ vantagemAtual: vantagem });
        }
        
        // Forçar atualização do estado local com dados do cache
        this.handleStoreChange(storeState);
        return;
      }
      
      // 📡 FALLBACK: Se não há cache, carregar do backend
      await this.vantagemStore.carregarVantagens();
      
      // Se ID fornecido, buscar vantagem específica
      if (id) {
        const vantagem = this.vantagemStore.getVantagemById(parseInt(id));
        this.setState({ vantagemAtual: vantagem });
      }
      
      // Estado será atualizado via handleStoreChange
    } catch (error) {
      this.setState({
        error: `Erro ao carregar vantagens: ${error.message}`,
        loading: false
      });
    }
  };

  // ===== FILTROS E BUSCA =====
  filterVantagens = (vantagens, searchTerm = null) => {
    const term = searchTerm || this.state.searchTerm;
    if (!term) return vantagens;
    
    const termLower = term.toLowerCase();
    return vantagens.filter(vantagem => 
      vantagem.nome?.toLowerCase().includes(termLower) ||
      vantagem.descricao?.toLowerCase().includes(termLower)
    );
  };

  // ===== DADOS PARA EXIBIÇÃO =====
  getVantagens = () => {
    return this.state.filteredVantagens;
  };

  // ===== CARREGAMENTO DE VANTAGEM INDIVIDUAL =====
  loadVantagemById = async (id) => {
    try {
      // 🌟 CACHE FIRST: Verificar se vantagem já existe no cache
      const storeState = this.vantagemStore.getState();
      
      if (storeState.vantagensCarregadas && storeState.vantagens.length > 0) {
        const vantagem = this.vantagemStore.getVantagemById(parseInt(id));
        
        this.setState({ 
          vantagemAtual: vantagem,
          error: vantagem ? null : 'Vantagem não encontrada'
        });
        
        return vantagem;
      }
      
      // 📡 FALLBACK: Se não há cache, carregar primeiro
      await this.vantagemStore.carregarVantagens();
      
      // Buscar vantagem específica após carregamento
      const vantagem = this.vantagemStore.getVantagemById(parseInt(id));
      this.setState({ 
        vantagemAtual: vantagem,
        error: vantagem ? null : 'Vantagem não encontrada'
      });
      
      return vantagem;
    } catch (error) {
      this.setState({
        error: `Erro ao carregar vantagem: ${error.message}`,
        vantagemAtual: null
      });
      return null;
    }
  };

  // ===== MÉTODOS DE CRUD =====
  deleteVantagem = async (id) => {
    try {
      // 🔥 TODO: Implementar delete no store quando necessário
      // Por enquanto, usar service direto para operações CRUD
      const { vantagemService } = await import('../../services/index.js');
      await vantagemService.delete(id);
      
      // 🔄 Recarregar do store
      await this.vantagemStore.recarregarVantagens();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Erro ao remover vantagem: ${error.message}`
      };
    }
  };

  // ===== MÉTODOS UTILITÁRIOS =====
  getVantagemById = (id) => {
    return this.vantagemStore.getVantagemById(id);
  };

  getVantagemByNome = (nome) => {
    return this.vantagemStore.getVantagemByNome(nome);
  };

  // ===== SEPARAÇÃO POR TIPO =====
  getVantagensPositivas = () => {
    return this.vantagemStore.vantagensPositivas;
  };

  getDesvantagensNegativas = () => {
    return this.vantagemStore.vantagensNegativas;
  };

  clearError = () => {
    this.setState({ error: null });
  };

  // ===== INICIALIZAÇÃO E LIMPEZA =====
  init() {
    this.loadVantagens();
  }

  // 🧹 Cleanup para evitar memory leaks
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.subscribers = [];
  }

  // ===== GETTERS PARA COMPATIBILIDADE =====

  getAllVantagens() {
    return this.state.vantagens;
  }

  getFilteredVantagens() {
    return this.state.filteredVantagens;
  }
} 