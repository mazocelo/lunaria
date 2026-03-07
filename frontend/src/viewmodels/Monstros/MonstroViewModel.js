import { monstroService } from '../../services/index.js';

class MonstroViewModel {
  constructor() {
    this.state = {
      monstros: [],
      monstroAtual: null,
      loading: false,
      error: null,
      searchTerm: '',
      filteredMonstros: []
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

  // ===== CARREGAMENTO DE DADOS =====
  loadMonstros = async () => {
    this.setState({ loading: true, error: null });

    try {
      const response = await monstroService.getAll();
      const monstros = response.data || [];

      this.setState({
        monstros,
        filteredMonstros: monstros,
        loading: false
      });
    } catch (error) {
      this.setState({
        error: `Erro ao carregar monstros: ${error.message}`,
        loading: false
      });
    }
  };

  // ===== FILTROS E BUSCA =====
  setSearchTerm = (term) => {
    const filteredMonstros = this.filterMonstros(this.state.monstros, term);
    this.setState({ searchTerm: term, filteredMonstros });
  };

  filterMonstros = (monstros, searchTerm = null) => {
    const term = searchTerm || this.state.searchTerm;
    if (!term) return monstros;

    const termLower = term.toLowerCase();
    return monstros.filter(m =>
      m.nome?.toLowerCase().includes(termLower) ||
      m.descricao?.toLowerCase().includes(termLower) ||
      m.raridade?.toLowerCase().includes(termLower)
    );
  };

  // ===== MÉTODOS UTILITÁRIOS =====
  clearError = () => {
    this.setState({ error: null });
  };

  destroy() {
    this.subscribers = [];
  }
}

export const monstroViewModel = new MonstroViewModel();
export default MonstroViewModel;
