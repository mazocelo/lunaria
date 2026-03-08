import { equipamentoService } from '../../services/index.js';

class EquipamentoViewModel {
  constructor() {
    this.service = equipamentoService;

    this.state = {
      equipamentos: [],
      loading: false,
      error: null,
      searchTerm: '',
      filteredEquipamentos: [],
      categoriaFilter: '',
      raridadeFilter: '',
      currentPage: 1,
      pageSize: 25,
      totalCount: 0,
    };

    this.subscribers = [];
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

  // ===== CARREGAMENTO DE DADOS =====
  loadEquipamentos = async (page, size) => {
    const currentPage = page ?? this.state.currentPage;
    const pageSize = size ?? this.state.pageSize;
    const offset = (currentPage - 1) * pageSize;

    this.setState({ loading: true, error: null });
    try {
      const response = await this.service.getAll({ limit: pageSize, offset });
      const equipamentos = response.data || [];
      const totalCount = response.pagination?.total ?? equipamentos.length;

      this.setState({
        equipamentos,
        totalCount,
        currentPage,
        pageSize,
        loading: false
      });
      this.applyFilters();
    } catch (error) {
      this.setState({
        error: `Erro ao carregar equipamentos: ${error.message}`,
        loading: false
      });
    }
  };

  handlePageChange = (newPage) => {
    this.loadEquipamentos(newPage);
  };

  handlePageSizeChange = (newSize) => {
    this.loadEquipamentos(1, newSize);
  };

  // ===== FILTROS =====
  setSearchTerm = (term) => {
    this.setState({ searchTerm: term });
    this.applyFilters();
  };

  setCategoriaFilter = (categoria) => {
    this.setState({ categoriaFilter: categoria });
    this.applyFilters();
  };

  setRaridadeFilter = (raridade) => {
    this.setState({ raridadeFilter: raridade });
    this.applyFilters();
  };

  applyFilters = () => {
    let filtered = [...this.state.equipamentos];
    const { searchTerm, categoriaFilter, raridadeFilter } = this.state;

    if (searchTerm) {
      const termLower = searchTerm.toLowerCase();
      filtered = filtered.filter(eq =>
        eq.nome?.toLowerCase().includes(termLower) ||
        eq.descricao?.toLowerCase().includes(termLower)
      );
    }

    if (categoriaFilter) {
      filtered = filtered.filter(eq => eq.categoria_rel?.nome === categoriaFilter);
    }

    if (raridadeFilter) {
      filtered = filtered.filter(eq => eq.raridade_rel?.nome === raridadeFilter);
    }

    this.setState({ filteredEquipamentos: filtered });
  };

  // ===== CRUD =====
  deleteEquipamento = async (id) => {
    try {
      await this.service.delete(id);
      await this.loadEquipamentos();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Erro ao remover equipamento: ${error.message}`
      };
    }
  };

  clearError = () => {
    this.setState({ error: null });
  };

  // ===== GETTERS =====
  get equipamentos() { return this.state.equipamentos; }
  get filteredEquipamentos() { return this.state.filteredEquipamentos; }
  get loading() { return this.state.loading; }
  get error() { return this.state.error; }
  get searchTerm() { return this.state.searchTerm; }
  get categoriaFilter() { return this.state.categoriaFilter; }
  get raridadeFilter() { return this.state.raridadeFilter; }
  get currentPage() { return this.state.currentPage; }
  get pageSize() { return this.state.pageSize; }
  get totalCount() { return this.state.totalCount; }
}

// Singleton instance
export const equipamentoViewModel = new EquipamentoViewModel();
export default EquipamentoViewModel;
