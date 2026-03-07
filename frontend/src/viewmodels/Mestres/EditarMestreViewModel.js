import { mestreService } from '../../services/index.js';

class EditarMestreViewModel {
  constructor() {
    this.service = mestreService;
    this.state = {
      id: null,
      nome: '',
      descricao: '',
      personalidade: '',
      modelo: 'openai/gpt-oss-120b',
      temperatura: 0.9,
      max_tokens: 8000,
      tom_narrativo: '',
      regras_especiais: '',
      imagem: '',
      loading: false,
      saving: false,
      error: null,
    };
    this.subscribers = [];
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(cb => cb(this.getState()));
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  getState() {
    return { ...this.state };
  }

  setField = (name, value) => {
    this.setState({ [name]: value });
  };

  loadMestre = async (id) => {
    this.setState({ loading: true, error: null });
    try {
      const { data } = await this.service.getById(id);
      this.setState({
        id: data.id,
        nome: data.nome || '',
        descricao: data.descricao || '',
        personalidade: data.personalidade || '',
        modelo: data.modelo || 'openai/gpt-oss-120b',
        temperatura: data.temperatura ?? 0.9,
        max_tokens: data.max_tokens ?? 8000,
        tom_narrativo: data.tom_narrativo || '',
        regras_especiais: data.regras_especiais || '',
        imagem: data.imagem || '',
        loading: false,
      });
    } catch (error) {
      this.setState({ loading: false, error: `Erro ao carregar mestre: ${error.message}` });
    }
  };

  _buildData() {
    const temp = parseFloat(this.state.temperatura);
    const tokens = parseInt(this.state.max_tokens);
    return {
      nome: this.state.nome,
      descricao: this.state.descricao || null,
      personalidade: this.state.personalidade || null,
      modelo: this.state.modelo || null,
      temperatura: isNaN(temp) ? 0.9 : temp,
      max_tokens: isNaN(tokens) ? 8000 : tokens,
      tom_narrativo: this.state.tom_narrativo || null,
      regras_especiais: this.state.regras_especiais || null,
      imagem: this.state.imagem || null,
    };
  }

  _invalidateStoreCache = async () => {
    try {
      const { useMestreStore } = await import('../../store/mestre/index.js');
      const { recarregarMestres } = useMestreStore.getState();
      await recarregarMestres();
    } catch (_) {
      // Store may not be initialized yet, safe to ignore
    }
  };

  criarMestre = async () => {
    if (!this.state.nome.trim()) {
      this.setState({ error: 'Nome é obrigatório' });
      return { success: false };
    }
    this.setState({ saving: true, error: null });
    try {
      await this.service.create(this._buildData());
      this.setState({ saving: false });
      this._invalidateStoreCache();
      return { success: true };
    } catch (error) {
      this.setState({ saving: false, error: `Erro ao criar mestre: ${error.message}` });
      return { success: false, error: error.message };
    }
  };

  saveMestre = async () => {
    if (!this.state.nome.trim()) {
      this.setState({ error: 'Nome é obrigatório' });
      return { success: false };
    }
    this.setState({ saving: true, error: null });
    try {
      await this.service.update(this.state.id, this._buildData());
      this.setState({ saving: false });
      this._invalidateStoreCache();
      return { success: true };
    } catch (error) {
      this.setState({ saving: false, error: `Erro ao salvar mestre: ${error.message}` });
      return { success: false, error: error.message };
    }
  };

  reset = () => {
    this.setState({
      id: null,
      nome: '',
      descricao: '',
      personalidade: '',
      modelo: 'openai/gpt-oss-120b',
      temperatura: 0.9,
      max_tokens: 8000,
      tom_narrativo: '',
      regras_especiais: '',
      imagem: '',
      loading: false,
      saving: false,
      error: null,
    });
  };

  clearError = () => this.setState({ error: null });

  get nome() { return this.state.nome; }
  get descricao() { return this.state.descricao; }
  get personalidade() { return this.state.personalidade; }
  get modelo() { return this.state.modelo; }
  get temperatura() { return this.state.temperatura; }
  get max_tokens() { return this.state.max_tokens; }
  get tom_narrativo() { return this.state.tom_narrativo; }
  get regras_especiais() { return this.state.regras_especiais; }
  get imagem() { return this.state.imagem; }
  get loading() { return this.state.loading; }
  get saving() { return this.state.saving; }
  get error() { return this.state.error; }
}

export const editarMestreViewModel = new EditarMestreViewModel();
export default EditarMestreViewModel;
