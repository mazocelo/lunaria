import { temaService } from '../../services/index.js';

class EditarTemaViewModel {
  constructor() {
    this.service = temaService;
    this.state = { id: null, nome: '', descricao: '', loading: false, saving: false, error: null };
    this.subscribers = [];
  }
  subscribe(callback) { this.subscribers.push(callback); return () => { this.subscribers = this.subscribers.filter(s => s !== callback); }; }
  notify() { this.subscribers.forEach(cb => cb(this.getState())); }
  setState(newState) { this.state = { ...this.state, ...newState }; this.notify(); }
  getState() { return { ...this.state }; }
  setField = (name, value) => { this.setState({ [name]: value }); };

  loadTema = async (id) => {
    this.setState({ loading: true, error: null });
    try {
      const { data } = await this.service.getById(id);
      this.setState({ id: data.id, nome: data.nome || '', descricao: data.descricao || '', loading: false });
    } catch (error) { this.setState({ loading: false, error: `Erro ao carregar tema: ${error.message}` }); }
  };

  criarTema = async () => {
    if (!this.state.nome.trim()) { this.setState({ error: 'Nome e obrigatorio' }); return { success: false }; }
    this.setState({ saving: true, error: null });
    try { await this.service.create({ nome: this.state.nome, descricao: this.state.descricao || null }); this.setState({ saving: false }); return { success: true }; }
    catch (error) { this.setState({ saving: false, error: `Erro ao criar tema: ${error.message}` }); return { success: false }; }
  };

  saveTema = async () => {
    if (!this.state.nome.trim()) { this.setState({ error: 'Nome e obrigatorio' }); return { success: false }; }
    this.setState({ saving: true, error: null });
    try { await this.service.update(this.state.id, { nome: this.state.nome, descricao: this.state.descricao || null }); this.setState({ saving: false }); return { success: true }; }
    catch (error) { this.setState({ saving: false, error: `Erro ao salvar tema: ${error.message}` }); return { success: false }; }
  };

  reset = () => { this.setState({ id: null, nome: '', descricao: '', loading: false, saving: false, error: null }); };
  clearError = () => this.setState({ error: null });

  get nome() { return this.state.nome; }
  get descricao() { return this.state.descricao; }
  get loading() { return this.state.loading; }
  get saving() { return this.state.saving; }
  get error() { return this.state.error; }
}

export const editarTemaViewModel = new EditarTemaViewModel();
export default EditarTemaViewModel;
