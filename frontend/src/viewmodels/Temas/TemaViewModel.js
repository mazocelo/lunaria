import { temaService } from '../../services/index.js';

class TemaViewModel {
  constructor() {
    this.service = temaService;
    this.state = { temas: [], loading: false, error: null };
    this.subscribers = [];
  }
  subscribe(callback) { this.subscribers.push(callback); return () => { this.subscribers = this.subscribers.filter(s => s !== callback); }; }
  notify() { this.subscribers.forEach(cb => cb(this.getState())); }
  setState(newState) { this.state = { ...this.state, ...newState }; this.notify(); }
  getState() { return { ...this.state }; }

  loadTemas = async () => {
    this.setState({ loading: true, error: null });
    try {
      const response = await this.service.getAll();
      this.setState({ temas: response.data || [], loading: false });
    } catch (error) { this.setState({ loading: false, error: `Erro ao carregar temas: ${error.message}` }); }
  };

  deleteTema = async (id) => {
    try {
      await this.service.delete(id);
      this.setState({ temas: this.state.temas.filter(t => t.id !== id) });
      return { success: true };
    } catch (error) { this.setState({ error: `Erro ao deletar tema: ${error.message}` }); return { success: false }; }
  };

  clearError = () => this.setState({ error: null });
  get temas() { return this.state.temas; }
  get loading() { return this.state.loading; }
  get error() { return this.state.error; }
}

export const temaViewModel = new TemaViewModel();
export default TemaViewModel;
