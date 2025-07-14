import { DesvantagemService } from '../../services/DesvantagemService';
import { apiClient } from '../../services/ApiClient';

export default class EditarDesvantagemViewModel {
  constructor() {
    this.service = new DesvantagemService(apiClient);
    this.state = {
      id: null,
      nome: '',
      descricao: '',
      custo: 0,
      tipo: '',
      elemento: '',
      nivel: 1,
      usar: 0,
      dano_base: '',
      loading: false,
      saving: false,
      error: null
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
    this.subscribers.forEach(callback => callback(this.getState()));
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

  loadDesvantagem = async (id) => {
    this.setState({ loading: true, error: null });
    try {
      const response = await this.service.getById(id);
      this.setState({
        ...response,
        loading: false
      });
    } catch (error) {
      this.setState({
        loading: false,
        error: `Erro ao carregar desvantagem: ${error.message}`
      });
    }
  };

  saveDesvantagem = async () => {
    this.setState({ saving: true, error: null });
    try {
      const desvantagemData = {
        nome: this.state.nome,
        descricao: this.state.descricao,
        custo: this.state.custo,
        tipo: this.state.tipo,
        elemento: this.state.elemento,
        nivel: this.state.nivel,
        usar: this.state.usar,
        dano_base: this.state.dano_base
      };

      await this.service.update(this.state.id, desvantagemData);
      this.setState({ saving: false });
      return { success: true };
    } catch (error) {
      this.setState({
        saving: false,
        error: `Erro ao salvar desvantagem: ${error.message}`
      });
      return { success: false, error: error.message };
    }
  };

  clearError = () => {
    this.setState({ error: null });
  };

  // Getters para facilitar o acesso aos dados
  get id() { return this.state.id; }
  get nome() { return this.state.nome; }
  get descricao() { return this.state.descricao; }
  get custo() { return this.state.custo; }
  get tipo() { return this.state.tipo; }
  get elemento() { return this.state.elemento; }
  get nivel() { return this.state.nivel; }
  get usar() { return this.state.usar; }
  get dano_base() { return this.state.dano_base; }
  get loading() { return this.state.loading; }
  get saving() { return this.state.saving; }
  get error() { return this.state.error; }
} 