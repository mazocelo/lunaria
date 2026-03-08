import { monstroService } from '../../services/index.js';

class MonstroViewModel {
  constructor() {
    this.state = {
      monstros: [],
      monstroAtual: null,
      loading: false,
      error: null,
      searchTerm: '',
      filteredMonstros: [],
      currentPage: 1,
      pageSize: 25,
      totalCount: 0,
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
  loadMonstros = async (page, size) => {
    const currentPage = page ?? this.state.currentPage;
    const pageSize = size ?? this.state.pageSize;
    const offset = (currentPage - 1) * pageSize;

    this.setState({ loading: true, error: null });

    try {
      const response = await monstroService.getAll({ limit: pageSize, offset });
      const monstros = response.data || [];
      const totalCount = response.pagination?.total ?? monstros.length;

      this.setState({
        monstros,
        filteredMonstros: monstros,
        totalCount,
        currentPage,
        pageSize,
        loading: false
      });
    } catch (error) {
      this.setState({
        error: `Erro ao carregar monstros: ${error.message}`,
        loading: false
      });
    }
  };

  handlePageChange = (newPage) => {
    this.loadMonstros(newPage);
  };

  handlePageSizeChange = (newSize) => {
    this.loadMonstros(1, newSize);
  };

  // ===== FILTROS E BUSCA =====
  setSearchTerm = (term) => {
    const filteredMonstros = this.filterMonstros(this.state.monstros, term);
    this.setState({ searchTerm: term, filteredMonstros });
  };

  buscarMonstros = (term) => this.setSearchTerm(term);

  filterMonstros = (monstros, searchTerm = null) => {
    const term = searchTerm || this.state.searchTerm;
    if (!term) return monstros;

    const termLower = term.toLowerCase();
    return monstros.filter(m =>
      m.nome?.toLowerCase().includes(termLower) ||
      m.descricao?.toLowerCase().includes(termLower) ||
      m.raridade_rel?.nome?.toLowerCase().includes(termLower) ||
      m.categoria_rel?.nome?.toLowerCase().includes(termLower)
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
