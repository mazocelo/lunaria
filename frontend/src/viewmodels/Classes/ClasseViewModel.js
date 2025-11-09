import { getClasseStoreAPI } from '../../store/index.js';
import { Classe } from '../../models/Classe';

export default class ClasseViewModel {
  constructor() {
    // 🏛️ API direta para ViewModels - sem hooks!
    this.classeStore = getClasseStoreAPI();
    
    this.state = {
      classes: [],
      classeAtual: null,
      loading: false,
      error: null,
      searchTerm: '',
      filteredClasses: []
    };

    this.subscribers = [];
    
    // 🔄 Subscribir a mudanças no store
    this.unsubscribe = this.classeStore.subscribe((state) => {
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

  // ===== MÉTODOS DE BUSCA E FILTROS =====
  setSearchTerm = (term) => {
    this.setState({ searchTerm: term });
    
    // Aplicar filtro com o novo termo
    const filteredClasses = this.filterClasses(this.state.classes, term);
    this.setState({ filteredClasses });
  };

  // ===== HANDLER DE MUDANÇAS DO STORE =====
  handleStoreChange = (storeState) => {
    // 🔄 Atualizar estado local quando store muda
    const filteredClasses = this.filterClasses(storeState.classes, this.state.searchTerm);
    this.setState({
      classes: storeState.classes,
      filteredClasses,
      loading: storeState.loading,
      error: storeState.error
    });
  };

  // ===== CARREGAMENTO DE DADOS =====
  loadClasses = async (id = null) => {
    try {
      // 🏛️ CACHE FIRST: Verificar se já existem dados no store
      const storeState = this.classeStore.getState();
      
      if (storeState.classesCarregadas && storeState.classes.length > 0) {
        // Se ID fornecido, buscar classe específica do cache
        if (id) {
          const classe = this.classeStore.getClasseById(parseInt(id));
          this.setState({ classeAtual: classe });
        }
        
        // Forçar atualização do estado local com dados do cache
        this.handleStoreChange(storeState);
        return;
      }
      
      // 📡 FALLBACK: Se não há cache, carregar do backend
      await this.classeStore.carregarClasses();
      
      // Se ID fornecido, buscar classe específica
      if (id) {
        const classe = this.classeStore.getClasseById(parseInt(id));
        this.setState({ classeAtual: classe });
      }
      
      // Estado será atualizado via handleStoreChange
    } catch (error) {
      this.setState({
        error: `Erro ao carregar classes: ${error.message}`,
        loading: false
      });
    }
  };

  // ===== CARREGAMENTO DE CLASSE INDIVIDUAL =====
  loadClasseById = async (id) => {
    try {
      // 🏛️ CACHE FIRST: Verificar se classe já existe no cache
      const storeState = this.classeStore.getState();
      
      if (storeState.classesCarregadas && storeState.classes.length > 0) {
        const classe = this.classeStore.getClasseById(parseInt(id));
        
        this.setState({ 
          classeAtual: classe,
          error: classe ? null : 'Classe não encontrada'
        });
        
        return classe;
      }
      
      // 📡 FALLBACK: Se não há cache, carregar primeiro
      await this.classeStore.carregarClasses();
      
      // Buscar classe específica após carregamento
      const classe = this.classeStore.getClasseById(parseInt(id));
      this.setState({ 
        classeAtual: classe,
        error: classe ? null : 'Classe não encontrada'
      });
      
      return classe;
    } catch (error) {
      this.setState({
        error: `Erro ao carregar classe: ${error.message}`,
        classeAtual: null
      });
      return null;
    }
  };

  // ===== FILTROS E BUSCA =====
  filterClasses = (classes, searchTerm = null) => {
    const term = searchTerm || this.state.searchTerm;
    if (!term) return classes;
    
    const termLower = term.toLowerCase();
    return classes.filter(classe => 
      classe.nome?.toLowerCase().includes(termLower) ||
      classe.descricao?.toLowerCase().includes(termLower)
    );
  };

  // ===== DADOS PARA EXIBIÇÃO =====
  getClasses = () => {
    return this.state.filteredClasses;
  };

  // ===== MÉTODOS DE CRUD =====
  deleteClasse = async (id) => {
    try {
      // 🔥 TODO: Implementar delete no store quando necessário
      // Por enquanto, usar service direto para operações CRUD
      const { classeService } = await import('../../services/index.js');
      await classeService.delete(id);
      
      // 🔄 Recarregar do store
      await this.classeStore.recarregarClasses();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: `Erro ao remover classe: ${error.message}` 
      };
    }
  };

  // ===== MÉTODOS UTILITÁRIOS =====
  getClasseById = (id) => {
    return this.classeStore.getClasseById(id);
  };

  getClasseByNome = (nome) => {
    return this.classeStore.getClasseByNome(nome);
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

  // ===== INICIALIZAÇÃO E LIMPEZA =====
  init() {
    this.loadClasses();
  }

  // 🧹 Cleanup para evitar memory leaks
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.subscribers = [];
  }

  // ===== GETTERS PARA COMPATIBILIDADE =====
  getAllClasses() {
    return this.state.classes;
  }

  getFilteredClasses() {
    return this.state.filteredClasses;
  }
} 