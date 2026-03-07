import { racaService } from '../../services/index.js';

class EditarRacaViewModel {
  constructor() {
    this.service = racaService;
    this.state = {
      id: null,
      nome: '',
      descricao: '',
      custo: 0,
      bonus: '',
      loading: false,
      saving: false,
      error: null,
    };
    this.subscribers = [];
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => { this.subscribers = this.subscribers.filter(s => s !== callback); };
  }

  notify() { this.subscribers.forEach(cb => cb(this.getState())); }
  setState(newState) { this.state = { ...this.state, ...newState }; this.notify(); }
  getState() { return { ...this.state }; }
  setField = (name, value) => { this.setState({ [name]: value }); };

  loadRaca = async (id) => {
    this.setState({ loading: true, error: null });
    try {
      const { data } = await this.service.getById(id);
      this.setState({
        id: data.id,
        nome: data.nome || '',
        descricao: data.descricao || '',
        custo: data.custo ?? 0,
        bonus: data.bonus ? (typeof data.bonus === 'string' ? data.bonus : JSON.stringify(data.bonus, null, 2)) : '',
        loading: false,
      });
    } catch (error) {
      this.setState({ loading: false, error: `Erro ao carregar raca: ${error.message}` });
    }
  };

  _buildData() {
    let bonusObj = null;
    if (this.state.bonus) {
      try { bonusObj = JSON.parse(this.state.bonus); } catch { bonusObj = this.state.bonus; }
    }
    return {
      nome: this.state.nome,
      descricao: this.state.descricao || null,
      custo: parseInt(this.state.custo) || 0,
      bonus: bonusObj,
    };
  }

  criarRaca = async () => {
    if (!this.state.nome.trim()) { this.setState({ error: 'Nome e obrigatorio' }); return { success: false }; }
    this.setState({ saving: true, error: null });
    try {
      await this.service.create(this._buildData());
      this.setState({ saving: false });
      return { success: true };
    } catch (error) {
      this.setState({ saving: false, error: `Erro ao criar raca: ${error.message}` });
      return { success: false };
    }
  };

  saveRaca = async () => {
    if (!this.state.nome.trim()) { this.setState({ error: 'Nome e obrigatorio' }); return { success: false }; }
    this.setState({ saving: true, error: null });
    try {
      await this.service.update(this.state.id, this._buildData());
      this.setState({ saving: false });
      return { success: true };
    } catch (error) {
      this.setState({ saving: false, error: `Erro ao salvar raca: ${error.message}` });
      return { success: false };
    }
  };

  reset = () => {
    this.setState({ id: null, nome: '', descricao: '', custo: 0, bonus: '', loading: false, saving: false, error: null });
  };

  clearError = () => this.setState({ error: null });

  get nome() { return this.state.nome; }
  get descricao() { return this.state.descricao; }
  get custo() { return this.state.custo; }
  get bonus() { return this.state.bonus; }
  get loading() { return this.state.loading; }
  get saving() { return this.state.saving; }
  get error() { return this.state.error; }
}

export const editarRacaViewModel = new EditarRacaViewModel();
export default EditarRacaViewModel;
